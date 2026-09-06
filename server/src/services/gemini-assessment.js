const { GoogleGenAI } = require("@google/genai");

const LEVEL_STAGES = Object.freeze([
  { label: "Foundation", difficulty: "Easy", focus: "essential vocabulary and first principles" },
  { label: "Core concepts", difficulty: "Easy", focus: "basic concepts and direct application" },
  { label: "Applied basics", difficulty: "Easy to medium", focus: "small practical scenarios" },
  { label: "Developing", difficulty: "Developing", focus: "connected concepts and common trade-offs" },
  { label: "Intermediate", difficulty: "Intermediate", focus: "practical problem solving" },
  { label: "Proficient", difficulty: "Intermediate plus", focus: "multi-step reasoning and professional practice" },
  { label: "Challenging", difficulty: "Challenging", focus: "edge cases and nuanced decisions" },
  { label: "Advanced", difficulty: "Advanced", focus: "architecture, evaluation and complex scenarios" },
  { label: "Hard", difficulty: "Hard", focus: "deep technical judgment and difficult trade-offs" },
  { label: "Expert", difficulty: "Expert", focus: "expert synthesis, ambiguity and high-impact decisions" },
]);

const LEVELS_PER_STAGE = 5;
const LEVEL_CONFIG = Object.freeze(LEVEL_STAGES.flatMap((stage, stageIndex) =>
  Array.from({ length: LEVELS_PER_STAGE }, (_, levelIndex) => ({
    level: (stageIndex * LEVELS_PER_STAGE) + levelIndex + 1,
    ...stage,
  })),
));
const MAX_LEVEL = LEVEL_CONFIG.length;

const QUESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "options", "correctIndex", "explanation", "focusArea"],
        properties: {
          prompt: { type: "string", minLength: 12, maxLength: 500 },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string", minLength: 1, maxLength: 240 },
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string", minLength: 10, maxLength: 700 },
          focusArea: { type: "string", minLength: 2, maxLength: 100 },
        },
      },
    },
  },
};

function cleanText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeInterests(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .map((interest) => cleanText(interest, 60))
    .filter(Boolean))]
    .slice(0, 8);
}

function buildAssessmentPrompt(profile, levelNumber, previousPrompts = []) {
  const level = LEVEL_CONFIG[levelNumber - 1];
  if (!level) throw new Error("Invalid assessment level");

  const degree = cleanText(profile.degree, 120);
  const targetRole = cleanText(profile.target_role || profile.targetRole, 120);
  const interests = normalizeInterests(profile.career_interests || profile.careerInterests);
  const avoided = (Array.isArray(previousPrompts) ? previousPrompts : [])
    .map((prompt) => cleanText(prompt, 300))
    .filter(Boolean)
    .slice(-12);

  return [
    "You are an expert career skills assessor.",
    "Create exactly 6 high-quality multiple-choice questions for one assessment level.",
    `Student degree: ${degree}`,
    `Target role: ${targetRole}`,
    `Career interests: ${interests.join(", ")}`,
    `Level: ${level.level} of ${MAX_LEVEL} (${level.label})`,
    `Difficulty: ${level.difficulty}`,
    `Focus: ${level.focus}`,
    "Every question must assess knowledge or applied judgment relevant to this exact degree, target role and interests.",
    "Use four distinct, plausible options. Only one option may be correct.",
    "Avoid trivia, trick wording, unsafe advice, discriminatory assumptions and questions requiring private personal data.",
    "Make the six questions cover different skills. Do not mention that an AI generated them.",
    avoided.length ? `Do not repeat these earlier questions: ${avoided.join(" | ")}` : "",
    "Return only the requested structured JSON.",
  ].filter(Boolean).join("\n");
}

