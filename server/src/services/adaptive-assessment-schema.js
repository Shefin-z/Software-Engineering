const { query } = require("../config/db");
const { ensureProfileSchema } = require("./profile-schema");

let schemaPromise;

async function buildAdaptiveAssessmentSchema() {
  await ensureProfileSchema();
  await query(
    `CREATE TABLE IF NOT EXISTS adaptive_assessment_programs (
      user_id BIGINT UNSIGNED PRIMARY KEY,
      current_level TINYINT UNSIGNED NOT NULL DEFAULT 1,
      highest_level_completed TINYINT UNSIGNED NOT NULL DEFAULT 0,
      total_questions INT UNSIGNED NOT NULL DEFAULT 0,
      total_correct INT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_adaptive_program_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  );
  await query(
    `CREATE TABLE IF NOT EXISTS adaptive_assessment_attempts (
      id CHAR(36) PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      level_number TINYINT UNSIGNED NOT NULL,
      difficulty_label VARCHAR(80) NOT NULL,
      profile_snapshot JSON NOT NULL,
      questions_json JSON NOT NULL,
      answers_json JSON NULL,
      generated_model VARCHAR(100) NOT NULL,
      status ENUM('started', 'completed', 'expired') NOT NULL DEFAULT 'started',
      correct_count TINYINT UNSIGNED NULL,
      percentage DECIMAL(5,2) NULL,
      passed BOOLEAN NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      completed_at DATETIME NULL,
      CONSTRAINT fk_adaptive_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_adaptive_attempt_user_level (user_id, level_number, started_at),
      INDEX idx_adaptive_attempt_status_expiry (status, expires_at)
    )`,
  );
  await query(
    `UPDATE adaptive_assessment_programs
     SET current_level=11, status='active', completed_at=NULL
     WHERE status='completed' AND current_level<=10 AND highest_level_completed<=10`,
  );
}

async function ensureAdaptiveAssessmentSchema() {
  if (!schemaPromise) {
    schemaPromise = buildAdaptiveAssessmentSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

module.exports = { ensureAdaptiveAssessmentSchema };
