const express = require("express");
const { pool, query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { ensureProfileSchema } = require("../services/profile-schema");
const { ensureStudentNetworkSchema } = require("../services/student-network-schema");

const router = express.Router();

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function toId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function pairFor(firstId, secondId) {
  return firstId < secondId ? [firstId, secondId] : [secondId, firstId];
}

function connectionKeyFor(userAId, userBId) {
  return `${userAId}-${userBId}`;
}

function parseConnectionKey(value) {
  const match = String(value || "").match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  const firstId = toId(match[1]);
  const secondId = toId(match[2]);
  if (!firstId || !secondId || firstId === secondId) return null;
  return pairFor(firstId, secondId);
}

function studentFields(prefix = "") {
  return `${prefix}u.id student_id, u.name, sp.university, sp.degree, sp.target_role, sp.location,
          COALESCE(NULLIF(sp.avatar_data, ''), sp.avatar_url) avatar`;
}

function connectedSocialFields() {
  return `sp.facebook_url, sp.instagram_url, sp.whatsapp, sp.twitter_url, sp.telegram`;
}

function connectedSkillFields() {
  return `COALESCE((
    SELECT GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ', ')
    FROM user_skills us JOIN skills s ON s.id=us.skill_id
    WHERE us.user_id=u.id
  ), '') skills`;
}

async function getConnectionForStudent(connectionKey, studentId, { acceptedOnly = false } = {}) {
  const pair = parseConnectionKey(connectionKey);
  if (!pair) return null;
  const conditions = ["c.user_a_id=?", "c.user_b_id=?", "(c.user_a_id=? OR c.user_b_id=?)"];
  const values = [pair[0], pair[1], studentId, studentId];
  if (acceptedOnly) conditions.push("c.status='accepted'");
  const [connection] = await query(
    `SELECT c.id connection_record_id, c.user_a_id, c.user_b_id, c.requested_by_id, c.status, c.created_at, c.accepted_at
     FROM student_connections c WHERE ${conditions.join(" AND ")} LIMIT 1`,
    values,
  );
  return connection;
}

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role !== "student") return res.status(403).json({ error: "Student access required" });
  next();
});
router.use(async (_req, _res, next) => {
  try {
    await Promise.all([ensureStudentNetworkSchema(), ensureProfileSchema()]);
    next();
  } catch (error) { next(error); }
});

router.get("/students", async (req, res, next) => {
  try {
    const term = cleanText(req.query.q, 100);
    const isStudentId = /^\d+$/.test(term);
    if (!term || (!isStudentId && term.length < 2)) return res.json([]);

    // Do not rely on the database collation for name matching. Some deployments
    // use a case-sensitive collation, which would make "shefin" miss "Shefin".
    const like = `%${term.toLowerCase()}%`;
    const searchSql = isStudentId
      ? "AND (u.id=? OR LOWER(u.name) LIKE ? OR LOWER(COALESCE(sp.university, '')) LIKE ?)"
      : "AND (LOWER(u.name) LIKE ? OR LOWER(COALESCE(sp.university, '')) LIKE ? OR LOWER(COALESCE(sp.target_role, '')) LIKE ?)";
    const searchValues = isStudentId ? [Number(term), like, like] : [like, like, like];
    const rows = await query(
      `SELECT ${studentFields()}, CONCAT(c.user_a_id, '-', c.user_b_id) connection_id,
              CASE
                WHEN c.user_a_id IS NULL THEN 'none'
                WHEN c.status='accepted' THEN 'connected'
                WHEN c.requested_by_id=? THEN 'outgoing'
                ELSE 'incoming'
              END connection_status
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id=u.id
       LEFT JOIN student_connections c ON (c.user_a_id=? AND c.user_b_id=u.id)
                                      OR (c.user_b_id=? AND c.user_a_id=u.id)
       WHERE u.role='student' AND u.status='active' AND u.id<>? ${searchSql}
       ORDER BY CASE WHEN u.id=? THEN 0 ELSE 1 END, u.name ASC
       LIMIT 20`,
      [req.user.id, req.user.id, req.user.id, req.user.id, ...searchValues, isStudentId ? Number(term) : 0],
    );
    res.json(rows.map((student) => ({
      ...student,
      student_id: Number(student.student_id),
      connection_id: student.connection_id || null,
    })));
  } catch (error) { next(error); }
});

