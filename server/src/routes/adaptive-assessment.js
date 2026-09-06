const crypto = require("crypto");
const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { ensureAdaptiveAssessmentSchema } = require("../services/adaptive-assessment-schema");
const {
  LEVEL_CONFIG,
  MAX_LEVEL,
  geminiConfigured,
  generateAssessmentQuestions,
  gradeAssessmentQuestions,
  sanitiseQuestionsForClient,
} = require("../services/gemini-assessment");

const router = express.Router();
const PASSING_QUESTION_COUNT = 4;
const QUESTION_COUNT = 6;
const ATTEMPT_MINUTES = 12;
const DAILY_GENERATION_LIMIT = 10;

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role !== "student") return res.status(403).json({ error: "Student access required" });
  next();
});

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function profileInterests(profile) {
  return parseJson(profile?.career_interests, [])
    .map((interest) => String(interest || "").trim())
    .filter(Boolean);
}

function missingProfileFields(profile) {
  const fields = [];
  if (!String(profile?.university || "").trim()) fields.push("university");
  if (!String(profile?.degree || "").trim()) fields.push("degree");
  if (!String(profile?.graduation_year || "").trim()) fields.push("graduation year");
  if (!String(profile?.target_role || "").trim()) fields.push("target role");
  if (!String(profile?.location || "").trim()) fields.push("location");
  if (!profileInterests(profile).length) fields.push("career interests");
  return fields;
}

async function getProfile(userId) {
  await ensureAdaptiveAssessmentSchema();
  const [profile] = await query(
    `SELECT sp.university, sp.degree, sp.graduation_year, sp.target_role, sp.location, sp.career_interests
     FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id
     WHERE u.id=? AND u.role='student'`,
    [userId],
  );
  return profile || null;
}

async function getProgram(userId) {
  const [program] = await query(
    `SELECT user_id, current_level, highest_level_completed, total_questions, total_correct,
      status, started_at, completed_at, updated_at
     FROM adaptive_assessment_programs WHERE user_id=?`,
    [userId],
  );
  return program || null;
}

async function activeAttempt(userId) {
  await query(
    `UPDATE adaptive_assessment_attempts SET status='expired'
     WHERE user_id=? AND status='started' AND expires_at<=NOW()`,
    [userId],
  );
  const [attempt] = await query(
    `SELECT id, level_number, difficulty_label, questions_json, generated_model, started_at, expires_at
     FROM adaptive_assessment_attempts
     WHERE user_id=? AND status='started' AND expires_at>NOW()
     ORDER BY started_at DESC LIMIT 1`,
    [userId],
  );
  return attempt || null;
}

function clientAttempt(attempt) {
  if (!attempt) return null;
  return {
    id: attempt.id,
    level: Number(attempt.level_number),
    difficulty: attempt.difficulty_label,
    questions: sanitiseQuestionsForClient(parseJson(attempt.questions_json, [])),
    questionCount: QUESTION_COUNT,
    passingQuestionCount: PASSING_QUESTION_COUNT,
    startedAt: attempt.started_at,
    expiresAt: attempt.expires_at,
  };
}

function programPayload(program) {
  const currentLevel = Math.min(MAX_LEVEL, Math.max(1, Number(program?.current_level || 1)));
  const highestCompleted = Math.min(MAX_LEVEL, Math.max(0, Number(program?.highest_level_completed || 0)));
  return {
    currentLevel,
    highestLevelCompleted: highestCompleted,
    totalQuestions: Number(program?.total_questions || 0),
    totalCorrect: Number(program?.total_correct || 0),
    status: program?.status || "active",
    levels: LEVEL_CONFIG.map((level) => ({
      ...level,
      state: highestCompleted >= level.level
        ? "completed"
        : currentLevel === level.level && program?.status !== "completed"
          ? "unlocked"
          : "locked",
    })),
  };
}

