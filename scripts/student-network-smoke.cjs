const assert = require("node:assert/strict");
const fs = require("node:fs");

const schema = fs.readFileSync("database/schema.sql", "utf8");
const route = fs.readFileSync("server/src/routes/student-network.js", "utf8");
const ui = fs.readFileSync("components/student/ConnectionsExperience.jsx", "utf8");
const workspace = fs.readFileSync("components/student/StudentWorkspace.jsx", "utf8");
const shell = fs.readFileSync("components/DashboardShell.jsx", "utf8");

assert.match(schema, /CREATE TABLE IF NOT EXISTS student_connections/, "Connection records need a database table");
assert.match(schema, /UNIQUE KEY uq_student_connection_pair/, "A pair of students should only have one connection record");
assert.match(schema, /CREATE TABLE IF NOT EXISTS student_messages/, "Private messages need a database table");
assert.match(schema, /connection_key VARCHAR\(64\)/, "Messages need a stable connection-pair key for legacy schemas");
assert.match(route, /router\.get\("\/students"/, "Students must be searchable");
assert.match(route, /router\.post\("\/connections"/, "Students must be able to send connection requests");
assert.match(route, /status='accepted'/, "Messages must be gated by an accepted connection");
assert.match(route, /router\.post\("\/conversations\/:connectionId\/messages"/, "Connected students must be able to send messages");
assert.match(route, /router\.delete\("\/conversations\/:connectionId\/messages\/:messageId"/, "Students must be able to delete a message they sent");
assert.match(route, /router\.delete\("\/conversations\/:connectionId\/messages"/, "Students must be able to clear a conversation history");
assert.match(route, /sender_id=\?/, "A student must not delete another student's message");
assert.match(route, /recipient_id=\? AND read_at IS NULL/, "Unread messages must be tracked per recipient");
assert.match(route, /connectionKeyFor/, "Connection APIs must work without relying on a legacy surrogate ID");
assert.match(route, /connection_record_id/, "Messages must use the connection record required by the database foreign key");
assert.match(ui, /\/network\/students\?q=/, "The inbox UI must call the live student search API");
assert.match(ui, /\/network\/conversations\//, "The inbox UI must load live conversations");
assert.match(ui, /onDecline/, "Incoming connection requests in search results must support declining");
assert.match(ui, /Clear history/, "The inbox UI must provide a clear-history action");
assert.match(ui, /deleteMessage/, "The inbox UI must provide per-message deletion");
assert.match(ui, /left !== null/, "Unconnected students must not be treated as a busy connection action");
assert.match(workspace, /id: "connections", label: "Connections & inbox"/, "The student workspace needs an inbox section");
assert.match(shell, /Search students by name or ID/, "The top bar must support student search");

console.log("Student network smoke test passed.");
