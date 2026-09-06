const express = require("express");
const { query } = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { ensureAdaptiveAssessmentSchema } = require("../services/adaptive-assessment-schema");
const { ensureJobSchema } = require("../services/job-schema");
const { ensureProfileSchema } = require("../services/profile-schema");
const { ensureMatchingSchema } = require("../services/matching-schema");
const { MAX_LEVEL } = require("../services/gemini-assessment");
const {
  average,
  calculateProfileCompletion,
  calculateReadiness,
  clampPercentage,
} = require("../services/student-overview");

const router = express.Router();
const signalTones = ["bg-cobalt", "bg-jade", "bg-coral", "bg-plum"];

router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role !== "student") return res.status(403).json({ error: "Student access required" });
  next();
});

router.get("/overview", async (req, res, next) => {
  try {
    await Promise.all([
      ensureProfileSchema(),
      ensureMatchingSchema(),
      ensureAdaptiveAssessmentSchema(),
      ensureJobSchema(),
    ]);

    const [
      profileRows,
      assessmentRows,
      adaptiveRows,
      programRows,
      applicationRows,
      jobRows,
      learningRows,
      skillRows,
    ] = await Promise.all([
      query(
        `SELECT u.name, u.email, p.university, p.degree, p.graduation_year,
                p.target_role, p.career_interests, p.location
         FROM users u
         LEFT JOIN student_profiles p ON p.user_id=u.id
         WHERE u.id=? AND u.role='student' LIMIT 1`,
        [req.user.id],
      ),
      query(
        `SELECT a.id, a.title, a.category, COUNT(DISTINCT q.id) question_count,
                MAX(aa.percentage) best_score
         FROM assessments a
         LEFT JOIN questions q ON q.assessment_id=a.id AND q.status='published'
         LEFT JOIN assessment_attempts aa ON aa.assessment_id=a.id AND aa.user_id=?
         WHERE a.status='published' AND a.created_by IS NOT NULL
         GROUP BY a.id
         HAVING COUNT(DISTINCT q.id)>0
         ORDER BY a.created_at DESC`,
        [req.user.id],
      ),
      query(
        `SELECT level_number, MAX(percentage) best_score
         FROM adaptive_assessment_attempts
         WHERE user_id=? AND status='completed' AND percentage IS NOT NULL
         GROUP BY level_number
         ORDER BY level_number`,
        [req.user.id],
      ),
      query(
        `SELECT current_level, highest_level_completed, status
         FROM adaptive_assessment_programs WHERE user_id=? LIMIT 1`,
        [req.user.id],
      ),
      query(
        `SELECT COUNT(*) total_count,
                COALESCE(SUM(status<>'withdrawn'), 0) active_count
         FROM applications WHERE user_id=?`,
        [req.user.id],
      ),
      query(
        `SELECT COUNT(*) available_count
         FROM jobs
         WHERE created_by IS NOT NULL AND status='live' AND expires_at>NOW()`,
      ),
      query(
        `SELECT COUNT(lr.id) available_count,
                COUNT(rp.resource_id) started_count,
                COALESCE(SUM(CASE WHEN rp.completed_at IS NOT NULL OR rp.progress_percentage>=100 THEN 1 ELSE 0 END), 0) completed_count,
                COALESCE(AVG(CASE WHEN rp.resource_id IS NOT NULL THEN rp.progress_percentage END), 0) average_progress
         FROM learning_resources lr
         LEFT JOIN resource_progress rp ON rp.resource_id=lr.id AND rp.user_id=?
         WHERE lr.status='published'`,
        [req.user.id],
      ),
      query(
        `SELECT s.name FROM user_skills us
         JOIN skills s ON s.id=us.skill_id
         WHERE us.user_id=? ORDER BY s.name`,
        [req.user.id],
      ),
    ]);

    const profile = { ...(profileRows[0] || {}), skills: skillRows.map((skill) => skill.name) };
    const program = programRows[0] || {};
    const applicationStats = applicationRows[0] || {};
    const jobStats = jobRows[0] || {};
    const learningStats = learningRows[0] || {};
    const profileCompletion = calculateProfileCompletion(profile);
    const manualScores = assessmentRows
      .map((assessment) => assessment.best_score)
      .filter((score) => score !== null && score !== undefined);
    const adaptiveScores = adaptiveRows
      .map((attempt) => attempt.best_score)
      .filter((score) => score !== null && score !== undefined);
    const assessmentPerformance = average([...manualScores, ...adaptiveScores]);
    const learningProgress = Math.round(clampPercentage(learningStats.average_progress));
    const readinessScore = calculateReadiness({
      profileCompletion,
      assessmentPerformance,
      learningProgress,
    });

    await query(
      "UPDATE student_profiles SET profile_completion=?, readiness_score=? WHERE user_id=?",
      [profileCompletion, readinessScore, req.user.id],
    );

    const signals = assessmentRows
      .filter((assessment) => assessment.best_score !== null && assessment.best_score !== undefined)
      .map((assessment) => ({
        label: assessment.category,
        score: Math.round(clampPercentage(assessment.best_score)),
      }));
    if (adaptiveScores.length) {
      signals.push({ label: "Adaptive assessment", score: average(adaptiveScores) });
    }
    const bestSignalByLabel = new Map();
    for (const signal of signals) {
      const previous = bestSignalByLabel.get(signal.label);
      if (!previous || signal.score > previous.score) bestSignalByLabel.set(signal.label, signal);
    }
    const skillSignals = [...bestSignalByLabel.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((signal, index) => ({ ...signal, tone: signalTones[index % signalTones.length] }));

    const completedAssessmentCount = assessmentRows.filter(
      (assessment) => assessment.best_score !== null && assessment.best_score !== undefined,
    ).length + adaptiveRows.length;
    const nextAssessment = assessmentRows.find(
      (assessment) => assessment.best_score === null || assessment.best_score === undefined,
    );
    const nextActions = [];
    if (profileCompletion < 100) {
      nextActions.push({
        id: "complete-profile",
        title: "Complete your career profile",
        detail: `${profileCompletion}% complete`,
        target: "profile",
        tone: "bg-cobalt",
      });
    }
    if (nextAssessment) {
      nextActions.push({
        id: `assessment-${nextAssessment.id}`,
        title: `Complete ${nextAssessment.title}`,
        detail: `${Number(nextAssessment.question_count || 0)} published questions`,
        target: "assessments",
        tone: "bg-coral",
      });
    }
    if (profileCompletion === 100 && program.status !== "completed") {
      nextActions.push({
        id: "adaptive-assessment",
        title: `${program.current_level ? "Continue" : "Start"} adaptive assessment`,
        detail: `Level ${Number(program.current_level || 1)} of ${MAX_LEVEL}`,
        target: "assessments",
        tone: "bg-jade",
      });
    }
    if (Number(learningStats.available_count || 0) > 0 && Number(learningStats.started_count || 0) === 0) {
      nextActions.push({
        id: "start-learning",
        title: "Start a published learning resource",
        detail: `${Number(learningStats.available_count || 0)} available`,
        target: "learning",
        tone: "bg-plum",
      });
    }
    if (Number(jobStats.available_count || 0) > 0 && Number(applicationStats.active_count || 0) === 0) {
      nextActions.push({
        id: "explore-jobs",
        title: "Explore live opportunities",
        detail: `${Number(jobStats.available_count || 0)} available jobs`,
        target: "jobs",
        tone: "bg-coral",
      });
    }

    res.json({
      readinessScore,
      calculation: {
        profileCompletion,
        assessmentPerformance,
        learningProgress,
        weights: { profile: 35, assessments: 45, learning: 20 },
      },
      metrics: {
        assessmentsPublished: assessmentRows.length,
        assessmentsCompleted: completedAssessmentCount,
        applicationsTotal: Number(applicationStats.total_count || 0),
        applicationsActive: Number(applicationStats.active_count || 0),
        availableJobs: Number(jobStats.available_count || 0),
        learningResources: Number(learningStats.available_count || 0),
        resourcesStarted: Number(learningStats.started_count || 0),
        resourcesCompleted: Number(learningStats.completed_count || 0),
      },
      skillSignals,
      nextActions: nextActions.slice(0, 3),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) { next(error); }
});

module.exports = router;