router.get("/overview", async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    const missingFields = missingProfileFields(profile);
    const program = await getProgram(req.user.id);
    const attempt = await activeAttempt(req.user.id);
    res.json({
      aiConfigured: geminiConfigured(),
      profileReady: missingFields.length === 0,
      missingFields,
      passingQuestionCount: PASSING_QUESTION_COUNT,
      questionsPerLevel: QUESTION_COUNT,
      timeLimitMinutes: ATTEMPT_MINUTES,
      program: programPayload(program),
      activeAttempt: clientAttempt(attempt),
    });
  } catch (error) { next(error); }
});

router.post("/start", async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    const missingFields = missingProfileFields(profile);
    if (missingFields.length) {
      return res.status(422).json({
        error: `Complete your Personal & career details first: ${missingFields.join(", ")}`,
        code: "PROFILE_INCOMPLETE",
        missingFields,
      });
    }
    const running = await activeAttempt(req.user.id);
    if (running) return res.json({ resumed: true, attempt: clientAttempt(running) });

    let program = await getProgram(req.user.id);
    if (!program) {
      await query("INSERT INTO adaptive_assessment_programs (user_id) VALUES (?)", [req.user.id]);
      program = await getProgram(req.user.id);
    }
    if (program.status === "completed") return res.status(409).json({ error: "You have already completed all 10 levels" });

    const [usage] = await query(
      `SELECT COUNT(*) generation_count FROM adaptive_assessment_attempts
       WHERE user_id=? AND started_at>=DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [req.user.id],
    );
    if (Number(usage?.generation_count || 0) >= DAILY_GENERATION_LIMIT) {
      return res.status(429).json({ error: "Daily AI assessment limit reached. Try again after 24 hours." });
    }

    const levelNumber = Math.min(MAX_LEVEL, Math.max(1, Number(program.current_level || 1)));
    const earlierAttempts = await query(
      `SELECT questions_json FROM adaptive_assessment_attempts
       WHERE user_id=? AND level_number=? ORDER BY started_at DESC LIMIT 2`,
      [req.user.id, levelNumber],
    );
    const previousPrompts = earlierAttempts.flatMap((attempt) =>
      parseJson(attempt.questions_json, []).map((question) => question.prompt),
    );
    const generation = await generateAssessmentQuestions({
      profile: { ...profile, career_interests: profileInterests(profile) },
      levelNumber,
      previousPrompts,
    });
    const attemptId = crypto.randomUUID();
    const level = LEVEL_CONFIG[levelNumber - 1];
    const expiresAt = new Date(Date.now() + ATTEMPT_MINUTES * 60 * 1000);
    await query(
      `INSERT INTO adaptive_assessment_attempts
       (id, user_id, level_number, difficulty_label, profile_snapshot, questions_json, generated_model, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        req.user.id,
        levelNumber,
        level.difficulty,
        JSON.stringify({
          degree: profile.degree,
          targetRole: profile.target_role,
          careerInterests: profileInterests(profile),
        }),
        JSON.stringify(generation.questions),
        generation.model,
        expiresAt,
      ],
    );
    const attempt = await activeAttempt(req.user.id);
    res.status(201).json({ resumed: false, attempt: clientAttempt(attempt) });
  } catch (error) { next(error); }
});

router.get("/attempts/:id", async (req, res, next) => {
  try {
    await ensureAdaptiveAssessmentSchema();
    const [attempt] = await query(
      `SELECT id, level_number, difficulty_label, questions_json, generated_model, started_at, expires_at, status
       FROM adaptive_assessment_attempts WHERE id=? AND user_id=?`,
      [req.params.id, req.user.id],
    );
    if (!attempt) return res.status(404).json({ error: "Assessment attempt not found" });
    if (attempt.status !== "started" || new Date(attempt.expires_at).getTime() <= Date.now()) {
      if (attempt.status === "started") {
        await query("UPDATE adaptive_assessment_attempts SET status='expired' WHERE id=?", [attempt.id]);
      }
      return res.status(410).json({ error: "This assessment attempt has expired" });
    }
    res.json({ attempt: clientAttempt(attempt) });
  } catch (error) { next(error); }
});