function normalizeGeneratedQuestions(payload) {
  const source = Array.isArray(payload?.questions) ? payload.questions : [];
  if (source.length !== 6) throw new Error("Gemini did not return exactly six questions");

  const prompts = new Set();
  return source.map((question, index) => {
    const prompt = cleanText(question?.prompt, 500);
    const options = (Array.isArray(question?.options) ? question.options : [])
      .map((option) => cleanText(option, 240));
    const correctIndex = Number(question?.correctIndex);
    const explanation = cleanText(question?.explanation, 700);
    const focusArea = cleanText(question?.focusArea, 100);
    const uniqueOptions = new Set(options.map((option) => option.toLowerCase()));

    if (prompt.length < 12 || prompts.has(prompt.toLowerCase())) throw new Error("Gemini returned an invalid or repeated question");
    if (options.length !== 4 || options.some((option) => !option) || uniqueOptions.size !== 4) {
      throw new Error("Gemini returned invalid answer options");
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new Error("Gemini returned an invalid correct answer");
    }
    if (explanation.length < 10 || focusArea.length < 2) throw new Error("Gemini returned incomplete question metadata");
    prompts.add(prompt.toLowerCase());
    return {
      id: `q${index + 1}`,
      prompt,
      options,
      correctIndex,
      explanation,
      focusArea,
    };
  });
}

function sanitiseQuestionsForClient(questions) {
  return questions.map(({ correctIndex: _correctIndex, explanation: _explanation, ...question }) => question);
}

function gradeAssessmentQuestions(questions, submittedAnswers) {
  const answerMap = new Map((Array.isArray(submittedAnswers) ? submittedAnswers : []).flatMap((answer) => {
    if (answer?.optionIndex == null) return [];
    const optionIndex = Number(answer?.optionIndex);
    if (!answer?.questionId || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return [];
    return [[String(answer.questionId), optionIndex]];
  }));
  const review = questions.map((question) => {
    const selectedIndex = answerMap.has(question.id) ? answerMap.get(question.id) : null;
    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      selectedIndex,
      correctIndex: question.correctIndex,
      correct: selectedIndex === question.correctIndex,
      explanation: question.explanation,
      focusArea: question.focusArea,
    };
  });
  return {
    correctCount: review.filter((item) => item.correct).length,
    review,
  };
}

function configuredApiKey() {
  return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
}

function geminiConfigured() {
  return Boolean(configuredApiKey());
}

function fallbackContext(profile, levelNumber) {
  const level = LEVEL_CONFIG[levelNumber - 1];
  if (!level) throw new Error("Invalid assessment level");

  const role = cleanText(profile?.target_role || profile?.targetRole, 120) || "your target role";
  const degree = cleanText(profile?.degree, 120) || "your field of study";
  const interests = normalizeInterests(profile?.career_interests || profile?.careerInterests);
  return {
    level,
    role,
    degree,
    interest: interests[0] || "your career interests",
  };
}

