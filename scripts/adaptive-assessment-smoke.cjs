const assert = require("node:assert/strict");
const {
  LEVEL_CONFIG,
  buildAssessmentPrompt,
  generateFallbackQuestions,
  generateAssessmentQuestions,
  normalizeGeneratedQuestions,
  sanitiseQuestionsForClient,
  gradeAssessmentQuestions,
} = require("../server/src/services/gemini-assessment");

assert.equal(LEVEL_CONFIG.length, 50);
assert.equal(LEVEL_CONFIG[0].difficulty, "Easy");
assert.equal(LEVEL_CONFIG[49].difficulty, "Expert");

const profile = {
  degree: "BSc in CSE",
  target_role: "Software Engineer",
  career_interests: ["Backend Engineering", "Cloud"],
  name: "Private Name",
  email: "private@example.com",
};
const prompt = buildAssessmentPrompt(profile, 5);
assert.match(prompt, /BSc in CSE/);
assert.match(prompt, /Software Engineer/);
assert.match(prompt, /Backend Engineering, Cloud/);
assert.match(prompt, /Level: 5 of 50/);
assert.doesNotMatch(prompt, /Private Name|private@example\.com/);

const fallbackQuestions = generateFallbackQuestions({ profile, levelNumber: 5 });
assert.equal(fallbackQuestions.length, 6);
assert.equal(new Set(fallbackQuestions.map((question) => question.prompt)).size, 6);
assert.ok(fallbackQuestions.every((question) => question.options.length === 4));
assert.ok(fallbackQuestions.every((question) => Number.isInteger(question.correctIndex)));
assert.match(fallbackQuestions[0].prompt, /Software Engineer/);

const questions = normalizeGeneratedQuestions({
  questions: Array.from({ length: 6 }, (_, index) => ({
    prompt: `Which valid approach best solves scenario number ${index + 1}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctIndex: index % 4,
    explanation: "This option follows the relevant professional principle.",
    focusArea: `Skill ${index + 1}`,
  })),
});
assert.equal(questions.length, 6);
assert.equal(questions[0].id, "q1");
const clientQuestions = sanitiseQuestionsForClient(questions);
assert.equal(clientQuestions[0].correctIndex, undefined);
assert.equal(clientQuestions[0].explanation, undefined);
const grade = gradeAssessmentQuestions(questions, [
  { questionId: "q1", optionIndex: 0 },
  { questionId: "q2", optionIndex: 1 },
  { questionId: "q3", optionIndex: null },
  { questionId: "q4", optionIndex: 99 },
]);
assert.equal(grade.correctCount, 2);
assert.equal(grade.review[2].selectedIndex, null);

async function verifyResilientGeneration() {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGoogleKey = process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  try {
    const generation = await generateAssessmentQuestions({ profile, levelNumber: 1 });
    assert.equal(generation.model, "careercube-resilient-question-set-v1");
    assert.equal(generation.questions.length, 6);
  } finally {
    if (originalGeminiKey == null) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
    if (originalGoogleKey == null) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = originalGoogleKey;
  }
}

verifyResilientGeneration()
  .then(() => console.log("Adaptive assessment smoke test passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