router.post("/attempts/:id/submit", async (req, res, next) => {
  try {
    await ensureAdaptiveAssessmentSchema();
    const [attempt] = await query(
      `SELECT id, level_number, questions_json, status, expires_at
       FROM adaptive_assessment_attempts WHERE id=? AND user_id=?`,
      [req.params.id, req.user.id],
    );
    if (!attempt) return res.status(404).json({ error: "Assessment attempt not found" });
    if (attempt.status !== "started") return res.status(409).json({ error: "This assessment was already submitted" });
    if (new Date(attempt.expires_at).getTime() <= Date.now()) {
      await query("UPDATE adaptive_assessment_attempts SET status='expired' WHERE id=?", [attempt.id]);
      return res.status(410).json({ error: "This assessment attempt has expired" });
    }

    const questions = parseJson(attempt.questions_json, []);
    if (questions.length !== QUESTION_COUNT) return res.status(500).json({ error: "Assessment question data is invalid" });
    const submitted = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const { correctCount, review } = gradeAssessmentQuestions(questions, submitted);
    const percentage = Math.round((correctCount / QUESTION_COUNT) * 100);
    const passed = correctCount >= PASSING_QUESTION_COUNT;
    const update = await query(
      `UPDATE adaptive_assessment_attempts
       SET answers_json=?, status='completed', correct_count=?, percentage=?, passed=?, completed_at=NOW()
       WHERE id=? AND user_id=? AND status='started'`,
      [JSON.stringify(submitted), correctCount, percentage, passed, attempt.id, req.user.id],
    );
    if (!update.affectedRows) return res.status(409).json({ error: "This assessment was already submitted" });

    await query(
      `INSERT INTO adaptive_assessment_programs
       (user_id, current_level, highest_level_completed, total_questions, total_correct, status, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         current_level=VALUES(current_level),
         highest_level_completed=GREATEST(highest_level_completed, VALUES(highest_level_completed)),
         total_questions=total_questions + VALUES(total_questions),
         total_correct=total_correct + VALUES(total_correct),
         completed_at=IF(status='completed', completed_at, VALUES(completed_at)),
         status=IF(status='completed', status, VALUES(status))`,
      [
        req.user.id,
        passed ? Math.min(MAX_LEVEL, Number(attempt.level_number) + 1) : Number(attempt.level_number),
        passed ? Number(attempt.level_number) : Math.max(0, Number(attempt.level_number) - 1),
        QUESTION_COUNT,
        correctCount,
        passed && Number(attempt.level_number) === MAX_LEVEL ? "completed" : "active",
        passed && Number(attempt.level_number) === MAX_LEVEL ? new Date() : null,
      ],
    );
    const program = await getProgram(req.user.id);
    res.json({
      result: {
        level: Number(attempt.level_number),
        correctCount,
        questionCount: QUESTION_COUNT,
        percentage,
        passed,
        nextLevel: passed && Number(attempt.level_number) < MAX_LEVEL ? Number(attempt.level_number) + 1 : null,
        review,
      },
      program: programPayload(program),
    });
  } catch (error) { next(error); }
});

router.get("/history", async (req, res, next) => {
  try {
    await ensureAdaptiveAssessmentSchema();
    const rows = await query(
      `SELECT id, level_number level, difficulty_label difficulty, correct_count correctCount,
       percentage, passed, generated_model generatedModel, started_at startedAt, completed_at completedAt
       FROM adaptive_assessment_attempts
       WHERE user_id=? AND status='completed' ORDER BY completed_at DESC LIMIT 30`,
      [req.user.id],
    );
    res.json(rows.map((row) => ({ ...row, passed: Boolean(row.passed) })));
  } catch (error) { next(error); }
});

module.exports = router;