function generateFallbackQuestions({ profile, levelNumber }) {
  const { level, role, degree, interest } = fallbackContext(profile, levelNumber);
  const levelNote = `This is level ${level.level} (${level.label}), focused on ${level.focus}.`;
  const questions = [
    {
      prompt: `Before starting a ${role} task related to ${interest}, what is the best first step?`,
      options: [
        "Clarify the goal, constraints, success criteria, and available evidence",
        "Choose a solution based only on the first idea",
        "Start implementation before talking to anyone",
        "Copy an unrelated past solution without review",
      ],
      correctIndex: 0,
      explanation: "Strong work starts with a clear problem definition so the solution can be evaluated against real needs.",
      focusArea: "Problem framing",
    },
    {
      prompt: `You receive information for a ${degree} project, but some values look incomplete. What should you do before using it to make a decision?`,
      options: [
        "Check the source, completeness, and consistency of the information",
        "Treat every value as correct because it is already available",
        "Delete all records and begin without evidence",
        "Choose only the values that support the preferred conclusion",
      ],
      correctIndex: 0,
      explanation: "Validating information quality reduces avoidable mistakes and makes decisions more reliable.",
      focusArea: "Evidence quality",
    },
    {
      prompt: `While working with others on a ${role} deliverable, which practice best keeps the team aligned?`,
      options: [
        "Record decisions, share progress, and make changes traceable",
        "Keep changes private until the final deadline",
        "Let each person use a different goal without discussion",
        "Avoid asking for feedback to save time",
      ],
      correctIndex: 0,
      explanation: "Visible decisions and traceable changes help a team coordinate, review work, and recover from mistakes.",
      focusArea: "Collaboration",
    },
    {
      prompt: `A proposed solution for ${interest} appears to work once. What is the most responsible next step?`,
      options: [
        "Test it against the agreed success criteria and realistic edge cases",
        "Assume one successful attempt proves it will always work",
        "Release it without checking the expected outcome",
        "Change the success criteria after seeing the result",
      ],
      correctIndex: 0,
      explanation: "Testing against agreed criteria and edge cases shows whether a solution is dependable beyond a single example.",
      focusArea: "Quality assurance",
    },
    {
      prompt: `A stakeholder asks you to include private student or customer information in a ${role} report. What should you do?`,
      options: [
        "Use only authorized, necessary data and protect identities where possible",
        "Include every personal detail to make the report more convincing",
        "Share the data in a public channel for faster feedback",
        "Ignore privacy requirements when a deadline is close",
      ],
      correctIndex: 0,
      explanation: "Professional work respects privacy, uses the minimum necessary data, and follows authorization requirements.",
      focusArea: "Ethics and privacy",
    },
    {
      prompt: `After completing a ${role} task, what should a useful update to stakeholders include?`,
      options: [
        "The outcome, supporting evidence, limitations, and recommended next step",
        "Only a claim that the work is finished",
        "Technical details without explaining their impact",
        "A promise of results without any evidence",
      ],
      correctIndex: 0,
      explanation: "A concise evidence-based update helps stakeholders understand what changed, what remains uncertain, and what to do next.",
      focusArea: "Professional communication",
    },
  ].map((question, index) => ({
    ...question,
    id: `q${index + 1}`,
    explanation: `${question.explanation} ${levelNote}`,
  }));

  return normalizeGeneratedQuestions({ questions });
}

function providerErrorSummary(cause) {
  return {
    status: Number(cause?.status || cause?.statusCode || cause?.response?.status) || null,
    code: String(cause?.code || cause?.name || "provider_error"),
    message: cleanText(cause?.message, 220) || "Unknown Gemini provider error",
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function generateAssessmentQuestions({ profile, levelNumber, previousPrompts = [] }) {
  const apiKey = configuredApiKey();
  if (!apiKey) {
    console.warn("Adaptive assessment is using the resilient question set because Gemini is not configured.");
    return {
      model: "careercube-resilient-question-set-v1",
      questions: generateFallbackQuestions({ profile, levelNumber }),
    };
  }

  const model = String(process.env.GEMINI_MODEL || "gemini-3.6-flash").trim();
  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildAssessmentPrompt(profile, levelNumber, previousPrompts);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.35,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseJsonSchema: QUESTION_SCHEMA,
        },
      });
      const text = response.text;
      if (!text) throw new Error("Gemini returned an empty response");
      return {
        model: response.modelVersion || model,
        questions: normalizeGeneratedQuestions(JSON.parse(text)),
      };
    } catch (cause) {
      lastError = cause;
      console.warn("Adaptive Gemini generation attempt failed", {
        attempt,
        model,
        ...providerErrorSummary(cause),
      });
      if (attempt < 2) await wait(350 * attempt);
    }
  }

  console.warn("Adaptive assessment is using the resilient question set after Gemini retries failed", {
    model,
    ...providerErrorSummary(lastError),
  });
  return {
    model: "careercube-resilient-question-set-v1",
    questions: generateFallbackQuestions({ profile, levelNumber }),
  };
}

module.exports = {
  LEVEL_CONFIG,
  MAX_LEVEL,
  QUESTION_SCHEMA,
  buildAssessmentPrompt,
  normalizeGeneratedQuestions,
  sanitiseQuestionsForClient,
  gradeAssessmentQuestions,
  geminiConfigured,
  generateFallbackQuestions,
  generateAssessmentQuestions,
};