router.post("/connections", async (req, res, next) => {
  let connection;
  try {
    const targetId = toId(req.body.studentId);
    if (!targetId) return res.status(400).json({ error: "Choose a valid student" });
    if (targetId === Number(req.user.id)) return res.status(400).json({ error: "You cannot add yourself" });
    const [userAId, userBId] = pairFor(Number(req.user.id), targetId);
    const connectionKey = connectionKeyFor(userAId, userBId);

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [targetRows] = await connection.execute(
      "SELECT id FROM users WHERE id=? AND role='student' AND status='active' FOR UPDATE",
      [targetId],
    );
    if (!targetRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Student not found" });
    }
    const [existingRows] = await connection.execute(
      "SELECT requested_by_id, status FROM student_connections WHERE user_a_id=? AND user_b_id=? FOR UPDATE",
      [userAId, userBId],
    );
    const existing = existingRows[0];
    if (existing?.status === "accepted") {
      await connection.rollback();
      return res.status(409).json({ error: "You are already connected with this student" });
    }
    if (Number(existing?.requested_by_id) === Number(req.user.id)) {
      await connection.rollback();
      return res.status(409).json({ error: "Connection request already sent" });
    }
    if (existing) {
      await connection.execute(
        "UPDATE student_connections SET status='accepted', accepted_at=NOW() WHERE user_a_id=? AND user_b_id=?",
        [userAId, userBId],
      );
      await connection.commit();
      return res.json({ id: connectionKey, status: "accepted", message: "You are now connected. Start a conversation anytime." });
    }

    await connection.execute(
      "INSERT INTO student_connections (user_a_id, user_b_id, requested_by_id, status) VALUES (?, ?, ?, 'pending')",
      [userAId, userBId, req.user.id],
    );
    await connection.commit();
    res.status(201).json({ id: connectionKey, status: "pending", message: "Connection request sent" });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get("/connections", async (req, res, next) => {
  try {
    const [connections, incomingRequests] = await Promise.all([
      query(
        `SELECT CONCAT(c.user_a_id, '-', c.user_b_id) connection_id, c.created_at, c.accepted_at,
                ${studentFields()}, ${connectedSocialFields()}, ${connectedSkillFields()}, latest_message.body last_message, message_summary.last_message_at,
                COALESCE(message_summary.unread_count, 0) unread_count
         FROM student_connections c
         JOIN users u ON u.id=CASE WHEN c.user_a_id=? THEN c.user_b_id ELSE c.user_a_id END
         LEFT JOIN student_profiles sp ON sp.user_id=u.id
         LEFT JOIN (
           SELECT connection_id, MAX(id) latest_message_id, MAX(created_at) last_message_at,
                  SUM(CASE WHEN recipient_id=? AND read_at IS NULL THEN 1 ELSE 0 END) unread_count
           FROM student_messages
           GROUP BY connection_id
         ) message_summary ON message_summary.connection_id=c.id
         LEFT JOIN student_messages latest_message ON latest_message.id=message_summary.latest_message_id
         WHERE c.status='accepted' AND (c.user_a_id=? OR c.user_b_id=?)
         ORDER BY COALESCE(message_summary.last_message_at, c.accepted_at, c.created_at) DESC`,
        [req.user.id, req.user.id, req.user.id, req.user.id],
      ),
      query(
        `SELECT CONCAT(c.user_a_id, '-', c.user_b_id) connection_id, c.created_at, ${studentFields()}
         FROM student_connections c
         JOIN users u ON u.id=c.requested_by_id
         LEFT JOIN student_profiles sp ON sp.user_id=u.id
         WHERE c.status='pending' AND c.requested_by_id<>? AND (c.user_a_id=? OR c.user_b_id=?)
         ORDER BY c.created_at DESC`,
        [req.user.id, req.user.id, req.user.id],
      ),
    ]);
    const normalise = (record) => ({
      ...record,
      connection_id: String(record.connection_id),
      student_id: Number(record.student_id),
      unread_count: Number(record.unread_count || 0),
      skills: String(record.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 8),
    });
    res.json({
      connections: connections.map(normalise),
      incomingRequests: incomingRequests.map(normalise),
      unreadCount: connections.reduce((total, item) => total + Number(item.unread_count || 0), 0),
    });
  } catch (error) { next(error); }
});

router.patch("/connections/:id", async (req, res, next) => {
  try {
    const connectionKey = req.params.id;
    const pair = parseConnectionKey(connectionKey);
    const action = cleanText(req.body.action, 20);
    if (!pair || !["accept", "decline"].includes(action)) return res.status(400).json({ error: "Choose accept or decline" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id);
    if (!connection) return res.status(404).json({ error: "Connection request not found" });
    if (connection.status !== "pending" || Number(connection.requested_by_id) === Number(req.user.id)) {
      return res.status(409).json({ error: "This request is no longer awaiting your response" });
    }
    if (action === "accept") {
      await query("UPDATE student_connections SET status='accepted', accepted_at=NOW() WHERE user_a_id=? AND user_b_id=?", pair);
      return res.json({ id: connectionKeyFor(pair[0], pair[1]), status: "accepted", message: "Connection accepted. You can now message each other." });
    }
    await query("DELETE FROM student_connections WHERE user_a_id=? AND user_b_id=?", pair);
    res.json({ id: connectionKeyFor(pair[0], pair[1]), status: "declined", message: "Connection request declined" });
  } catch (error) { next(error); }
});

router.delete("/connections/:id", async (req, res, next) => {
  try {
    const connectionKey = req.params.id;
    const pair = parseConnectionKey(connectionKey);
    if (!pair) return res.status(400).json({ error: "Choose a valid connection" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id);
    if (!connection) return res.status(404).json({ error: "Connection not found" });
    await query("DELETE FROM student_messages WHERE connection_id=?", [connection.connection_record_id]);
    await query("DELETE FROM student_connections WHERE user_a_id=? AND user_b_id=?", pair);
    res.json({ message: connection.status === "accepted" ? "Connection removed" : "Connection request cancelled" });
  } catch (error) { next(error); }
});

router.get("/conversations/:connectionId/messages", async (req, res, next) => {
  try {
    const connectionKey = req.params.connectionId;
    const pair = parseConnectionKey(connectionKey);
    if (!pair) return res.status(400).json({ error: "Choose a valid conversation" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id, { acceptedOnly: true });
    if (!connection) return res.status(404).json({ error: "Conversation not found" });
    await query(
      "UPDATE student_messages SET read_at=NOW() WHERE connection_id=? AND recipient_id=? AND read_at IS NULL",
      [connection.connection_record_id, req.user.id],
    );
    const messages = await query(
      `SELECT id, connection_key, sender_id, recipient_id, body, read_at, created_at
       FROM student_messages WHERE connection_id=? ORDER BY created_at ASC, id ASC LIMIT 200`,
      [connection.connection_record_id],
    );
    res.json(messages.map((message) => ({
      ...message,
      id: Number(message.id),
      sender_id: Number(message.sender_id),
      recipient_id: Number(message.recipient_id),
    })));
  } catch (error) { next(error); }
});

router.post("/conversations/:connectionId/messages", async (req, res, next) => {
  try {
    const connectionKey = req.params.connectionId;
    const pair = parseConnectionKey(connectionKey);
    const body = cleanText(req.body.body, 2000);
    if (!pair) return res.status(400).json({ error: "Choose a valid conversation" });
    if (!body) return res.status(400).json({ error: "Write a message before sending" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id, { acceptedOnly: true });
    if (!connection) return res.status(404).json({ error: "Conversation not found" });
    const recipientId = Number(connection.user_a_id) === Number(req.user.id)
      ? Number(connection.user_b_id)
      : Number(connection.user_a_id);
    const canonicalKey = connectionKeyFor(pair[0], pair[1]);
    const result = await query(
      "INSERT INTO student_messages (connection_id, connection_key, sender_id, recipient_id, body) VALUES (?, ?, ?, ?, ?)",
      [connection.connection_record_id, canonicalKey, req.user.id, recipientId, body],
    );
    const [message] = await query(
      "SELECT id, connection_key, sender_id, recipient_id, body, read_at, created_at FROM student_messages WHERE id=? LIMIT 1",
      [result.insertId],
    );
    res.status(201).json({
      ...message,
      id: Number(message.id),
      sender_id: Number(message.sender_id),
      recipient_id: Number(message.recipient_id),
    });
  } catch (error) { next(error); }
});

router.delete("/conversations/:connectionId/messages/:messageId", async (req, res, next) => {
  try {
    const connectionKey = req.params.connectionId;
    const pair = parseConnectionKey(connectionKey);
    const messageId = toId(req.params.messageId);
    if (!pair || !messageId) return res.status(400).json({ error: "Choose a valid message" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id, { acceptedOnly: true });
    if (!connection) return res.status(404).json({ error: "Conversation not found" });
    const result = await query(
      "DELETE FROM student_messages WHERE id=? AND connection_id=? AND sender_id=?",
      [messageId, connection.connection_record_id, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Only messages you sent can be deleted" });
    res.json({ message: "Message deleted" });
  } catch (error) { next(error); }
});

router.delete("/conversations/:connectionId/messages", async (req, res, next) => {
  try {
    const connectionKey = req.params.connectionId;
    const pair = parseConnectionKey(connectionKey);
    if (!pair) return res.status(400).json({ error: "Choose a valid conversation" });
    const connection = await getConnectionForStudent(connectionKey, req.user.id, { acceptedOnly: true });
    if (!connection) return res.status(404).json({ error: "Conversation not found" });
    await query("DELETE FROM student_messages WHERE connection_id=?", [connection.connection_record_id]);
    res.json({ message: "Conversation history cleared" });
  } catch (error) { next(error); }
});

module.exports = router;
