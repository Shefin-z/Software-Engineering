import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { Window } from "happy-dom";

const window = new Window({ url: "http://localhost/student" });
const user = {
  id: 902,
  role: "student",
  name: "Adaptive Test Student",
  email: "adaptive@example.com",
  university: "United International University",
  degree: "BSc in CSE",
  graduation_year: 2027,
  target_role: "Backend Software Engineer",
  location: "Dhaka, Bangladesh",
  career_interests: ["Backend Engineering", "Cloud"],
};
window.localStorage.setItem("careerforge_token", "runtime-test-token");
window.localStorage.setItem("careerforge_session", JSON.stringify(user));
window.localStorage.setItem(`careerforge_student_section_${user.id}`, "assessments");

const levels = Array.from({ length: 50 }, (_, index) => ({
  level: index + 1,
  label: index === 0 ? "Foundation" : `Level ${index + 1}`,
  difficulty: index < 3 ? "Easy" : index < 7 ? "Intermediate" : "Hard",
  focus: "Test focus",
  state: index === 0 ? "unlocked" : "locked",
}));
const questions = Array.from({ length: 6 }, (_, index) => ({
  id: `q${index + 1}`,
  prompt: `Which approach is appropriate for backend scenario ${index + 1}?`,
  options: ["Use approach A", "Use approach B", "Use approach C", "Use approach D"],
  focusArea: `Backend skill ${index + 1}`,
}));
const overview = {
  aiConfigured: true,
  profileReady: true,
  missingFields: [],
  passingQuestionCount: 4,
  questionsPerLevel: 6,
  timeLimitMinutes: 12,
  activeAttempt: null,
  program: {
    currentLevel: 1,
    highestLevelCompleted: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    status: "active",
    levels,
  },
};

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => null },
  json: async () => structuredClone(data),
});
const fetchMock = async (url, options = {}) => {
  const target = String(url);
  if (target.endsWith("/api/auth/config")) return response({ features: { coverLetterEnabled: true }, ai: { coverLetterTone: "Professional" } });
  if (target.endsWith("/api/auth/me")) return response(user);
  if (target.endsWith("/api/assessments")) return response([]);
  if (target.endsWith("/api/adaptive-assessment/overview")) return response(overview);
  if (target.endsWith("/api/adaptive-assessment/start") && options.method === "POST") {
    return response({
      resumed: false,
      attempt: {
        id: "adaptive-attempt-test",
        level: 1,
        difficulty: "Easy",
        questions,
        questionCount: 6,
        passingQuestionCount: 4,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
      },
    }, 201);
  }
  if (target.endsWith("/api/jobs/recommendations")) return response({ items: [], matchingEnabled: true, profileReady: true, missingFields: [], aiConfigured: true, aiExplained: 0, verifiedSourceJobs: 0 });
  if (target.endsWith("/api/jobs") || target.endsWith("/api/jobs/applications/mine") || target.endsWith("/api/community/posts") || target.endsWith("/api/events")) return response([]);
  if (target.endsWith("/api/community/posting-status")) return response({ canPost: true, nextPostAt: null, cooldownHours: 12 });
  return response({ error: `Unexpected test URL: ${target}` }, 404);
};

for (const [key, value] of Object.entries({
  window,
  self: window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  history: window.history,
  localStorage: window.localStorage,
  sessionStorage: window.sessionStorage,
  fetch: fetchMock,
  Event: window.Event,
  CustomEvent: window.CustomEvent,
  MouseEvent: window.MouseEvent,
  FileReader: window.FileReader,
  Image: window.Image,
  HTMLElement: window.HTMLElement,
  HTMLAnchorElement: window.HTMLAnchorElement,
  Element: window.Element,
  Node: window.Node,
  Text: window.Text,
  MutationObserver: window.MutationObserver,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
})) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
window.fetch = fetchMock;
document.body.innerHTML = '<div id="root"></div>';

const assetsDir = path.resolve("dist", "client", "assets");
const bundleName = fs.readdirSync(assetsDir).find((file) => /^index-.*\.js$/.test(file));
if (!bundleName) throw new Error("Production JavaScript bundle was not found.");
vm.runInThisContext(fs.readFileSync(path.join(assetsDir, bundleName), "utf8"), { filename: bundleName });
await window.happyDOM.waitUntilComplete();
await new Promise((resolve) => setTimeout(resolve, 200));

const pageText = () => document.getElementById("root")?.textContent?.replace(/\s+/g, " ") || "";
if (!pageText().includes("Gemini adaptive journey") || !pageText().includes("Your 50-level skill map")) {
  throw new Error("The adaptive assessment journey did not render.");
}
const startButton = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Generate level 1"));
if (!startButton) throw new Error("The first adaptive level could not be started.");
startButton.click();
await new Promise((resolve) => setTimeout(resolve, 200));
if (!pageText().includes("Level 1 skill assessment") || !pageText().includes("QUESTION 1 OF 6")) {
  throw new Error("The generated six-question assessment modal did not open.");
}
if (![...document.querySelectorAll("button")].some((button) => button.getAttribute("aria-label") === "Save progress and close assessment")) {
  throw new Error("The adaptive assessment close button did not render.");
}

console.log(JSON.stringify({ status: "passed", levelMap: 50, questions: 6 }));
await window.happyDOM.close();
