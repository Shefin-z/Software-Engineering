import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Award,
  BarChart3,
  BellRing,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  Eye,
  Facebook,
  FileCheck2,
  FileText,
  Filter,
  Flame,
  Gauge,
  Heart,
  Instagram,
  Lightbulb,
  Link2,
  ListChecks,
  MapPin,
  Medal,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Twitter,
  Upload,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import DashboardShell from "../DashboardShell";
import Toast from "../Toast";
import { CommunityPage, CommunityPostCooldown, CommunityPostModal } from "./CommunityExperience";
import ConnectionsPage from "./ConnectionsExperience";
import {
  achievements as seedAchievements,
  resources,
} from "../../lib/mockData";
import { apiRequest } from "../../lib/api";
import { socialProfileApiValue, socialProfileDisplay, socialProfileError, socialProfileHref } from "../../lib/socialProfiles";

const navItems = [
  { id: "overview", label: "Overview", icon: Gauge, group: "Workspace" },
  { id: "jobs", label: "Available jobs", icon: BriefcaseBusiness },
  { id: "applications", label: "My applications", icon: FileCheck2 },
  { id: "vault", label: "Career Vault", icon: FileText },
  { id: "assessments", label: "Skill assessments", icon: ListChecks, group: "Growth" },
  { id: "analytics", label: "Performance", icon: BarChart3 },
  { id: "learning", label: "Learning resources", icon: BookOpen },
  { id: "community", label: "Community", icon: Users, badge: "New", group: "Connect" },
  { id: "connections", label: "Connections & inbox", icon: MessageCircle },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "profile", label: "Profile & settings", icon: Settings, group: "Account" },
];

const pageMeta = {
  overview: ["Overview", "Here’s what is moving your career forward today."],
  jobs: ["Available jobs", "Real, unexpired opportunities published by CareerCube administrators."],
  applications: ["Application tracker", "Stay on top of every opportunity and follow-up."],
  vault: ["Career Vault", "Build, refine and export your professional story."],
  assessments: ["Skill assessments", "Measure what you know and make the next learning step obvious."],
  analytics: ["Performance intelligence", "A clear view of your skills, consistency and readiness."],
  learning: ["Learning resources", "Focused material selected for the roles you want."],
  community: ["Career community", "Learn in public, ask better questions and celebrate progress."],
  connections: ["Connections & inbox", "Find CareerCube students, build your network, and message privately."],
  events: ["Events & workshops", "Meet recruiters, mentors and students building alongside you."],
  achievements: ["Your milestones", "Proof that consistent effort is becoming real progress."],
  profile: ["Profile & preferences", "Keep your career signal accurate and your experience personal."],
};

const studentSectionIds = new Set(Object.keys(pageMeta));

const getInitials = (name) => String(name || "Student")
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const socialProfileFields = [
  { key: "facebook_url", label: "Facebook", Icon: Facebook, placeholder: "facebook.com/your.profile", tone: "facebook", maxLength: 500 },
  { key: "instagram_url", label: "Instagram", Icon: Instagram, placeholder: "@username or instagram.com/username", tone: "instagram", maxLength: 500 },
  { key: "whatsapp", label: "WhatsApp", Icon: Phone, placeholder: "+8801712345678", tone: "whatsapp", maxLength: 20, type: "tel" },
  { key: "twitter_url", label: "X / Twitter", Icon: Twitter, placeholder: "@username or x.com/username", tone: "twitter", maxLength: 500 },
  { key: "telegram", label: "Telegram", Icon: Send, placeholder: "@username or t.me/username", tone: "telegram", maxLength: 32 },
];

const socialProfileValues = (user = {}) => Object.fromEntries(
  socialProfileFields.map(({ key }) => [key, user[key] || ""]),
);

function readStudentUser() {
  try {
    const session = JSON.parse(localStorage.getItem("careerforge_session"));
    if (session?.role === "student") {
      return {
        ...session,
        name: session.name || "Student",
        email: session.email || "",
      };
    }
  } catch {}
  return { name: "Student", email: "", role: "student" };
}

const getStudentSectionStorageKey = (user) => {
  const owner = String(user?.id || user?.email || "student").trim().toLowerCase();
  return `careerforge_student_section_${owner}`;
};

function readStudentSection() {
  try {
    const user = readStudentUser();
    const saved = localStorage.getItem(getStudentSectionStorageKey(user));
    if (studentSectionIds.has(saved)) return saved;
  } catch {}
  return "overview";
}

function prepareProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file?.type)) {
      reject(new Error("Choose a JPG, PNG or WebP photo."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Choose a photo smaller than 8 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected photo could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a valid image."));
      image.onload = () => {
        const maximumSide = 640;
        const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#f7f4ee";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg", 0.84);
        if (data.length > 1_400_000) {
          reject(new Error("The compressed photo is still too large. Choose another image."));
          return;
        }
        resolve(data);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const createCvData = (user) => ({
  name: user.name || "Student",
  title: "",
  email: user.email || "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  skills: "",
  education: [],
  languages: [],
  experiences: [],
  projects: [],
  certifications: [],
});

const getCvStorageKey = (user) => {
  const owner = String(user.email || user.id || user.name || "student")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "-");
  return `careerforge_cv_${owner}`;
};

function readCvData(user) {
  const empty = createCvData(user);
  try {
    const saved = JSON.parse(localStorage.getItem(getCvStorageKey(user)));
    if (!saved || typeof saved !== "object") return empty;
    return {
      ...empty,
      ...saved,
      name: saved.name || empty.name,
      email: saved.email || empty.email,
      education: Array.isArray(saved.education) ? saved.education : [],
      languages: Array.isArray(saved.languages) ? saved.languages : [],
      experiences: Array.isArray(saved.experiences) ? saved.experiences : [],
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      certifications: Array.isArray(saved.certifications) ? saved.certifications : [],
    };
  } catch {
    return empty;
  }
}

const createItemId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const jobTones = ["bg-coral", "bg-cobalt", "bg-plum", "bg-jade", "bg-ink"];

const formatJobSalary = (job) => {
  const minimum = job.salary_min == null ? null : Number(job.salary_min);
  const maximum = job.salary_max == null ? null : Number(job.salary_max);
  if (minimum == null && maximum == null) return "Salary not disclosed";
  const formatter = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });
  if (minimum != null && maximum != null) return `${job.currency || "BDT"} ${formatter.format(minimum)}–${formatter.format(maximum)}`;
  return `${job.currency || "BDT"} ${formatter.format(minimum ?? maximum)}`;
};

const splitJobDetails = (value) => String(value || "")
  .split(/\r?\n|[,;]+/)
  .map((item) => item.trim().replace(/^[-•]\s*/, ""))
  .filter(Boolean);

const normalizeJob = (job, index = 0) => ({
  ...job,
  company: job.company || job.company_name || "Company",
  type: job.employment_type,
  displayLocation: [job.location, job.workplace_type].filter(Boolean).join(" · "),
  salary: formatJobSalary(job),
  logo: String(job.company || job.company_name || "C").trim().charAt(0).toUpperCase(),
  tone: jobTones[index % jobTones.length],
  requirementsList: splitJobDetails(job.requirements),
  responsibilitiesList: splitJobDetails(job.responsibilities),
  already_applied: Number(job.already_applied) === 1 || job.already_applied === true,
});

const normalizeApplication = (application, index = 0) => ({
  ...application,
  role: application.title,
  applied: application.applied_at ? new Date(application.applied_at).toLocaleDateString() : "Submitted",
  displayStatus: String(application.status || "applied").replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
  tone: jobTones[index % jobTones.length],
});

export default function StudentWorkspace() {
  const [currentUser, setCurrentUser] = useState(readStudentUser);
  const firstName = currentUser.name.split(/\s+/)[0];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const [active, setActive] = useState(readStudentSection);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobRecords, setJobRecords] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [recommendationMeta, setRecommendationMeta] = useState({
    matchingEnabled: true,
    profileReady: false,
    missingFields: [],
    aiConfigured: false,
    aiExplained: 0,
    verifiedSourceJobs: 0,
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [reservingEventId, setReservingEventId] = useState(null);
  const [cancellingEventId, setCancellingEventId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState("");
  const [postingStatus, setPostingStatus] = useState({ canPost: true, nextPostAt: null, cooldownHours: 12 });
  const [jobSearch, setJobSearch] = useState("");
  const [jobType, setJobType] = useState("All types");
  const [studentSearch, setStudentSearch] = useState("");
  const [quiz, setQuiz] = useState({ index: 0, answers: {}, finished: false, score: 0, submitting: false, result: null, startedAt: null });
  const [assessmentRecords, setAssessmentRecords] = useState([]);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [assessmentError, setAssessmentError] = useState("");
  const [adaptiveAssessment, setAdaptiveAssessment] = useState(null);
  const [adaptiveLoading, setAdaptiveLoading] = useState(true);
  const [adaptiveError, setAdaptiveError] = useState("");
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [platformConfig, setPlatformConfig] = useState({
    features: { coverLetterEnabled: true },
    ai: { coverLetterTone: "Professional" },
  });
  const [cvPhoto, setCvPhoto] = useState(null);
  const [cvData, setCvData] = useState(() => readCvData(readStudentUser()));

  useEffect(() => {
    localStorage.setItem(getCvStorageKey(currentUser), JSON.stringify(cvData));
  }, [cvData, currentUser]);

  useEffect(() => {
    if (!studentSectionIds.has(active)) return;
    localStorage.setItem(getStudentSectionStorageKey(currentUser), active);
  }, [active, currentUser.id, currentUser.email]);

  useEffect(() => {
    let cancelled = false;
    apiRequest("/auth/config")
      .then((config) => {
        if (!cancelled) setPlatformConfig(config);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const profile = await apiRequest("/auth/me");
        if (cancelled || !profile) return;
        localStorage.setItem("careerforge_session", JSON.stringify(profile));
        setCurrentUser(profile);
        setCvData((current) => ({
          ...current,
          name: profile.name || current.name,
          email: profile.email || current.email,
          location: profile.location || current.location,
        }));
      } catch (error) {
        if (!cancelled) notify(error.message);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAssessments = async () => {
    setAssessmentLoading(true);
    setAssessmentError("");
    try {
      setAssessmentRecords(await apiRequest("/assessments"));
    } catch (error) {
      setAssessmentError(error.message);
    } finally {
      setAssessmentLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAdaptiveAssessment = async () => {
    setAdaptiveLoading(true);
    setAdaptiveError("");
    try {
      setAdaptiveAssessment(await apiRequest("/adaptive-assessment/overview"));
    } catch (error) {
      setAdaptiveError(error.message);
    } finally {
      setAdaptiveLoading(false);
    }
  };

  useEffect(() => {
    loadAdaptiveAssessment();
  }, []);

  const loadOverview = async ({ silent = false } = {}) => {
    if (!silent) {
      setOverviewLoading(true);
      setOverviewError("");
    }
    try {
      const nextOverview = await apiRequest("/student/overview");
      setOverviewData(nextOverview);
      setOverviewError("");
      setCurrentUser((current) => ({
        ...current,
        readiness_score: nextOverview.readinessScore,
        profile_completion: nextOverview.calculation.profileCompletion,
      }));
    } catch (error) {
      if (!silent) setOverviewError(error.message);
    } finally {
      if (!silent) setOverviewLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    const refresh = () => loadOverview({ silent: true });
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const loadJobData = async ({ silent = false } = {}) => {
    if (!silent) {
      setJobsLoading(true);
      setJobsError("");
    }
    try {
      const [recommendations, nextApplications] = await Promise.all([
        apiRequest("/jobs/recommendations"),
        apiRequest("/jobs/applications/mine"),
      ]);
      const nextJobs = Array.isArray(recommendations) ? recommendations : recommendations.items || [];
      setJobRecords(nextJobs.map(normalizeJob));
      if (!Array.isArray(recommendations)) {
        setRecommendationMeta({
          matchingEnabled: Boolean(recommendations.matchingEnabled),
          profileReady: Boolean(recommendations.profileReady),
          missingFields: Array.isArray(recommendations.missingFields) ? recommendations.missingFields : [],
          aiConfigured: Boolean(recommendations.aiConfigured),
          aiExplained: Number(recommendations.aiExplained || 0),
          verifiedSourceJobs: Number(recommendations.verifiedSourceJobs || 0),
        });
      }
      setApplications(nextApplications.map(normalizeApplication));
      setJobsError("");
    } catch (error) {
      if (!silent) setJobsError(error.message);
    } finally {
      if (!silent) setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobData();
    const refresh = () => loadJobData({ silent: true });
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const loadEvents = async ({ silent = false } = {}) => {
    if (!silent) {
      setEventsLoading(true);
      setEventsError("");
    }
    try {
      const records = await apiRequest("/events");
      setEvents(Array.isArray(records) ? records : []);
      setEventsError("");
    } catch (error) {
      if (!silent) setEventsError(error.message);
    } finally {
      if (!silent) setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const refresh = () => loadEvents({ silent: true });
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const loadCommunity = async ({ silent = false } = {}) => {
    if (!silent) {
      setCommunityLoading(true);
      setCommunityError("");
    }
    try {
      const [nextPosts, nextPostingStatus] = await Promise.all([
        apiRequest("/community/posts"),
        apiRequest("/community/posting-status"),
      ]);
      setPosts(nextPosts);
      setPostingStatus(nextPostingStatus);
      setCommunityError("");
    } catch (error) {
      if (!silent) setCommunityError(error.message);
    } finally {
      if (!silent) setCommunityLoading(false);
    }
  };

  useEffect(() => {
    loadCommunity();
  }, []);

  useEffect(() => {
    if (postingStatus.canPost || !postingStatus.nextPostAt) return undefined;
    const remaining = new Date(postingStatus.nextPostAt).getTime() - Date.now();
    if (remaining <= 0) {
      setPostingStatus((current) => ({ ...current, canPost: true }));
      return undefined;
    }
    const timer = window.setTimeout(
      () => setPostingStatus((current) => ({ ...current, canPost: true })),
      Math.min(remaining + 250, 2147483647),
    );
    return () => window.clearTimeout(timer);
  }, [postingStatus.canPost, postingStatus.nextPostAt]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const saveProfile = async (profile) => {
    try {
      const nextUser = await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          university: profile.university,
          degree: profile.degree,
          graduation_year: profile.graduation,
          target_role: profile.target,
          career_interests: profile.interests,
          skills: profile.skills,
          location: profile.location,
          avatar_data: profile.avatar,
          facebook_url: socialProfileApiValue("facebook_url", profile.facebook_url),
          instagram_url: socialProfileApiValue("instagram_url", profile.instagram_url),
          whatsapp: socialProfileApiValue("whatsapp", profile.whatsapp),
          twitter_url: socialProfileApiValue("twitter_url", profile.twitter_url),
          telegram: socialProfileApiValue("telegram", profile.telegram),
        }),
      });
      localStorage.setItem("careerforge_session", JSON.stringify(nextUser));
      setCurrentUser(nextUser);
      setCvData((current) => ({
        ...current,
        name: nextUser.name,
        email: nextUser.email || current.email,
        location: nextUser.location || current.location,
      }));
      await Promise.all([loadAdaptiveAssessment(), loadOverview()]);
      notify("Profile changes saved.");
      return true;
    } catch (error) {
      notify(error.message);
      return false;
    }
  };

  const startAdaptiveAssessment = async () => {
    if (!adaptiveAssessment?.profileReady) {
      setActive("profile");
      notify(`Complete your required career details first${adaptiveAssessment?.missingFields?.length ? `: ${adaptiveAssessment.missingFields.join(", ")}` : "."}`);
      return;
    }
    setModal({ type: "adaptive-loading", level: adaptiveAssessment.program.currentLevel });
    try {
      const result = await apiRequest("/adaptive-assessment/start", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setModal({ type: "adaptive-quiz", attempt: result.attempt });
    } catch (error) {
      setModal(null);
      notify(error.message);
    }
  };

  const startAssessment = async (assessment) => {
    setQuiz({ index: 0, answers: {}, finished: false, score: 0, submitting: false, result: null, startedAt: new Date().toISOString() });
    setModal({ type: "quiz-loading", assessment });
    try {
      const questions = await apiRequest(`/assessments/${assessment.id}/questions`);
      if (!questions.length) {
        setModal(null);
        notify("This assessment does not have any published questions yet.");
        return;
      }
      setModal({ type: "quiz", assessment, questions });
    } catch (error) {
      setModal(null);
      notify(error.message);
    }
  };

  const submitAssessment = async (assessment, questions) => {
    setQuiz((current) => ({ ...current, submitting: true }));
    try {
      const answers = questions.map((question, index) => ({
        questionId: question.id,
        optionId: quiz.answers[index],
      }));
      const result = await apiRequest(`/assessments/${assessment.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers, startedAt: quiz.startedAt }),
      });
      setQuiz((current) => ({ ...current, submitting: false, finished: true, score: result.percentage, result }));
      await Promise.all([loadAssessments(), loadOverview()]);
    } catch (error) {
      setQuiz((current) => ({ ...current, submitting: false }));
      notify(error.message);
    }
  };

  const submitJobApplication = async (job, application) => {
    try {
      await apiRequest(`/jobs/${job.id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          coverLetter: application.coverLetter,
          resumeUrl: null,
          resumeSnapshot: {
            ...cvData,
            capturedAt: new Date().toISOString(),
          },
          resumeFile: application.resumeFile,
        }),
      });
      setModal(null);
      await Promise.all([loadJobData(), loadOverview()]);
      notify(`Application sent to ${job.company}.`);
    } catch (error) {
      notify(error.message);
    }
  };

  const withdrawJobApplication = async (application) => {
    if (!window.confirm(`Cancel your application for “${application.role}” at ${application.company}?`)) return;
    try {
      await apiRequest(`/jobs/applications/${application.id}/withdraw`, { method: "PATCH" });
      await Promise.all([loadJobData(), loadOverview()]);
      notify(`Application to ${application.company} cancelled.`);
    } catch (error) {
      notify(error.message);
    }
  };

  const reserveEvent = async (event) => {
    if (reservingEventId || cancellingEventId) return;
    setReservingEventId(event.id);
    try {
      const result = await apiRequest(`/events/${event.id}/register`, { method: "POST" });
      setEvents((current) => current.map((item) => Number(item.id) === Number(event.id) ? {
        ...item,
        registered: true,
        registration_count: Number(result.registrationCount ?? item.registration_count ?? 0),
        seats_remaining: result.seatsRemaining ?? item.seats_remaining,
      } : item));
      notify(result.message);
    } catch (error) {
      notify(error.message);
      await loadEvents({ silent: true });
    } finally {
      setReservingEventId(null);
    }
  };

  const cancelEventReservation = async (event) => {
    if (reservingEventId || cancellingEventId) return;
    if (!window.confirm(`Cancel your seat reservation for ${event.title}?`)) return;
    setCancellingEventId(event.id);
    try {
      const result = await apiRequest(`/events/${event.id}/register`, { method: "DELETE" });
      setEvents((current) => current.map((item) => Number(item.id) === Number(event.id) ? {
        ...item,
        registered: false,
        registration_count: Number(result.registrationCount ?? item.registration_count ?? 0),
        seats_remaining: result.seatsRemaining ?? item.seats_remaining,
      } : item));
      notify(result.message);
    } catch (error) {
      notify(error.message);
      await loadEvents({ silent: true });
    } finally {
      setCancellingEventId(null);
    }
  };

  const publishCommunityPost = async (payload) => {
    try {
      const result = await apiRequest("/community/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (result.post) {
        setPosts((current) => [result.post, ...current.filter((post) => Number(post.id) !== Number(result.post.id))]);
      }
      setPostingStatus((current) => ({
        ...current,
        canPost: !result.nextPostAt,
        nextPostAt: result.nextPostAt || null,
      }));
      setModal(null);
      notify(result.message);
    } catch (error) {
      notify(error.message);
    }
  };

  const pageActions = {
    jobs: (
      <button className="btn-secondary"><BellRing size={16} /> Create job alert</button>
    ),
    vault: (
      <button onClick={() => window.print()} className="btn-accent"><Download size={16} /> Export PDF</button>
    ),
    community: (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!postingStatus.canPost && <CommunityPostCooldown nextPostAt={postingStatus.nextPostAt} className="text-xs font-extrabold text-coral" />}
        <button disabled={!postingStatus.canPost} onClick={() => setModal({ type: "post" })} className="btn-accent disabled:cursor-not-allowed disabled:opacity-45"><Plus size={16} /> New post</button>
      </div>
    ),
    events: (
      <button onClick={() => loadEvents()} className="btn-secondary"><RefreshCw size={16} /> Refresh events</button>
    ),
  };

  const studentNavItems = navItems.map((item) => {
    if (item.id === "jobs") return { ...item, badge: jobRecords.length ? String(jobRecords.length) : undefined };
    if (item.id === "applications") return { ...item, badge: applications.length ? String(applications.length) : undefined };
    return item;
  });

  const updateStudentSearch = (value) => {
    setStudentSearch(value);
    if (value.trim()) setActive("connections");
  };

  return (
    <>
      <DashboardShell
        role="student"
        profileName={currentUser.name}
        profileAvatar={currentUser.avatar_data || currentUser.avatar_url}
        navItems={studentNavItems}
        active={active}
        onNavigate={setActive}
        searchValue={studentSearch}
        onSearchChange={updateStudentSearch}
        onSearchSubmit={() => setActive("connections")}
        title={active === "overview" ? `${greeting}, ${firstName}` : pageMeta[active][0]}
        subtitle={pageMeta[active][1]}
        actions={pageActions[active]}
      >
        {active === "overview" && (
          <Overview
            onNavigate={setActive}
            onOpenJob={(job) => setModal({ type: "job", job })}
            jobs={jobRecords}
            data={overviewData}
            loading={overviewLoading}
            error={overviewError}
            onRetry={loadOverview}
          />
        )}
        {active === "jobs" && (
          <JobsPage
            jobs={jobRecords}
            recommendations={recommendationMeta}
            loading={jobsLoading}
            error={jobsError}
            onRetry={loadJobData}
            search={jobSearch}
            setSearch={setJobSearch}
            type={jobType}
            setType={setJobType}
            saved={savedJobs}
            onSave={(id) => setSavedJobs((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])}
            onOpen={(job) => setModal({ type: "job", job })}
          />
        )}
        {active === "applications" && <ApplicationsPage applications={applications} loading={jobsLoading} error={jobsError} onRetry={loadJobData} onWithdraw={withdrawJobApplication} />}
        {active === "vault" && <CareerVault notify={notify} photo={cvPhoto} setPhoto={setCvPhoto} data={cvData} setData={setCvData} />}
        {active === "assessments" && (
          <AssessmentsPage
            assessments={assessmentRecords}
            loading={assessmentLoading}
            error={assessmentError}
            onRetry={loadAssessments}
            onStart={startAssessment}
            adaptive={adaptiveAssessment}
            adaptiveLoading={adaptiveLoading}
            adaptiveError={adaptiveError}
            onRetryAdaptive={loadAdaptiveAssessment}
            onStartAdaptive={startAdaptiveAssessment}
            onCompleteProfile={() => setActive("profile")}
          />
        )}
        {active === "analytics" && <AnalyticsPage notify={notify} data={overviewData} onNavigate={setActive} />}
        {active === "learning" && <LearningPage notify={notify} />}
        {active === "community" && <CommunityPage posts={posts} setPosts={setPosts} loading={communityLoading} error={communityError} onRetry={loadCommunity} notify={notify} viewer={currentUser} onNewPost={() => setModal({ type: "post" })} postingStatus={postingStatus} />}
        {active === "connections" && <ConnectionsPage search={studentSearch} setSearch={setStudentSearch} currentUser={currentUser} notify={notify} />}
        {active === "events" && <EventsPage events={events} loading={eventsLoading} error={eventsError} onRetry={loadEvents} reservingEventId={reservingEventId} cancellingEventId={cancellingEventId} onRegister={reserveEvent} onCancelReservation={cancelEventReservation} />}
        {active === "achievements" && <AchievementsPage />}
        {active === "profile" && <ProfilePage notify={notify} user={currentUser} onSave={saveProfile} />}
      </DashboardShell>
      <Toast message={toast} onClose={() => setToast("")} />
      {modal?.type === "job" && (
        <JobModal
          job={modal.job}
          applied={modal.job.already_applied || applications.some((item) => Number(item.job_id) === Number(modal.job.id))}
          onClose={() => setModal(null)}
          onApply={() => setModal({ type: "apply", job: modal.job })}
        />
      )}
      {modal?.type === "apply" && <ApplyModal job={modal.job} user={currentUser} resumeName={cvData.name} coverLetterEnabled={platformConfig.features.coverLetterEnabled} coverLetterTone={platformConfig.ai.coverLetterTone} onClose={() => setModal(null)} onSubmit={(application) => submitJobApplication(modal.job, application)} />}
      {modal?.type === "quiz" && (
        <QuizModal
          assessment={modal.assessment}
          questions={modal.questions}
          quiz={quiz}
          setQuiz={setQuiz}
          onSubmit={() => submitAssessment(modal.assessment, modal.questions)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "quiz-loading" && <QuizLoadingModal assessment={modal.assessment} onClose={() => setModal(null)} />}
      {modal?.type === "adaptive-loading" && <AdaptiveLoadingModal level={modal.level} onClose={() => setModal(null)} />}
      {modal?.type === "adaptive-quiz" && (
        <AdaptiveQuizModal
          attempt={modal.attempt}
          onClose={() => setModal(null)}
          onFinished={async () => {
            await Promise.all([loadAdaptiveAssessment(), loadOverview()]);
          }}
          notify={notify}
        />
      )}
      {modal?.type === "post" && <CommunityPostModal user={currentUser} onClose={() => setModal(null)} onSubmit={publishCommunityPost} />}
    </>
  );
}

function Overview({ onNavigate, onOpenJob, jobs: availableJobs, data, loading, error, onRetry }) {
  if (loading) {
    return (
      <section className="panel grid min-h-[420px] place-items-center p-6 text-center">
        <div>
          <RefreshCw className="mx-auto animate-spin text-cobalt" size={30} />
          <h2 className="mt-4 text-lg font-extrabold">Calculating your real progress</h2>
          <p className="mt-1 text-xs text-muted">Reading your saved profile, assessments and learning activity.</p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="panel grid min-h-[420px] place-items-center p-6 text-center">
        <div>
          <AlertTriangle className="mx-auto text-coral" size={30} />
          <h2 className="mt-4 text-lg font-extrabold">Overview could not be calculated</h2>
          <p className="mt-1 max-w-md text-xs text-muted">{error || "No dashboard data was returned."}</p>
          <button onClick={() => onRetry()} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button>
        </div>
      </section>
    );
  }

  const { metrics, calculation, skillSignals, nextActions, readinessScore } = data;
  const strongestSignal = skillSignals[0];
  const progressSources = [
    ["Profile completion", calculation.profileCompletion, "bg-cobalt", "35% weight"],
    ["Assessment performance", calculation.assessmentPerformance, "bg-jade", "45% weight"],
    ["Learning progress", calculation.learningProgress, "bg-plum", "20% weight"],
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Target} label="Readiness score" value={`${readinessScore}%`} delta="Calculated from saved activity" tone="bg-cobalt" />
        <Metric icon={ListChecks} label="Assessments completed" value={metrics.assessmentsCompleted} delta={`${metrics.assessmentsPublished} currently published`} tone="bg-jade" />
        <Metric icon={BriefcaseBusiness} label="Active applications" value={metrics.applicationsActive} delta={`${metrics.availableJobs} live jobs available`} tone="bg-coral" />
        <Metric icon={BookOpen} label="Learning progress" value={`${calculation.learningProgress}%`} delta={`${metrics.resourcesStarted} started · ${metrics.resourcesCompleted} completed`} tone="bg-plum" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="panel overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow"><Activity size={13} /> Real progress summary</span>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em]">{readinessScore}% readiness from your saved progress.</h2>
              <p className="mt-1 text-sm text-muted">No demo scores—this result uses your profile, verified assessments and learning records.</p>
            </div>
            <button onClick={() => onRetry()} className="btn-ghost"><RefreshCw size={15} /> Recalculate</button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            <div
              className="relative mx-auto grid h-40 w-40 place-items-center rounded-full"
              style={{ background: `conic-gradient(var(--cobalt) 0 ${readinessScore}%, var(--clay-line) ${readinessScore}% 100%)` }}
            >
              <div className="grid h-[124px] w-[124px] place-items-center rounded-full bg-paper text-center shadow-inner">
                <span><b className="block text-3xl tracking-[-0.05em]">{readinessScore}%</b><small className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Calculated</small></span>
              </div>
            </div>
            <div className="space-y-3">
              {nextActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => onNavigate(action.target)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white/55 p-3 text-left transition hover:border-cobalt/20 hover:bg-white"
                >
                  <span className={`h-9 w-1 rounded-full ${action.tone}`} />
                  <span className="flex-1"><b className="block text-sm">{action.title}</b><small className="text-muted">{action.detail}</small></span>
                  <ChevronRight size={15} className="text-muted" />
                </button>
              ))}
              {!nextActions.length && (
                <div className="rounded-2xl border border-dashed border-ink/15 p-5 text-center text-xs text-muted">
                  Your saved profile and current activity have no pending dashboard actions.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-extrabold tracking-[-0.03em]">Verified skill results</h2><p className="text-xs text-muted">Best completed score by assessment category</p></div>
            <button onClick={() => onNavigate("assessments")} className="btn-ghost"><Plus size={15} /> Assess</button>
          </div>
          {skillSignals.length > 0 ? (
            <>
              <div className="mt-6 space-y-5">
                {skillSignals.map((signal) => (
                  <div key={signal.label}>
                    <div className="mb-2 flex justify-between text-xs"><b>{signal.label}</b><span className="font-bold text-muted">{signal.score}%</span></div>
                    <div className="progress-track"><div className={`reveal-bar h-full rounded-full ${signal.tone}`} style={{ width: `${signal.score}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-jade/10 p-4 text-xs leading-5 text-jade">
                <b className="block">Highest verified result: {strongestSignal.label}</b>
                Your saved best score in this category is {strongestSignal.score}%.
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-ink/15 p-6 text-center">
              <ListChecks className="mx-auto text-muted" size={25} />
              <b className="mt-3 block text-sm">No verified skill result yet</b>
              <p className="mt-1 text-xs leading-5 text-muted">Complete a published or adaptive assessment to create real skill signals.</p>
              <button onClick={() => onNavigate("assessments")} className="btn-secondary mt-4">Open assessments</button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-lg font-extrabold tracking-[-0.03em]">Latest live opportunities</h2><p className="text-xs text-muted">Published by administrators and still accepting applications</p></div>
            <button onClick={() => onNavigate("jobs")} className="btn-ghost">View all <ArrowRight size={15} /></button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {availableJobs.slice(0, 2).map((job) => <CompactJob key={job.id} job={job} onClick={() => onOpenJob(job)} />)}
            {!availableJobs.length && <div className="rounded-2xl border border-dashed border-ink/15 p-5 text-center text-xs text-muted">No administrator-published jobs are available yet.</div>}
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold tracking-[-0.03em]">Readiness calculation</h2>
            <p className="text-xs text-muted">Every value comes from your saved account data</p>
          </div>
          <div className="space-y-5">
            {progressSources.map(([label, value, tone, weight]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span><b>{label}</b><small className="ml-2 text-muted">{weight}</small></span>
                  <b>{value}%</b>
                </div>
                <div className="progress-track"><div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, delta, tone }) {
  return (
    <article className="metric-card">
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl text-white ${tone}`}><Icon size={18} /></span>
        <MoreHorizontal size={17} className="text-muted" />
      </div>
      <b className="mt-5 block text-2xl tracking-[-0.04em]">{value}</b>
      <p className="mt-0.5 text-xs font-bold">{label}</p>
      <p className="mt-3 text-[11px] text-muted">{delta}</p>
    </article>
  );
}

function CompactJob({ job, onClick }) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white/55 p-3 text-left transition hover:border-cobalt/20 hover:bg-white">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold text-white ${job.tone}`}>{job.logo}</span>
      <span className="min-w-0 flex-1"><b className="block truncate text-sm">{job.title}</b><small className="text-muted">{job.company} · {job.displayLocation}</small></span>
      <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${job.already_applied ? "bg-jade/10 text-jade" : "bg-cobalt/10 text-cobalt"}`}>{job.already_applied ? "Applied" : job.match_percentage != null ? `${job.match_percentage}% match` : job.type}</span>
    </button>
  );
}

function JobsPage({ jobs: availableJobs, recommendations, loading, error, onRetry, search, setSearch, type, setType, saved, onSave, onOpen }) {
  const filtered = useMemo(() => availableJobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.company} ${job.requirements}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === "All types" || job.type === type;
    return matchesSearch && matchesType;
  }), [availableJobs, search, type]);

  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input bg-white/60 pl-11" placeholder="Search title, company or skill" />
        </label>
        <label className="relative sm:w-44">
          <select value={type} onChange={(e) => setType(e.target.value)} className="select bg-white/60">
            {["All types", "Full-time", "Part-time", "Internship", "Contract"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted" size={15} />
        </label>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
      </section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold">{recommendations.matchingEnabled ? "Personalized opportunities" : "Administrator-published opportunities"}</h2>
          <p className="mt-1 text-sm text-muted"><b className="text-ink">{filtered.length} available jobs</b> · CareerCube roles and verified external source listings</p>
        </div>
      </div>
      {!loading && recommendations.matchingEnabled && !recommendations.profileReady && (
        <section className="rounded-[22px] border border-cobalt/20 bg-cobalt/5 p-4 text-sm">
          <b className="block">Add your skills for accurate AI job matching</b>
          <p className="mt-1 text-xs text-muted">Complete: {recommendations.missingFields.join(", ") || "your career profile"}. Update Profile & settings, then refresh this page.</p>
        </section>
      )}
      {loading && <section className="panel grid min-h-64 place-items-center text-center"><div><RefreshCw className="mx-auto animate-spin text-cobalt" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading live jobs...</p></div></section>}
      {!loading && error && <section className="panel grid min-h-64 place-items-center p-6 text-center"><div><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 text-lg font-extrabold">Jobs could not be loaded</h2><p className="mt-1 max-w-md text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></section>}
      {!loading && !error && !filtered.length && <section className="panel grid min-h-64 place-items-center p-6 text-center"><div><BriefcaseBusiness className="mx-auto text-muted" size={32} /><h2 className="mt-3 text-lg font-extrabold">No jobs available</h2><p className="mt-1 max-w-md text-xs leading-5 text-muted">No live CareerCube roles or external listings match your filters right now. Check again later.</p></div></section>}
      {!loading && !error && filtered.length > 0 && (
      <section className="grid gap-4 lg:grid-cols-2">
        {filtered.map((job) => (
          <article key={job.id} className="panel group p-5 transition hover:-translate-y-0.5 hover:shadow-glass">
            <div className="flex items-start gap-4">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] text-base font-extrabold text-white ${job.tone}`}>{job.logo}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div><h3 className="truncate text-base font-extrabold">{job.title}</h3><p className="mt-0.5 text-xs font-semibold text-muted">{job.company}</p><div className="mt-2 flex flex-wrap gap-1.5">{job.match_percentage != null && <span className="inline-flex rounded-full bg-cobalt/10 px-2 py-1 text-[10px] font-extrabold text-cobalt">{job.match_percentage}% AI match</span>}{job.application_mode === "external" && <span className="inline-flex rounded-full bg-jade/10 px-2 py-1 text-[10px] font-extrabold text-jade">Via {job.source_name || "verified source"}</span>}</div></div>
                  <button onClick={() => onSave(job.id)} className={`grid h-9 w-9 place-items-center rounded-xl border border-ink/[0.08] ${saved.includes(job.id) ? "bg-cobalt text-white" : "bg-white/60 text-muted"}`}><Bookmark size={16} fill={saved.includes(job.id) ? "currentColor" : "none"} /></button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted"><span><MapPin className="mr-1 inline" size={12} />{job.displayLocation}</span><span><Clock3 className="mr-1 inline" size={12} />{job.type}</span></div>
              </div>
            </div>
            <div className="my-5 border-t border-ink/[0.07]" />
            <p className="line-clamp-2 text-xs leading-5 text-muted">{job.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{job.requirementsList.slice(0, 4).map((requirement) => <span className="tag" key={requirement}>{requirement}</span>)}</div>
            {job.matched_skills?.length > 0 && <p className="mt-3 text-[11px] font-bold text-jade">Matches: {job.matched_skills.join(", ")}</p>}
            <div className="mt-5 flex items-center justify-between">
              <span><b className="block text-sm">{job.salary}</b><small className="text-[10px] text-muted">{job.application_mode === "external" ? "Apply on the official source" : `Apply by ${new Date(job.expires_at).toLocaleDateString()}`}</small></span>
              <button onClick={() => onOpen(job)} className={`min-h-10 px-4 ${job.already_applied ? "btn-secondary !text-jade" : "btn-primary"}`}>{job.application_mode === "external" ? "View source" : job.already_applied ? "Application sent" : "View & apply"} <ArrowRight size={15} /></button>
            </div>
          </article>
        ))}
      </section>
      )}
    </div>
  );
}

function ApplicationsPage({ applications, loading, error, onRetry, onWithdraw }) {
  const [filter, setFilter] = useState("all");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const rows = filter === "all" ? applications : applications.filter((item) => item.status === filter);
  const activeApplications = applications.filter((item) => !["withdrawn", "rejected"].includes(item.status));
  const withdrawn = applications.filter((item) => item.status === "withdrawn").length;
  const inReview = applications.filter((item) => item.status === "in_review").length;
  const nextStage = applications.filter((item) => ["assessment", "interview", "offer"].includes(item.status)).length;
  const interviews = applications.filter((item) => item.status === "interview").length;
  const interviewRate = activeApplications.length ? `${Math.round((interviews / activeApplications.length) * 100)}%` : "0%";
  const cancel = async (application) => {
    setWithdrawingId(application.id);
    await onWithdraw(application);
    setWithdrawingId(null);
  };
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Active applications", activeApplications.length, BriefcaseBusiness, "bg-cobalt", `${withdrawn} cancelled`], ["In review", inReview, Eye, "bg-plum", "Live application data"], ["Next stage", nextStage, ListChecks, "bg-coral", "Live application data"], ["Interview rate", interviewRate, Target, "bg-jade", "Active applications"]].map(([label, value, Icon, tone, delta]) => <Metric key={label} icon={Icon} label={label} value={value} delta={delta} tone={tone} />)}
      </section>
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[["all", "All"], ["applied", "Applied"], ["in_review", "In review"], ["assessment", "Assessment"], ["interview", "Interview"], ["withdrawn", "Cancelled"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`min-h-9 rounded-xl px-3 text-xs font-bold ${filter === value ? "bg-ink text-white" : "bg-white/60 text-muted"}`}>{label}</button>)}
          </div>
          <button onClick={onRetry} className="btn-secondary min-h-10"><RefreshCw size={15} /> Refresh</button>
        </div>
        {loading && <div className="grid min-h-56 place-items-center text-center"><RefreshCw className="animate-spin text-cobalt" size={27} /><p className="mt-3 text-xs font-bold text-muted">Loading applications...</p></div>}
        {!loading && error && <div className="grid min-h-56 place-items-center text-center"><div><AlertTriangle className="mx-auto text-coral" size={28} /><h3 className="mt-3 font-extrabold">Applications could not be loaded</h3><p className="mt-1 text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5">Try again</button></div></div>}
        {!loading && !error && !rows.length && <div className="grid min-h-56 place-items-center text-center"><div><FileCheck2 className="mx-auto text-muted" size={30} /><h3 className="mt-3 font-extrabold">No applications yet</h3><p className="mt-1 text-xs text-muted">Applications submitted to administrator-published jobs will appear here.</p></div></div>}
        {!loading && !error && rows.length > 0 && (
        <div className="table-shell overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.1em] text-muted">
              <tr>{["Company & role", "Applied", "Location", "Status", "Next action", ""].map((item) => <th key={item} className="px-4 py-3 font-extrabold">{item}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-white/60">
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white ${item.tone}`}>{item.company[0]}</span><span><b className="block text-xs">{item.role}</b><small className="text-muted">{item.company}</small></span></div></td>
                  <td className="px-4 py-4 text-xs text-muted">{item.applied}</td>
                  <td className="px-4 py-4 text-xs text-muted">{item.location} · {item.workplace_type}</td>
                  <td className="px-4 py-4"><Status value={item.displayStatus} /></td>
                  <td className="px-4 py-4 text-xs font-semibold">{item.status === "withdrawn" ? "Application cancelled" : item.status === "interview" ? "Prepare for interview" : item.status === "assessment" ? "Complete employer assessment" : item.status === "offer" ? "Review offer" : item.status === "rejected" ? "Application closed" : "Monitor response"}</td>
                  <td className="px-4 py-4">{!["withdrawn", "rejected"].includes(item.status) ? <button disabled={withdrawingId === item.id} onClick={() => cancel(item)} className="btn-ghost min-h-8 gap-1 text-coral disabled:opacity-50"><X size={14} /> {withdrawingId === item.id ? "Cancelling..." : "Cancel"}</button> : <span className="text-[10px] font-bold text-muted">{item.status === "withdrawn" ? "Can reapply" : "Closed"}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </div>
  );
}

function Status({ value }) {
  const styles = {
    Interview: "bg-jade/12 text-jade",
    Assessment: "bg-coral/12 text-coral",
    "In review": "bg-plum/12 text-plum",
    Applied: "bg-cobalt/10 text-cobalt",
    Withdrawn: "bg-coral/10 text-coral",
    Rejected: "bg-coral/10 text-coral",
    Offer: "bg-jade/12 text-jade",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${styles[value] || "bg-ink/10 text-muted"}`}>{value}</span>;
}

function CareerVault({ notify, photo, setPhoto, data, setData }) {
  const [photoError, setPhotoError] = useState("");
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }));
  const initials = getInitials(data.name) || "CV";
  const skills = data.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
  const contactItems = [data.email, data.phone, data.location, data.website].filter(Boolean);

  const addItem = (section, values) => {
    setData((current) => ({
      ...current,
      [section]: [...current[section], { id: createItemId(), ...values }],
    }));
  };

  const updateItem = (section, id, key, value) => {
    setData((current) => ({
      ...current,
      [section]: current[section].map((item) => item.id === id ? { ...item, [key]: value } : item),
    }));
  };

  const removeItem = (section, id) => {
    setData((current) => ({
      ...current,
      [section]: current[section].filter((item) => item.id !== id),
    }));
  };

  const uploadPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({ src: String(reader.result), name: file.name });
      setPhotoError("");
      notify("CV photo added. Your preview has been updated.");
    };
    reader.onerror = () => setPhotoError("The photo could not be read. Please try another image.");
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoError("");
    notify("CV photo removed.");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
      <section className="panel h-fit p-5">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Resume details</h2><p className="text-xs text-muted">Every section is manually editable and updates the preview instantly.</p></div><span className="tag text-jade"><Check size={12} /> Saved</span></div>
        <div className="space-y-5">
          <div className="rounded-[22px] border border-ink/[0.08] bg-white/45 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] border border-white/70 bg-cobalt text-white shadow-glass">
                {photo ? (
                  <img src={photo.src} alt="CV profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-2xl font-extrabold">{initials}</span>
                )}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/55 py-1.5 text-center text-[9px] font-bold text-white backdrop-blur-sm">
                  CV PHOTO
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-sm">Professional photo</b>
                <p className="mt-1 text-[11px] leading-5 text-muted">
                  Use a clear headshot. JPG, PNG or WebP · maximum 5 MB.
                </p>
                {photo?.name && <p className="mt-1 truncate text-[10px] font-bold text-jade">{photo.name}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="btn-secondary min-h-9 cursor-pointer px-3 text-xs">
                    <Camera size={14} /> {photo ? "Replace photo" : "Upload photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
                  </label>
                  {photo && (
                    <button type="button" onClick={removePhoto} className="btn-ghost min-h-9 px-3 text-xs text-coral">
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            {photoError && <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-[11px] font-bold text-coral">{photoError}</p>}
          </div>

          <CvEditorSection title="Personal & contact" description="The name and email start from your authenticated account.">
            <div className="grid gap-3 sm:grid-cols-2">
              <CvField label="Full name" value={data.name} onChange={(value) => update("name", value)} placeholder="Your full name" />
              <CvField label="Professional title" value={data.title} onChange={(value) => update("title", value)} placeholder="e.g. Junior Software Engineer" />
              <CvField label="Email" type="email" value={data.email} onChange={(value) => update("email", value)} placeholder="you@example.com" />
              <CvField label="Phone" value={data.phone} onChange={(value) => update("phone", value)} placeholder="+880..." />
              <CvField label="Location" value={data.location} onChange={(value) => update("location", value)} placeholder="City, Country" />
              <CvField label="Portfolio / LinkedIn" value={data.website} onChange={(value) => update("website", value)} placeholder="linkedin.com/in/yourname" />
            </div>
          </CvEditorSection>

          <CvEditorSection title="Professional profile" description="Write this section completely in your own words.">
            <CvField label="Professional summary" multiline rows="5" value={data.summary} onChange={(value) => update("summary", value)} placeholder="Introduce your strengths, experience and career direction..." />
            <div className="mt-3">
              <CvField label="Core skills" multiline rows="3" value={data.skills} onChange={(value) => update("skills", value)} placeholder="React, JavaScript, SQL, Communication..." help="Separate skills with commas." />
            </div>
          </CvEditorSection>

          <CvEditorSection
            title="Education"
            description="Add as many degrees or qualifications as you need."
            onAdd={() => addItem("education", { degree: "", institution: "", location: "", start: "", end: "" })}
            addLabel="Add education"
          >
            {data.education.map((item, index) => (
              <CvItemEditor key={item.id} label={`Education ${index + 1}`} onRemove={() => removeItem("education", item.id)}>
                <CvField label="Degree / qualification" value={item.degree} onChange={(value) => updateItem("education", item.id, "degree", value)} placeholder="BSc in Computer Science" />
                <CvField label="Institution" value={item.institution} onChange={(value) => updateItem("education", item.id, "institution", value)} placeholder="University name" />
                <CvField label="Location" value={item.location} onChange={(value) => updateItem("education", item.id, "location", value)} placeholder="Dhaka, Bangladesh" />
                <div className="grid grid-cols-2 gap-3">
                  <CvField label="Start" value={item.start} onChange={(value) => updateItem("education", item.id, "start", value)} placeholder="2023" />
                  <CvField label="End" value={item.end} onChange={(value) => updateItem("education", item.id, "end", value)} placeholder="2027 / Present" />
                </div>
              </CvItemEditor>
            ))}
            {!data.education.length && <CvEmpty copy="No education added yet." />}
          </CvEditorSection>

          <CvEditorSection
            title="Work experience"
            description="Use one line per achievement or responsibility."
            onAdd={() => addItem("experiences", { title: "", company: "", location: "", start: "", end: "", details: "" })}
            addLabel="Add experience"
          >
            {data.experiences.map((item, index) => (
              <CvItemEditor key={item.id} label={`Experience ${index + 1}`} onRemove={() => removeItem("experiences", item.id)}>
                <CvField label="Role / position" value={item.title} onChange={(value) => updateItem("experiences", item.id, "title", value)} placeholder="Software Engineering Intern" />
                <CvField label="Company / organization" value={item.company} onChange={(value) => updateItem("experiences", item.id, "company", value)} placeholder="Organization name" />
                <CvField label="Location" value={item.location} onChange={(value) => updateItem("experiences", item.id, "location", value)} placeholder="Dhaka / Remote" />
                <div className="grid grid-cols-2 gap-3">
                  <CvField label="Start" value={item.start} onChange={(value) => updateItem("experiences", item.id, "start", value)} placeholder="Jan 2026" />
                  <CvField label="End" value={item.end} onChange={(value) => updateItem("experiences", item.id, "end", value)} placeholder="Present" />
                </div>
                <CvField label="Achievements" multiline rows="4" value={item.details} onChange={(value) => updateItem("experiences", item.id, "details", value)} placeholder={"Built...\nImproved...\nLed..."} help="Write each bullet on a new line." />
              </CvItemEditor>
            ))}
            {!data.experiences.length && <CvEmpty copy="No work experience added yet." />}
          </CvEditorSection>

          <CvEditorSection
            title="Projects"
            description="Showcase academic, personal or team projects."
            onAdd={() => addItem("projects", { title: "", context: "", link: "", date: "", details: "" })}
            addLabel="Add project"
          >
            {data.projects.map((item, index) => (
              <CvItemEditor key={item.id} label={`Project ${index + 1}`} onRemove={() => removeItem("projects", item.id)}>
                <CvField label="Project title" value={item.title} onChange={(value) => updateItem("projects", item.id, "title", value)} placeholder="Project name" />
                <CvField label="Context / role" value={item.context} onChange={(value) => updateItem("projects", item.id, "context", value)} placeholder="Personal project / Team lead" />
                <CvField label="Project link" value={item.link} onChange={(value) => updateItem("projects", item.id, "link", value)} placeholder="github.com/..." />
                <CvField label="Date" value={item.date} onChange={(value) => updateItem("projects", item.id, "date", value)} placeholder="2026" />
                <CvField label="Highlights" multiline rows="4" value={item.details} onChange={(value) => updateItem("projects", item.id, "details", value)} placeholder={"Designed...\nDeveloped...\nMeasured..."} help="Write each bullet on a new line." />
              </CvItemEditor>
            ))}
            {!data.projects.length && <CvEmpty copy="No projects added yet." />}
          </CvEditorSection>

          <CvEditorSection
            title="Languages"
            description="Add languages and your proficiency."
            onAdd={() => addItem("languages", { name: "", proficiency: "" })}
            addLabel="Add language"
          >
            {data.languages.map((item, index) => (
              <CvItemEditor key={item.id} label={`Language ${index + 1}`} onRemove={() => removeItem("languages", item.id)}>
                <div className="grid grid-cols-2 gap-3">
                  <CvField label="Language" value={item.name} onChange={(value) => updateItem("languages", item.id, "name", value)} placeholder="Bangla" />
                  <CvField label="Proficiency" value={item.proficiency} onChange={(value) => updateItem("languages", item.id, "proficiency", value)} placeholder="Native / Professional" />
                </div>
              </CvItemEditor>
            ))}
            {!data.languages.length && <CvEmpty copy="No languages added yet." />}
          </CvEditorSection>

          <CvEditorSection
            title="Certifications"
            description="Add courses, certificates, awards or credentials."
            onAdd={() => addItem("certifications", { name: "", issuer: "", date: "", credential: "" })}
            addLabel="Add certification"
          >
            {data.certifications.map((item, index) => (
              <CvItemEditor key={item.id} label={`Certification ${index + 1}`} onRemove={() => removeItem("certifications", item.id)}>
                <CvField label="Certification / award" value={item.name} onChange={(value) => updateItem("certifications", item.id, "name", value)} placeholder="Certificate name" />
                <CvField label="Issuer" value={item.issuer} onChange={(value) => updateItem("certifications", item.id, "issuer", value)} placeholder="Issuing organization" />
                <CvField label="Date" value={item.date} onChange={(value) => updateItem("certifications", item.id, "date", value)} placeholder="Jul 2026" />
                <CvField label="Credential / link" value={item.credential} onChange={(value) => updateItem("certifications", item.id, "credential", value)} placeholder="Credential ID or URL" />
              </CvItemEditor>
            ))}
            {!data.certifications.length && <CvEmpty copy="No certifications added yet." />}
          </CvEditorSection>

          <button onClick={() => notify("AI strengthened your summary and added role keywords.")} className="btn-secondary w-full text-cobalt"><Zap size={16} /> Improve with AI</button>
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-muted">LIVE PREVIEW · MODERN EDITORIAL</span><button onClick={() => notify("Resume version duplicated.")} className="btn-ghost"><Plus size={15} /> New version</button></div>
        <article id="resume-print" className="resume-paper min-h-[840px] overflow-hidden rounded-[8px] bg-white p-8 shadow-lift sm:p-12">
          <header className="border-b-2 border-ink pb-7">
            <div className="flex items-start justify-between gap-5">
              <div><h1 className="font-display text-4xl tracking-[-0.04em]">{data.name || "Your name"}</h1>{data.title && <p className="mt-2 text-sm font-bold uppercase tracking-[.12em] text-cobalt">{data.title}</p>}</div>
              {photo ? (
                <img src={photo.src} alt={`${data.name} profile`} className="h-20 w-20 shrink-0 rounded-[22px] border-2 border-white object-cover shadow-md" />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-coral text-sm font-extrabold text-white">{initials}</span>
              )}
            </div>
            {contactItems.length > 0 && <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-muted">{contactItems.map((item) => <span key={item}>{item}</span>)}</div>}
          </header>
          <div className="grid gap-8 pt-7 sm:grid-cols-[.35fr_.65fr]">
            <aside className="space-y-8">
              {skills.length > 0 && <ResumeBlock title="Expertise"><div className="flex flex-wrap gap-2">{skills.map((skill) => <span className="rounded-md bg-canvas px-2 py-1 text-[10px] font-bold" key={skill}>{skill}</span>)}</div></ResumeBlock>}
              {data.education.length > 0 && <ResumeBlock title="Education">{data.education.map((item) => <div className="mb-4 last:mb-0" key={item.id}><b className="text-xs">{item.degree || "Qualification"}</b>{item.institution && <p className="mt-1 text-[11px] leading-5 text-muted">{item.institution}</p>}<p className="text-[10px] leading-5 text-muted">{[item.location, [item.start, item.end].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}</p></div>)}</ResumeBlock>}
              {data.languages.length > 0 && <ResumeBlock title="Languages"><div className="space-y-1.5">{data.languages.map((item) => <p className="text-[11px] leading-5" key={item.id}><b>{item.name || "Language"}</b>{item.proficiency && <span className="text-muted"> · {item.proficiency}</span>}</p>)}</div></ResumeBlock>}
              {data.certifications.length > 0 && <ResumeBlock title="Certifications"><div className="space-y-3">{data.certifications.map((item) => <div key={item.id}><b className="block text-[11px]">{item.name || "Certification"}</b><p className="text-[10px] leading-4 text-muted">{[item.issuer, item.date].filter(Boolean).join(" · ")}</p>{item.credential && <p className="break-all text-[9px] leading-4 text-muted">{item.credential}</p>}</div>)}</div></ResumeBlock>}
            </aside>
            <div className="space-y-8">
              {data.summary && <ResumeBlock title="Profile"><p className="whitespace-pre-line text-[11px] leading-5 text-muted">{data.summary}</p></ResumeBlock>}
              {data.experiences.length > 0 && <ResumeBlock title="Experience">{data.experiences.map((item) => <ResumeEntry key={item.id} title={item.title || "Position"} place={[item.company, item.location].filter(Boolean).join(" · ")} date={[item.start, item.end].filter(Boolean).join(" — ")} points={item.details.split("\n").map((point) => point.trim()).filter(Boolean)} />)}</ResumeBlock>}
              {data.projects.length > 0 && <ResumeBlock title="Selected projects">{data.projects.map((item) => <ResumeEntry key={item.id} title={item.title || "Project"} place={[item.context, item.link].filter(Boolean).join(" · ")} date={item.date} points={item.details.split("\n").map((point) => point.trim()).filter(Boolean)} />)}</ResumeBlock>}
              {!data.summary && !data.experiences.length && !data.projects.length && <div className="cv-empty-state rounded-[20px] border border-dashed border-ink/15 p-6 text-center"><FileText className="mx-auto text-muted" size={24} /><b className="mt-3 block text-sm">Your CV is ready to build</b><p className="mt-1 text-[11px] leading-5 text-muted">Use the editor to add your summary, experience and projects.</p></div>}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function CvEditorSection({ title, description, onAdd, addLabel, children }) {
  return (
    <section className="rounded-[22px] border border-ink/[0.08] bg-white/35 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h3 className="text-sm font-extrabold">{title}</h3>{description && <p className="mt-1 text-[10px] leading-4 text-muted">{description}</p>}</div>
        {onAdd && <button type="button" onClick={onAdd} className="btn-ghost min-h-8 shrink-0 px-2 text-[10px] text-cobalt"><Plus size={13} /> {addLabel}</button>}
      </div>
      {children}
    </section>
  );
}

function CvItemEditor({ label, onRemove, children }) {
  return (
    <div className="mb-3 rounded-[18px] border border-ink/[0.08] bg-white/55 p-3 last:mb-0">
      <div className="mb-3 flex items-center justify-between"><b className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</b><button type="button" onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-lg text-coral transition hover:bg-coral/10" aria-label={`Remove ${label}`}><X size={14} /></button></div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CvField({ label, value, onChange, placeholder, type = "text", multiline = false, rows = "3", help }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold">{label}</span>
      {multiline ? (
        <textarea rows={rows} className="input resize-y py-3" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} className="input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
      {help && <small className="mt-1 block text-[9px] leading-4 text-muted">{help}</small>}
    </label>
  );
}

function CvEmpty({ copy }) {
  return <p className="rounded-[16px] border border-dashed border-ink/10 px-3 py-4 text-center text-[10px] font-semibold text-muted">{copy}</p>;
}

function ResumeBlock({ title, children }) {
  return <section><h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-coral">{title}</h3>{children}</section>;
}

function ResumeEntry({ title, place, date, points }) {
  return <div className="mb-5 last:mb-0"><div className="flex justify-between gap-4"><div><b className="block text-xs">{title}</b><small className="text-[10px] text-muted">{place}</small></div><small className="shrink-0 text-[9px] font-bold text-muted">{date}</small></div><ul className="mt-2 space-y-1.5">{points.map((point) => <li className="flex gap-2 text-[10px] leading-4 text-muted" key={point}><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cobalt" />{point}</li>)}</ul></div>;
}

function AssessmentsPage({
  assessments,
  loading,
  error,
  onRetry,
  onStart,
  adaptive,
  adaptiveLoading,
  adaptiveError,
  onRetryAdaptive,
  onStartAdaptive,
  onCompleteProfile,
}) {
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(assessments.map((item) => item.category))];
  const list = category === "All" ? assessments : assessments.filter((item) => item.category === category);
  const colors = ["bg-cobalt", "bg-jade", "bg-coral", "bg-plum", "bg-ink", "bg-[#A57945]"];
  const program = adaptive?.program;
  const currentLevel = program?.currentLevel || 1;
  const accuracy = program?.totalQuestions ? Math.round((program.totalCorrect / program.totalQuestions) * 100) : 0;
  const fallbackLevels = Array.from({ length: 10 }, (_, index) => ({
    level: index + 1,
    label: `Level ${index + 1}`,
    difficulty: index < 3 ? "Easy" : index < 7 ? "Intermediate" : "Hard",
    state: index === 0 ? "unlocked" : "locked",
  }));

  return (
    <div className="space-y-5">
      <section className="clay-accent-panel panel overflow-hidden bg-ink text-white">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="eyebrow !text-[#AFC0FF]"><Target size={13} /> Gemini adaptive journey</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.045em]">
              {program?.status === "completed" ? "All 10 levels completed." : `Level ${currentLevel}: ${program?.levels?.[currentLevel - 1]?.label || "Foundation"}`}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Six fresh questions are generated from your degree, target role and career interests. Score at least 4/6 to unlock the next level.
            </p>
            {adaptiveLoading ? (
              <p className="mt-5 flex items-center gap-2 text-xs font-bold text-white/70"><RefreshCw className="animate-spin" size={14} /> Loading your assessment path...</p>
            ) : adaptiveError ? (
              <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-xs font-bold text-coral">{adaptiveError}</span><button onClick={onRetryAdaptive} className="clay-hero-ghost-button btn-secondary min-h-9"><RefreshCw size={14} /> Retry</button></div>
            ) : !adaptive?.profileReady ? (
              <div className="mt-5">
                <p className="text-xs font-bold text-[#FFD1C5]">Required first: {(adaptive?.missingFields || []).join(", ") || "personal and career details"}</p>
                <button onClick={onCompleteProfile} className="clay-hero-button btn-accent mt-3">Complete career profile <ArrowRight size={15} /></button>
              </div>
            ) : !adaptive?.aiConfigured ? (
              <div className="mt-5 rounded-2xl border border-coral/30 bg-coral/10 p-4 text-xs leading-5 text-[#FFD1C5]">The feature is implemented, but the server needs a private <b>GEMINI_API_KEY</b> environment variable before it can generate real questions.</div>
            ) : program?.status === "completed" ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-jade/15 px-4 py-3 text-xs font-bold text-[#BEE8D5]"><Trophy size={16} /> Expert journey completed</div>
            ) : (
              <button onClick={onStartAdaptive} className="clay-hero-button btn-accent mt-5">
                {adaptive?.activeAttempt ? "Resume current level" : `Generate level ${currentLevel}`} <ArrowRight size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-80">
            <div className="clay-accent-stat rounded-2xl bg-white/10 p-4"><b className="block text-2xl">{program?.highestLevelCompleted || 0}/10</b><small className="text-[10px] font-bold uppercase tracking-wider text-white/50">Levels</small></div>
            <div className="clay-accent-stat rounded-2xl bg-white/10 p-4"><b className="block text-2xl">{accuracy}%</b><small className="text-[10px] font-bold uppercase tracking-wider text-white/50">Accuracy</small></div>
            <div className="clay-accent-stat rounded-2xl bg-white/10 p-4"><b className="block text-2xl">12m</b><small className="text-[10px] font-bold uppercase tracking-wider text-white/50">Per level</small></div>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><span className="eyebrow"><Target size={13} /> Progressive difficulty</span><h2 className="mt-2 text-xl font-extrabold">Your 10-level skill map</h2></div><p className="text-xs font-semibold text-muted">60 questions total · pass 4 of 6 per level</p></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(program?.levels || fallbackLevels).map((level) => (
            <article key={level.level} className={`rounded-[22px] border p-4 transition ${level.state === "completed" ? "border-jade/25 bg-jade/10" : level.state === "unlocked" ? "border-cobalt/30 bg-cobalt/10 shadow-lift" : "border-ink/[0.07] bg-white/35 opacity-65"}`}>
              <div className="flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-extrabold text-white ${level.state === "completed" ? "bg-jade" : level.state === "unlocked" ? "bg-cobalt" : "bg-muted"}`}>{level.state === "completed" ? <Check size={15} /> : level.level}</span>{level.state === "locked" ? <ShieldCheck size={15} className="text-muted" /> : level.state === "unlocked" ? <Zap size={15} className="text-cobalt" /> : <Trophy size={15} className="text-jade" />}</div>
              <h3 className="mt-4 text-sm font-extrabold">{level.label}</h3>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">{level.difficulty}</p>
              <p className="mt-3 text-[10px] leading-4 text-muted">6 questions · pass 4</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Administrator assessments</h2><p className="text-xs text-muted">Optional published question banks from CareerCube administrators.</p></div>{loading && <RefreshCw className="animate-spin text-cobalt" size={18} />}</div>
        {error ? (
          <div className="mt-5 rounded-2xl bg-coral/10 p-4"><p className="text-xs font-bold text-coral">{error}</p><button onClick={onRetry} className="btn-secondary mt-3 min-h-9"><RefreshCw size={14} /> Try again</button></div>
        ) : !loading && !assessments.length ? (
          <div className="mt-5 rounded-2xl border border-dashed border-ink/10 p-6 text-center"><ListChecks className="mx-auto text-muted" size={26} /><p className="mt-3 text-xs font-bold text-muted">No administrator assessment is published. Your Gemini journey above is still available.</p></div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`min-h-9 rounded-xl px-3 text-xs font-bold transition ${category === item ? "bg-ink text-white" : "border border-ink/[0.07] bg-white/60 text-muted"}`}>{item}</button>)}</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((assessment, index) => (
                <article key={assessment.id} className="rounded-[22px] border border-ink/[0.07] bg-white/40 p-5">
                  <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${colors[index % colors.length]}`}><Code2 size={19} /></span>{assessment.best_score != null ? <span className="tag !text-jade"><CheckCircle2 size={12} /> {Math.round(Number(assessment.best_score))}% best</span> : <span className="tag">{assessment.difficulty}</span>}</div>
                  <h3 className="mt-5 text-base font-extrabold">{assessment.title}</h3><p className="mt-1 text-xs text-muted">{assessment.category}</p>
                  <div className="mt-4 flex gap-4 text-[11px] text-muted"><span><CircleHelp className="mr-1 inline" size={12} />{assessment.question_count} questions</span><span><Clock3 className="mr-1 inline" size={12} />{assessment.time_limit_minutes} min</span></div>
                  <button onClick={() => onStart(assessment)} className={`mt-5 w-full ${assessment.best_score != null ? "btn-secondary" : "btn-primary"}`}>{assessment.best_score != null ? "Retake assessment" : "Start assessment"} <ArrowRight size={15} /></button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function LegacyAssessmentsPage({ assessments, loading, error, onRetry, onStart }) {
  const [category, setCategory] = useState("All");
  const list = category === "All" ? assessments : assessments.filter((item) => item.category === category);
  const categories = ["All", ...new Set(assessments.map((item) => item.category))];
  const completed = assessments.filter((item) => item.best_score != null);
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + Number(item.best_score), 0) / completed.length)
    : null;
  const recommended = assessments[0];
  const colors = ["bg-cobalt", "bg-jade", "bg-coral", "bg-plum", "bg-ink", "bg-[#A57945]"];

  if (loading) {
    return <section className="panel grid min-h-72 place-items-center text-center"><div><RefreshCw className="mx-auto animate-spin text-cobalt" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading published assessments...</p></div></section>;
  }
  if (error) {
    return <section className="panel grid min-h-72 place-items-center p-6 text-center"><div><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 text-lg font-extrabold">Assessments could not be loaded</h2><p className="mt-1 max-w-md text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></section>;
  }
  if (!assessments.length) {
    return <section className="panel grid min-h-80 place-items-center p-6 text-center"><div><ListChecks className="mx-auto text-muted" size={34} /><h2 className="mt-4 text-xl font-extrabold">No assessments are published yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Your administrator has not published any real assessment questions. New assessments will appear here automatically.</p></div></section>;
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="clay-accent-panel panel col-span-2 overflow-hidden bg-ink p-6 text-white md:col-span-2">
          <div className="flex items-start justify-between gap-5">
            <div><span className="eyebrow !text-[#AFC0FF]"><ArrowRight size={13} /> Recommended next</span><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{recommended.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/60">{recommended.description || `Measure your ${recommended.category.toLowerCase()} knowledge with administrator-published questions.`}</p><button onClick={() => onStart(recommended)} className="clay-hero-button btn-accent mt-5">Start {recommended.time_limit_minutes}-minute assessment <ArrowRight size={16} /></button></div>
            <span className="hidden h-28 w-28 shrink-0 place-items-center rounded-full border-[18px] border-jade text-center sm:grid"><span><b className="block text-2xl">{recommended.question_count}</b><small className="text-[9px] uppercase tracking-wider text-white/60">questions</small></span></span>
          </div>
        </div>
        <div className="panel p-6"><span className="icon-tile !bg-coral"><Award size={20} /></span><b className="mt-5 block text-3xl tracking-[-0.05em]">{averageScore == null ? "—" : `${averageScore}%`}</b><p className="text-xs font-bold">Your average best score</p><p className="mt-3 text-[11px] text-muted">{completed.length ? `${completed.length} assessment${completed.length === 1 ? "" : "s"} completed` : "Complete an assessment to see your score."}</p></div>
      </section>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`min-h-9 rounded-xl px-3 text-xs font-bold transition ${category === item ? "bg-ink text-white" : "border border-ink/[0.07] bg-white/60 text-muted"}`}>{item}</button>)}
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((assessment, index) => {
          return (
            <article key={assessment.id} className="panel p-5">
              <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${colors[index % colors.length]}`}><Code2 size={19} /></span>{assessment.best_score != null ? <span className="tag !text-jade"><CheckCircle2 size={12} /> {Math.round(Number(assessment.best_score))}% best</span> : <span className="tag">{assessment.difficulty}</span>}</div>
              <h3 className="mt-6 text-base font-extrabold">{assessment.title}</h3><p className="mt-1 text-xs text-muted">{assessment.category}</p>
              <div className="mt-4 flex gap-4 text-[11px] text-muted"><span><CircleHelp className="mr-1 inline" size={12} />{assessment.question_count} questions</span><span><Clock3 className="mr-1 inline" size={12} />{assessment.time_limit_minutes} min</span></div>
              <button onClick={() => onStart(assessment)} className={`mt-5 w-full ${assessment.best_score != null ? "btn-secondary" : "btn-primary"}`}>{assessment.best_score != null ? "Retake assessment" : "Start assessment"} <ArrowRight size={15} /></button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

const weeklyActivity = [
  { day: "Mon", minutes: 46, detail: "2 learning activities", tone: "bg-cobalt" },
  { day: "Tue", minutes: 72, detail: "Assessment practice", tone: "bg-cobalt" },
  { day: "Wed", minutes: 38, detail: "Resource review", tone: "bg-jade" },
  { day: "Thu", minutes: 84, detail: "Portfolio work", tone: "bg-cobalt" },
  { day: "Fri", minutes: 58, detail: "Job research", tone: "bg-jade" },
  { day: "Sat", minutes: 88, detail: "Learning sprint", tone: "bg-coral" },
  { day: "Sun", minutes: 0, detail: "No activity yet", tone: "bg-ink/[0.1]" },
];

function getWeekRange() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const month = new Intl.DateTimeFormat("en", { month: "short" });
  const day = new Intl.DateTimeFormat("en", { day: "numeric" });
  return month.format(monday) === month.format(sunday)
    ? `${month.format(monday)} ${day.format(monday)} – ${day.format(sunday)}`
    : `${month.format(monday)} ${day.format(monday)} – ${month.format(sunday)} ${day.format(sunday)}`;
}

function AnalyticsPage({ notify, data, onNavigate }) {
  const [selectedDay, setSelectedDay] = useState(5);
  const metrics = data?.metrics || {};
  const calculation = data?.calculation || {};
  const readinessScore = Math.round(Number(data?.readinessScore ?? 78));
  const assessmentScore = Math.round(Number(calculation.assessmentPerformance ?? 83));
  const learningProgress = Math.round(Number(calculation.learningProgress ?? 68));
  const selected = weeklyActivity[selectedDay];
  const maxMinutes = Math.max(...weeklyActivity.map((item) => item.minutes));
  const totalMinutes = weeklyActivity.reduce((sum, item) => sum + item.minutes, 0);
  const activeDays = weeklyActivity.filter((item) => item.minutes > 0).length;
  const nextActions = data?.nextActions?.slice(0, 2) || [
    { id: "learning", title: "Complete one analytics project", detail: "Turn your work into portfolio evidence", target: "learning", tone: "bg-coral" },
    { id: "assessment", title: "Schedule your next assessment", detail: "Keep your strongest skills current", target: "assessments", tone: "bg-cobalt" },
  ];
  const weekRange = getWeekRange();

  const printReport = () => {
    const reportWindow = window.open("", "_blank", "width=820,height=760");
    if (!reportWindow) {
      notify("Allow pop-ups to save your weekly report as a PDF.");
      return;
    }
    reportWindow.document.write(`<!doctype html><title>CareerCube weekly report</title><style>body{font-family:Arial,sans-serif;color:#1e2430;margin:48px;line-height:1.5}.eyebrow{color:#3155c6;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.score{font-size:38px;font-weight:800}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:28px 0}.card{border:1px solid #e5e1d8;border-radius:16px;padding:16px}.action{border-top:1px solid #e5e1d8;padding:12px 0}.muted{color:#69717d}</style><main><div class="eyebrow">CareerCube · weekly performance report</div><h1>${weekRange}</h1><p class="muted">A summary of your saved progress and next actions.</p><div class="grid"><div class="card"><div class="score">${readinessScore}%</div>Career readiness</div><div class="card"><div class="score">${assessmentScore}%</div>Assessment performance</div><div class="card"><div class="score">${learningProgress}%</div>Learning progress</div></div><h2>Progress snapshot</h2><p>${Number(metrics.assessmentsCompleted || 0)} assessments completed · ${Number(metrics.resourcesCompleted || 0)} learning resources completed · ${Number(metrics.applicationsActive || 0)} active applications</p><h2>Focus next</h2>${nextActions.map((action) => `<div class="action"><b>${action.title}</b><br><span class="muted">${action.detail}</span></div>`).join("")}</main>`);
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 200);
    notify("Print dialog opened—choose Save as PDF to download your report.");
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="Learning progress" value={`${learningProgress}%`} delta={`${Number(metrics.resourcesCompleted || 0)} resources completed`} tone="bg-cobalt" />
        <Metric icon={ListChecks} label="Assessment score" value={`${assessmentScore}%`} delta={`${Number(metrics.assessmentsCompleted || 0)} verified results`} tone="bg-jade" />
        <Metric icon={Target} label="Career readiness" value={`${readinessScore}%`} delta="Calculated from saved activity" tone="bg-coral" />
        <Metric icon={Flame} label="Weekly streak" value={`${activeDays}/7`} delta="One day to a full week" tone="bg-plum" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Weekly consistency</h2><p className="text-xs text-muted">Your focused work across the last seven days</p></div><span className="tag !bg-jade/10 !text-jade"><Flame size={12} /> {activeDays}/7 days active</span></div>
          <div className="mt-7 grid grid-cols-7 gap-2 sm:gap-3">{weeklyActivity.map((item, index) => { const height = item.minutes ? Math.max(18, Math.round((item.minutes / maxMinutes) * 100)) : 8; const isSelected = selectedDay === index; return <button key={item.day} onClick={() => setSelectedDay(index)} aria-pressed={isSelected} className={`rounded-2xl border p-2 text-center transition sm:p-3 ${isSelected ? "border-cobalt/35 bg-cobalt/[0.08] shadow-sm" : "border-transparent hover:border-ink/[0.08] hover:bg-ink/[0.03]"}`}><span className={`block text-[10px] font-extrabold ${isSelected ? "text-cobalt" : "text-muted"}`}>{item.day}</span><span className="mt-3 flex h-28 items-end rounded-xl bg-ink/[0.045] p-1.5"><span className={`w-full rounded-lg transition-all duration-300 ${item.tone}`} style={{ height: `${height}%` }} /></span><b className="mt-2 block text-[10px]">{item.minutes ? `${item.minutes}m` : "Rest"}</b></button>; })}</div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/[0.07] bg-white/55 p-4"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${selected.minutes ? selected.tone : "bg-ink/30"}`}><Clock3 size={16} /></span><span><b className="block text-sm">{selected.day}: {selected.minutes ? `${selected.minutes} minutes focused` : "Rest day"}</b><small className="text-xs text-muted">{selected.detail}</small></span></div><span className="text-xs font-extrabold text-muted">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m this week</span></div>
        </div>

        <div className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Weekly performance report</h2><p className="text-xs text-muted">{weekRange}</p></div><button onClick={printReport} className="btn-secondary min-h-9"><Download size={14} /> PDF</button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-[.78fr_1.22fr]"><div className="rounded-[22px] bg-ink p-5 text-white"><span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/55">Weekly score</span><b className="mt-3 block text-4xl tracking-[-.06em]">{readinessScore}<small className="text-lg text-white/55">/100</small></b><p className="mt-3 text-xs leading-5 text-white/65">Your saved profile, assessments and learning progress are moving in the right direction.</p></div><div className="grid gap-3 sm:grid-cols-3">{[["Assessment", `${assessmentScore}%`, "bg-jade/10 text-jade"], ["Learning", `${learningProgress}%`, "bg-cobalt/10 text-cobalt"], ["Applications", metrics.applicationsActive || 0, "bg-coral/10 text-coral"]].map(([label, value, tone]) => <div key={label} className={`rounded-2xl p-4 ${tone}`}><span className="text-[10px] font-extrabold uppercase tracking-[.12em]">{label}</span><b className="mt-3 block text-2xl tracking-[-.04em]">{value}</b><small className="mt-1 block text-[10px] opacity-80">{label === "Applications" ? "active now" : "current signal"}</small></div>)}</div></div>
          <div className="mt-5 rounded-2xl border border-ink/[0.07] bg-white/55 p-4"><div className="flex items-center justify-between gap-3"><div><b className="text-sm">Focus next</b><p className="mt-0.5 text-xs text-muted">Complete the small actions that strengthen your next application.</p></div><Target className="text-coral" size={19} /></div><div className="mt-3 space-y-2">{nextActions.map((action) => <button key={action.id} onClick={() => onNavigate(action.target)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-ink/[0.045]"><span className={`h-2.5 w-2.5 rounded-full ${action.tone}`} /><span className="min-w-0 flex-1"><b className="block text-xs">{action.title}</b><small className="text-[11px] text-muted">{action.detail}</small></span><ChevronRight className="text-muted" size={15} /></button>)}</div></div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white/55 p-4"><Lightbulb className="text-coral" size={20} /><p className="text-xs leading-5 text-muted"><b className="text-ink">AI insight:</b> Pair one learning session with a related assessment this week to turn progress into a stronger career signal.</p></div>
        </div>
      </section>
    </div>
  );
}

function LearningPage({ notify }) {
  const [category, setCategory] = useState("All resources");
  const filtered = category === "All resources" ? resources : resources.filter((item) => item.category.includes(category));
  return (
    <div className="space-y-5">
      <section className="panel grid overflow-hidden md:grid-cols-[1fr_.6fr]">
        <div className="p-6 sm:p-8"><span className="eyebrow"><Target size={13} /> Personalized next step</span><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">Finish SQL for Product Decisions</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted">Completing this course supports three of your top five job matches and closes your biggest analytics gap.</p><div className="mt-5 flex items-center gap-4"><button onClick={() => notify("Course resumed at lesson 7.")} className="btn-accent"><Play size={15} fill="currentColor" /> Continue learning</button><span className="text-xs font-bold text-muted">32 min left</span></div></div>
        <div className="relative hidden place-items-center bg-[#DED2BE] md:grid"><div className="grid h-36 w-36 place-items-center rounded-full border-[20px] border-cobalt bg-white/50"><span className="text-center"><b className="block text-2xl">68%</b><small className="text-[10px] font-bold text-muted">complete</small></span></div></div>
      </section>
      <div className="flex flex-wrap gap-2">{["All resources", "Career Toolkit", "Data & Analytics", "Development", "Communication"].map((item) => <button key={item} onClick={() => setCategory(item)} className={`min-h-9 rounded-xl px-3 text-xs font-bold ${category === item ? "bg-ink text-white" : "bg-white/60 text-muted"}`}>{item}</button>)}</div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((resource) => (
          <article className="panel overflow-hidden" key={resource.id}>
            <div className={`flex h-32 items-end justify-between p-5 text-white ${resource.tone}`}><span className="font-display text-4xl italic">{resource.icon}</span><button className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur-md"><Bookmark size={16} /></button></div>
            <div className="p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-coral">{resource.category}</p><h3 className="mt-2 text-base font-extrabold">{resource.title}</h3><div className="mt-3 flex gap-3 text-[11px] text-muted"><span>{resource.level}</span><span>·</span><span>{resource.time}</span></div>{resource.progress > 0 && <div className="mt-4"><div className="mb-1.5 flex justify-between text-[10px] font-bold text-muted"><span>Progress</span><span>{resource.progress}%</span></div><div className="progress-track"><div className="h-full rounded-full bg-jade" style={{ width: `${resource.progress}%` }} /></div></div>}<button onClick={() => notify(resource.category.includes("PDF") ? "Resource downloaded." : "Learning resource opened.")} className="btn-secondary mt-5 w-full">{resource.category.includes("PDF") ? <><Download size={15} /> Download resource</> : <><Play size={15} /> {resource.progress ? "Continue" : "Start learning"}</>}</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function LegacyCommunityPage({ posts, setPosts, notify, viewer, onNewPost }) {
  const toggleLike = (id) => setPosts((current) => current.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
      <section className="space-y-4">
        <button onClick={onNewPost} className="panel flex w-full items-center gap-3 p-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-plum text-xs font-extrabold text-white">{getInitials(viewer?.name)}</span><span className="input flex min-h-10 items-center text-muted">Share a question, insight or win...</span><span className="btn-accent min-h-10 px-4"><Send size={15} /></span></button>
        {posts.map((post) => (
          <article className="panel p-5" key={post.id}>
            <header className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-xs font-extrabold text-white ${post.tone}`}>{post.initials}</span><div className="flex-1"><b className="block text-sm">{post.author}</b><small className="text-[11px] text-muted">{post.role} · {post.time}</small></div><button className="btn-ghost min-h-8"><MoreHorizontal size={16} /></button></header>
            <p className="mt-5 text-sm leading-7 text-ink/80">{post.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            <footer className="mt-5 flex items-center gap-2 border-t border-ink/[0.07] pt-4">
              <button onClick={() => toggleLike(post.id)} className={`btn-ghost min-h-9 ${post.liked ? "!bg-coral/10 !text-coral" : ""}`}><Heart size={15} fill={post.liked ? "currentColor" : "none"} /> {post.likes}</button>
              <button onClick={() => notify("Comment thread opened.")} className="btn-ghost min-h-9"><MessageCircle size={15} /> {post.comments}</button>
              <button onClick={() => notify("Post link copied.")} className="btn-ghost ml-auto min-h-9"><Share2 size={15} /> Share</button>
            </footer>
          </article>
        ))}
      </section>
      <aside className="space-y-5">
        <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-extrabold">Trending circles</h2><Users size={17} className="text-muted" /></div><div className="mt-4 space-y-3">{[["Data Career Circle", "1.2k members", "bg-cobalt"], ["Fresh Graduate Network", "884 members", "bg-coral"], ["Women in Product BD", "620 members", "bg-jade"]].map(([name, count, tone]) => <div className="flex items-center gap-3" key={name}><span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white ${tone}`}>{name[0]}</span><span className="flex-1"><b className="block text-xs">{name}</b><small className="text-[10px] text-muted">{count}</small></span><button className="text-xs font-bold text-cobalt">Join</button></div>)}</div></div>
        <div className="overflow-hidden rounded-[28px] bg-cobalt p-6 text-white"><Trophy size={20} /><h2 className="mt-5 text-xl font-extrabold">Community challenge</h2><p className="mt-2 text-sm leading-6 text-white/65">Share one lesson from your latest assessment by Friday.</p><div className="mt-5 flex items-center justify-between text-xs"><b>84 joined</b><ArrowRight size={16} /></div></div>
      </aside>
    </div>
  );
}

function LegacyServerEventsPage({ events, loading, error, onRetry, onRegister, onCancelReservation, reservingEventId, cancellingEventId }) {
  const [view, setView] = useState("list");
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const moveMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  if (loading) return <div className="grid min-h-64 place-items-center text-center"><RefreshCw className="animate-spin text-cobalt" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading published events...</p></div>;
  if (error) return <div className="grid min-h-64 place-items-center text-center"><div><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 font-extrabold">Could not load events</h2><p className="mt-1 text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl bg-ink/[0.05] p-1">{["list", "calendar"].map((item) => <button onClick={() => setView(item)} key={item} className={`min-h-9 rounded-lg px-3 text-xs font-bold capitalize ${view === item ? "bg-white shadow-sm" : "text-muted"}`}>{item}</button>)}</div><p className="text-xs font-semibold text-muted">{events.length} published upcoming event{events.length === 1 ? "" : "s"}</p></div>
    {!events.length ? <section className="panel grid min-h-72 place-items-center p-8 text-center"><div><CalendarDays className="mx-auto text-muted" size={34} /><h2 className="mt-4 text-lg font-extrabold">No upcoming events yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Your CareerCube administrator has not published an event yet. New workshops and sessions will appear here automatically.</p></div></section> : view === "list" ? <section className="grid gap-4 lg:grid-cols-2">{events.map((event) => {
      const start = new Date(event.starts_at);
      const end = new Date(event.ends_at);
      const full = event.capacity != null && Number(event.seats_remaining) <= 0 && !event.registered;
      const reserving = Number(reservingEventId) === Number(event.id);
      return <article className="panel flex gap-4 p-5" key={event.id}><div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-ink text-center text-white"><span><b className="block text-xl leading-none">{start.getDate()}</b><small className="text-[9px] font-bold uppercase text-white/60">{start.toLocaleDateString([], { month: "short" })}</small></span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><span className="tag">{event.event_type}</span>{event.registered && <span className="tag !bg-jade/10 !text-jade"><Check size={12} /> Reserved</span>}</div><h3 className="mt-2 text-sm font-extrabold leading-5">{event.title}</h3>{event.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{event.description}</p>}<p className="mt-3 text-[11px] text-muted"><Clock3 className="mr-1 inline" size={12} />{start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{!Number.isNaN(end.getTime()) && ` – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}</p><p className="mt-1 text-[11px] text-muted">{event.host}{event.location ? ` · ${event.location}` : ""}</p><div className="mt-4 flex flex-wrap items-center gap-2"><button disabled={event.registered || full || reserving} onClick={() => onRegister(event)} className={`min-h-9 ${event.registered ? "btn-secondary !text-jade" : full ? "btn-secondary" : "btn-primary"}`}>{event.registered ? <><Check size={14} /> Seat reserved</> : full ? "Fully reserved" : reserving ? "Reserving..." : "Reserve a seat"}</button>{event.event_url && <a href={event.event_url} target="_blank" rel="noreferrer" className="btn-secondary min-h-9"><ExternalLink size={14} /> Event link</a>}<small className="text-[10px] font-bold text-muted">{event.capacity == null ? `${event.registration_count} reserved` : `${event.seats_remaining} seat${Number(event.seats_remaining) === 1 ? "" : "s"} left`}</small></div></div></article>;
    })}</section> : <EventCalendar events={events} month={month} onPrevious={() => moveMonth(-1)} onNext={() => moveMonth(1)} />}
  </div>;
}

function EventsPage({ events, loading, error, onRetry, onRegister, onCancelReservation, reservingEventId, cancellingEventId }) {
  const [view, setView] = useState("list");
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const moveMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  if (loading) {
    return <div className="grid min-h-64 place-items-center text-center"><RefreshCw className="animate-spin text-cobalt" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading published events...</p></div>;
  }
  if (error) {
    return <div className="grid min-h-64 place-items-center text-center"><div><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 font-extrabold">Could not load events</h2><p className="mt-1 text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></div>;
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex rounded-xl bg-ink/[0.05] p-1">
        {["list", "calendar"].map((item) => <button type="button" onClick={() => setView(item)} key={item} className={`min-h-9 rounded-lg px-3 text-xs font-bold capitalize ${view === item ? "bg-white shadow-sm" : "text-muted"}`}>{item}</button>)}
      </div>
      <p className="text-xs font-semibold text-muted">{events.length} published upcoming event{events.length === 1 ? "" : "s"}</p>
    </div>

    {!events.length ? <section className="panel grid min-h-72 place-items-center p-8 text-center"><div><CalendarDays className="mx-auto text-muted" size={34} /><h2 className="mt-4 text-lg font-extrabold">No upcoming events yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Your CareerCube administrator has not published an event yet. New workshops and sessions will appear here automatically.</p></div></section> : view === "list" ? <section className="grid gap-4 lg:grid-cols-2">{events.map((event) => {
      const start = new Date(event.starts_at);
      const end = new Date(event.ends_at);
      const reserved = Boolean(event.registered);
      const full = event.capacity != null && Number(event.seats_remaining) <= 0 && !reserved;
      const reserving = Number(reservingEventId) === Number(event.id);
      const cancelling = Number(cancellingEventId) === Number(event.id);
      const seatText = event.capacity == null ? `${event.registration_count} reserved` : `${event.seats_remaining} seat${Number(event.seats_remaining) === 1 ? "" : "s"} left`;

      return <article className="panel flex gap-4 p-5" key={event.id}>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-ink text-center text-white"><span><b className="block text-xl leading-none">{start.getDate()}</b><small className="text-[9px] font-bold uppercase text-white/60">{start.toLocaleDateString([], { month: "short" })}</small></span></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2"><span className="tag">{event.event_type}</span>{reserved && <span className="tag !bg-jade/10 !text-jade"><Check size={12} /> Reserved</span>}</div>
          <h3 className="mt-2 text-sm font-extrabold leading-5">{event.title}</h3>
          {event.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{event.description}</p>}
          <p className="mt-3 text-[11px] text-muted"><Clock3 className="mr-1 inline" size={12} />{start.toLocaleDateString()} - {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{!Number.isNaN(end.getTime()) && ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}</p>
          <p className="mt-1 text-[11px] text-muted">{event.host}{event.location ? ` - ${event.location}` : ""}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {reserved ? <button type="button" disabled={cancelling} onClick={() => onCancelReservation(event)} className="btn-secondary min-h-9 !text-coral disabled:cursor-not-allowed disabled:opacity-60">{cancelling ? "Cancelling..." : "Cancel reservation"}</button> : <button type="button" disabled={full || reserving} onClick={() => onRegister(event)} className={`min-h-9 ${full ? "btn-secondary" : "btn-primary"}`}>{full ? "Fully reserved" : reserving ? "Reserving..." : "Reserve a seat"}</button>}
            {event.event_url && <a href={event.event_url} target="_blank" rel="noreferrer" className="btn-secondary min-h-9"><ExternalLink size={14} /> Event link</a>}
            <small className="text-[10px] font-bold text-muted">{seatText}</small>
          </div>
        </div>
      </article>;
    })}</section> : <EventCalendar events={events} month={month} onPrevious={() => moveMonth(-1)} onNext={() => moveMonth(1)} />}
  </div>;
}

function EventCalendar({ events, month, onPrevious, onNext }) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  return <section className="panel overflow-hidden p-5"><div className="mb-5 flex items-center justify-between"><button onClick={onPrevious} className="btn-ghost" aria-label="Previous month"><ChevronLeft size={16} /></button><h2 className="font-extrabold">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h2><button onClick={onNext} className="btn-ghost" aria-label="Next month"><ChevronRight size={16} /></button></div><div className="calendar-grid border-l border-t border-ink/[0.07]">{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => <div key={day} className="border-b border-r border-ink/[0.07] p-2 text-center text-[9px] font-extrabold text-muted">{day}</div>)}{cells.map((day, index) => { const dayEvents = day > 0 && day <= daysInMonth ? events.filter((event) => { const start = new Date(event.starts_at); return start.getFullYear() === year && start.getMonth() === monthIndex && start.getDate() === day; }) : []; return <div key={index} className="relative min-h-24 border-b border-r border-ink/[0.07] p-2 text-xs font-semibold text-muted">{day > 0 && day <= daysInMonth ? day : ""}{dayEvents.slice(0, 2).map((event) => <span key={event.id} title={event.title} className="mt-1 block truncate rounded-lg bg-cobalt px-1.5 py-1 text-[8px] font-bold text-white">{event.title}</span>)}</div>; })}</div></section>;
}

function LegacyEventsPage({ events, onRegister }) {
  const [view, setView] = useState("list");
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div className="flex rounded-xl bg-ink/[0.05] p-1">{["list", "calendar"].map((item) => <button onClick={() => setView(item)} key={item} className={`min-h-9 rounded-lg px-3 text-xs font-bold capitalize ${view === item ? "bg-white shadow-sm" : "text-muted"}`}>{item}</button>)}</div><p className="text-xs font-semibold text-muted">August 2026</p></div>
      {view === "list" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => <article className="panel flex gap-4 p-5" key={event.id}><div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-ink text-center text-white"><span><b className="block text-xl leading-none">{event.day}</b><small className="text-[9px] font-bold text-white/60">{event.month}</small></span></div><div className="min-w-0 flex-1"><span className="tag mb-2">{event.type}</span><h3 className="text-sm font-extrabold leading-5">{event.title}</h3><p className="mt-2 text-[11px] text-muted"><Clock3 className="mr-1 inline" size={12} />{event.time} · {event.host}</p><button onClick={() => onRegister(event.id)} className={`mt-4 min-h-9 ${event.registered ? "btn-secondary !text-jade" : "btn-primary"}`}>{event.registered ? <><Check size={14} /> Registered</> : "Reserve a seat"}</button></div></article>)}
        </section>
      ) : <LegacyEventCalendar events={events} />}
    </div>
  );
}

function LegacyEventCalendar({ events }) {
  return <section className="panel overflow-hidden p-5"><div className="mb-5 flex items-center justify-between"><button className="btn-ghost"><ChevronLeft size={16} /></button><h2 className="font-extrabold">August 2026</h2><button className="btn-ghost"><ChevronRight size={16} /></button></div><div className="calendar-grid border-l border-t border-ink/[0.07]">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day) => <div key={day} className="border-b border-r border-ink/[0.07] p-2 text-center text-[9px] font-extrabold text-muted">{day}</div>)}{Array.from({ length: 35 }, (_, i) => i - 1).map((day, index) => <div key={index} className="relative min-h-20 border-b border-r border-ink/[0.07] p-2 text-xs font-semibold text-muted">{day > 0 && day <= 31 ? day : ""}{events.some((e) => Number(e.day) === day) && <span className="absolute bottom-2 left-2 right-2 rounded-lg bg-cobalt px-1.5 py-1 text-[8px] font-bold text-white">Career event</span>}</div>)}</div></section>;
}

function AchievementsPage() {
  const iconMap = { user: UserRound, zap: Zap, message: MessageCircle, target: Target, briefcase: BriefcaseBusiness, book: BookOpen };
  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <div className="panel flex items-center gap-5 p-6"><div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-coral text-white shadow-lg"><span className="text-center"><Medal className="mx-auto" size={30} /><b className="mt-1 block text-xl">560</b><small className="text-[9px] font-bold">XP</small></span></div><div><span className="eyebrow">Level 6</span><h2 className="mt-2 text-xl font-extrabold">Career Builder</h2><p className="mt-2 text-xs leading-5 text-muted">140 XP until Level 7</p><div className="progress-track mt-3 w-full"><div className="h-full w-[72%] rounded-full bg-coral" /></div></div></div>
        <div className="rounded-[28px] bg-ink p-6 text-white"><div className="flex items-start justify-between"><div><span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#AFC0FF]">Next milestone</span><h2 className="mt-2 text-2xl font-extrabold">Interview Ready</h2><p className="mt-2 text-sm text-white/60">Reach an 80% readiness score to unlock.</p></div><Target className="text-coral" size={34} /></div><div className="mt-6 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[96%] rounded-full bg-coral" /></div><b className="text-xs">78 / 80</b></div></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {seedAchievements.map((item) => { const Icon = iconMap[item.icon]; return <article className={`panel p-5 ${!item.unlocked ? "opacity-70" : ""}`} key={item.title}><div className="flex items-start justify-between"><span className={`grid h-14 w-14 place-items-center rounded-[20px] ${item.unlocked ? "bg-jade text-white shadow-lg" : "bg-ink/[0.07] text-muted"}`}><Icon size={23} /></span>{item.unlocked ? <span className="tag !text-jade"><Check size={12} /> Unlocked</span> : <ShieldCheck size={17} className="text-muted" />}</div><h3 className="mt-5 text-base font-extrabold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>{item.unlocked ? <p className="mt-5 text-[10px] font-bold text-muted">Earned {item.date}</p> : <div className="mt-5"><div className="mb-1 flex justify-between text-[10px] font-bold text-muted"><span>Progress</span><span>{item.progress}%</span></div><div className="progress-track"><div className="h-full rounded-full bg-cobalt" style={{ width: `${item.progress}%` }} /></div></div>}</article>; })}
      </section>
    </div>
  );
}

function SocialProfilePreview({ avatar, name, profile }) {
  const activeProfiles = socialProfileFields
    .map((item) => ({
      ...item,
      href: socialProfileHref(item.key, profile[item.key]),
      display: socialProfileDisplay(item.key, profile[item.key]),
    }))
    .filter((item) => item.href);

  if (!activeProfiles.length) {
    return <p className="mt-5 rounded-2xl bg-ink/[0.035] px-3 py-3 text-[10px] leading-4 text-muted dark:bg-white/[0.04]">Add a social profile below to create your contact preview.</p>;
  }

  return (
    <div className="mt-5 space-y-2 text-left">
      {activeProfiles.map(({ key, label, Icon, tone, href, display }) => (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={`clay-social-card social-${tone} flex items-center gap-3 rounded-2xl p-2.5`} aria-label={`Open ${label} profile`}>
          <span className="clay-social-avatar relative grid h-10 w-10 shrink-0 place-items-center overflow-visible rounded-xl bg-cobalt text-[10px] font-extrabold text-white">
            <span className="h-full w-full overflow-hidden rounded-xl">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center">{getInitials(name)}</span>}</span>
            <span className="clay-social-badge absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-white"><Icon size={11} /></span>
          </span>
          <span className="min-w-0 flex-1"><b className="block text-xs">{label}</b><small className="block truncate text-[9px] text-muted">{display}</small></span>
          <ExternalLink size={13} className="shrink-0 text-muted" />
        </a>
      ))}
      <p className="px-1 pt-1 text-[9px] leading-4 text-muted">Your CareerCube photo is used as the DP preview. Links open the original social profile.</p>
    </div>
  );
}

function ProfilePage({ user, onSave, notify }) {
  const [avatar, setAvatar] = useState(user.avatar_data || user.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    email: user.email || "",
    university: user.university || "",
    degree: user.degree || "",
    graduation: user.graduation_year || "",
    target: user.target_role || "",
    location: user.location || "",
    interests: Array.isArray(user.career_interests) ? user.career_interests : [],
    skills: Array.isArray(user.skills) ? user.skills.map((skill) => typeof skill === "string" ? skill : skill.name).filter(Boolean) : [],
    ...socialProfileValues(user),
  });
  useEffect(() => {
    setAvatar(user.avatar_data || user.avatar_url || null);
    setForm({
      name: user.name || "",
      email: user.email || "",
      university: user.university || "",
      degree: user.degree || "",
      graduation: user.graduation_year || "",
      target: user.target_role || "",
      location: user.location || "",
      interests: Array.isArray(user.career_interests) ? user.career_interests : [],
      skills: Array.isArray(user.skills) ? user.skills.map((skill) => typeof skill === "string" ? skill : skill.name).filter(Boolean) : [],
      ...socialProfileValues(user),
    });
  }, [user.name, user.email, user.university, user.degree, user.graduation_year, user.target_role, user.location, user.career_interests, user.skills, user.avatar_data, user.avatar_url, user.facebook_url, user.instagram_url, user.whatsapp, user.twitter_url, user.telegram]);
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoLoading(true);
    try {
      setAvatar(await prepareProfilePhoto(file));
    } catch (error) {
      notify(error.message);
    } finally {
      setPhotoLoading(false);
    }
  };
  const submit = async () => {
    if (saving || photoLoading) return;
    const missing = [
      ["University", form.university],
      ["Degree", form.degree],
      ["Graduation year", form.graduation],
      ["Target role", form.target],
      ["Location", form.location],
      ["Career interests", form.interests.length],
    ].filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
    if (missing.length) {
      notify(`Complete these required fields: ${missing.join(", ")}`);
      return;
    }
    const invalidSocial = socialProfileFields
      .map(({ key, label }) => ({ label, error: socialProfileError(key, form[key]) }))
      .find((item) => item.error);
    if (invalidSocial) {
      notify(`${invalidSocial.label}: ${invalidSocial.error}`);
      return;
    }
    setSaving(true);
    await onSave({ ...form, avatar });
    setSaving(false);
  };
  const addInterest = () => {
    const value = interestInput.trim().replace(/\s+/g, " ");
    if (value.length < 2) return;
    if (form.interests.some((interest) => interest.toLowerCase() === value.toLowerCase())) {
      notify("That career interest is already added.");
      return;
    }
    if (form.interests.length >= 8) {
      notify("You can add up to 8 career interests.");
      return;
    }
    setForm((current) => ({ ...current, interests: [...current.interests, value.slice(0, 60)] }));
    setInterestInput("");
  };
  const removeInterest = (interest) => setForm((current) => ({
    ...current,
    interests: current.interests.filter((item) => item !== interest),
  }));
  const addSkill = () => {
    const value = skillInput.trim().replace(/\s+/g, " ");
    if (value.length < 2) return;
    if (form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      notify("That skill is already added.");
      return;
    }
    if (form.skills.length >= 20) {
      notify("You can add up to 20 skills.");
      return;
    }
    setForm((current) => ({ ...current, skills: [...current.skills, value.slice(0, 60)] }));
    setSkillInput("");
  };
  const removeSkill = (skill) => setForm((current) => ({
    ...current,
    skills: current.skills.filter((item) => item !== skill),
  }));
  return (
    <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
      <aside className="space-y-5">
        <div className="panel p-6 text-center">
          <label className={`group relative mx-auto block h-28 w-28 overflow-hidden rounded-[32px] bg-cobalt text-white shadow-lift ${photoLoading ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
            {avatar ? <img src={avatar} alt={`${form.name || "Student"} profile`} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-extrabold">{getInitials(form.name)}</span>}
            <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition group-hover:opacity-100">{photoLoading ? <RefreshCw className="animate-spin" size={22} /> : <Camera size={22} />}</span>
            <input disabled={photoLoading} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={choosePhoto} />
          </label>
          <h2 className="mt-4 text-xl font-extrabold">{form.name || "Student"}</h2>
          <p className="mt-1 text-xs text-muted">{form.degree || form.email}</p>
          <p className="mt-2 text-[10px] text-muted">{photoLoading ? "Optimizing photo..." : "Click the photo to upload JPG, PNG or WebP"}</p>
          <span className="tag mt-4 !text-jade"><CheckCircle2 size={12} /> Authenticated student</span>
          <SocialProfilePreview avatar={avatar} name={form.name} profile={form} />
        </div>
      </aside>
      <section className="panel p-6">
        <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Personal & career details</h2><p className="text-xs text-muted">Used to personalize recommendations.</p></div><Pencil size={17} className="text-muted" /></div>
        <div className="grid gap-4 sm:grid-cols-2">{[["Full name", "name", false], ["Email address", "email", false], ["University", "university", true], ["Degree", "degree", true], ["Graduation year", "graduation", true], ["Target role", "target", true], ["Location", "location", true]].map(([label, key, required]) => <label key={key} className="block"><span className="mb-1.5 block text-xs font-bold">{label}{required && <span className="ml-1 text-coral">*</span>}</span><input required={required} type={key === "email" ? "email" : key === "graduation" ? "number" : "text"} min={key === "graduation" ? "1950" : undefined} max={key === "graduation" ? String(new Date().getFullYear() + 10) : undefined} value={form[key]} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} className="input" placeholder={key === "target" ? "e.g. Backend Software Engineer" : undefined} /></label>)}</div>
        <div className="mt-6">
          <span className="mb-2 block text-xs font-bold">Career interests<span className="ml-1 text-coral">*</span></span>
          <p className="mb-3 text-[10px] leading-4 text-muted">These interests, your degree and target role personalize every AI assessment level.</p>
          <div className="flex flex-wrap gap-2">
            {form.interests.map((item) => <button type="button" onClick={() => removeInterest(item)} className="tag !bg-cobalt/10 !text-cobalt" key={item}>{item}<X size={11} /></button>)}
          </div>
          <div className="mt-3 flex max-w-xl gap-2">
            <input
              className="input"
              value={interestInput}
              maxLength={60}
              onChange={(event) => setInterestInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addInterest();
                }
              }}
              placeholder="e.g. Backend Engineering"
            />
            <button type="button" onClick={addInterest} className="btn-secondary shrink-0"><Plus size={14} /> Add</button>
          </div>
          {!form.interests.length && <p className="mt-2 text-[10px] font-bold text-coral">Add at least one career interest to unlock skill assessments.</p>}
        </div>
        <div className="mt-6">
          <span className="mb-2 block text-xs font-bold">Skills for AI job matching</span>
          <p className="mb-3 text-[10px] leading-4 text-muted">Add professional skills such as React, JavaScript, SQL, Figma or communication. Only these skills and your career information are used for matching.</p>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((item) => <button type="button" onClick={() => removeSkill(item)} className="tag !bg-jade/10 !text-jade" key={item}>{item}<X size={11} /></button>)}
          </div>
          <div className="mt-3 flex max-w-xl gap-2">
            <input className="input" value={skillInput} maxLength={60} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="e.g. React, SQL or Communication" />
            <button type="button" onClick={addSkill} className="btn-secondary shrink-0"><Plus size={14} /> Add</button>
          </div>
          {!form.skills.length && <p className="mt-2 text-[10px] font-bold text-coral">Add skills to unlock a reliable AI job match score.</p>}
        </div>
        <section className="clay-social-editor mt-7 rounded-[24px] border border-ink/[0.07] p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cobalt/10 text-cobalt"><Link2 size={17} /></span>
            <div><h3 className="text-sm font-extrabold">Social profiles</h3><p className="mt-1 text-[10px] leading-4 text-muted">Optional. Saved links appear in your profile preview and are shared only with accepted CareerCube connections.</p></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {socialProfileFields.map(({ key, label, Icon, placeholder, tone, maxLength, type = "text" }) => {
              const error = socialProfileError(key, form[key]);
              return (
                <label key={key} className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-bold"><span className={`social-${tone} text-[var(--social-color)]`}><Icon size={14} /></span>{label}</span>
                  <input
                    type={type}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className={`input ${error ? "!border-coral/60" : ""}`}
                    placeholder={placeholder}
                    autoComplete={type === "tel" ? "tel" : "url"}
                    aria-invalid={Boolean(error)}
                  />
                  {error && <small className="mt-1.5 block text-[9px] font-bold leading-4 text-coral">{error}</small>}
                </label>
              );
            })}
          </div>
        </section>
        <div className="mt-8 flex justify-end"><button disabled={saving || photoLoading} onClick={submit} className="btn-accent disabled:cursor-not-allowed disabled:opacity-60"><Check size={16} /> {saving ? "Saving..." : photoLoading ? "Preparing photo..." : "Save changes"}</button></div>
      </section>
    </div>
  );
}

function JobModal({ job, applied, onClose, onApply }) {
  const isExternal = job.application_mode === "external";
  const externalApplyUrl = job.external_apply_url;
  const openExternalJob = () => {
    if (externalApplyUrl) window.open(externalApplyUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card max-h-[92vh] max-w-3xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-4"><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[20px] text-lg font-extrabold text-white ${job.tone}`}>{job.logo}</span><div className="flex-1"><h2 className="text-xl font-extrabold">{job.title}</h2><p className="mt-1 text-sm text-muted">{job.company} · {job.displayLocation}</p></div><button onClick={onClose} className="btn-ghost min-h-9"><X size={18} /></button></div>
        <div className="mt-6 flex flex-wrap gap-2"><span className="tag">{job.type || "Role"}</span>{job.category && <span className="tag">{job.category}</span>}<span className="tag">{job.salary}</span><span className="tag !bg-coral/10 !text-coral"><Clock3 size={12} /> {isExternal ? `Via ${job.source_name || "verified company source"}` : `Apply by ${new Date(job.expires_at).toLocaleDateString()}`}</span>{applied && <span className="tag !bg-jade/10 !text-jade"><CheckCircle2 size={12} /> Already applied</span>}</div>
        {isExternal && <p className="mt-4 rounded-xl border border-jade/20 bg-jade/5 p-3 text-xs leading-5 text-muted">This verified job links to {job.source_name || "the company’s official application source"}. Applying opens that site, so CareerCube does not track the final application status.</p>}
        <div className="my-6 h-px bg-ink/[0.08]" />
        <h3 className="text-sm font-extrabold">About the opportunity</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">{job.description}</p>
        {!!job.responsibilitiesList.length && <><h3 className="mt-6 text-sm font-extrabold">Responsibilities</h3><ul className="mt-3 space-y-2">{job.responsibilitiesList.map((item) => <li className="flex gap-2 text-sm leading-6 text-muted" key={item}><Check size={15} className="mt-1 shrink-0 text-cobalt" />{item}</li>)}</ul></>}
        <h3 className="mt-6 text-sm font-extrabold">Candidate requirements</h3>
        <ul className="mt-3 space-y-2">{job.requirementsList.map((item) => <li className="flex gap-2 text-sm leading-6 text-muted" key={item}><Check size={15} className="mt-1 shrink-0 text-jade" />{item}</li>)}</ul>
        {job.match_percentage != null && <section className="mt-6 rounded-2xl border border-cobalt/15 bg-cobalt/5 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-extrabold">Your job match</h3><p className="mt-1 text-xs text-muted">A guidance score based on your saved skills, target role, interests, education and location.</p></div><span className="rounded-xl bg-cobalt px-3 py-2 text-sm font-extrabold text-white">{job.match_percentage}%</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><b className="text-[11px] uppercase tracking-[.08em] text-muted">Why it fits</b><ul className="mt-2 space-y-1.5">{job.reasons.map((reason) => <li className="flex gap-2 text-xs leading-5 text-muted" key={reason}><CheckCircle2 className="mt-0.5 shrink-0 text-jade" size={13} />{reason}</li>)}</ul></div><div><b className="text-[11px] uppercase tracking-[.08em] text-muted">Skills to strengthen</b>{job.skill_gaps.length ? <div className="mt-2 flex flex-wrap gap-1.5">{job.skill_gaps.map((skill) => <span className="tag !bg-coral/10 !text-coral" key={skill}>{skill}</span>)}</div> : <p className="mt-2 text-xs text-jade">No identified required-skill gap.</p>}</div></div>{job.ai_explained && <p className="mt-3 text-[10px] font-bold text-cobalt">AI explanation generated from non-identifying professional profile data.</p>}</section>}
        {job.company_description && <div className="mt-6 rounded-2xl bg-ink/[0.035] p-4"><h3 className="text-sm font-extrabold">About {job.company}</h3><p className="mt-2 text-xs leading-5 text-muted">{job.company_description}</p>{job.company_website && <a href={job.company_website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cobalt">Company website <ExternalLink size={13} /></a>}</div>}
        <div className="mt-7 flex flex-wrap justify-end gap-3"><button className="btn-secondary"><Bookmark size={16} /> Save role</button><button disabled={!isExternal && applied} onClick={isExternal ? openExternalJob : onApply} className="btn-accent disabled:cursor-not-allowed disabled:opacity-50">{isExternal ? `Apply on ${job.source_name || "source"}` : applied ? "Application sent" : "Apply with CareerCube"} {isExternal ? <ExternalLink size={16} /> : <ArrowRight size={16} />}</button></div>
      </div>
    </div>
  );
}

function ApplyModal({ job, user, resumeName, coverLetterEnabled, coverLetterTone, onClose, onSubmit }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const resumeOwner = (resumeName || user?.name || "Student").trim();
  const resumeFileName = `${resumeOwner.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Student"}_Resume.pdf`;
  const generate = () => {
    const name = user?.name || "Student";
    const templates = {
      Concise: `Dear ${job.company} Hiring Team,\n\nI am applying for the ${job.title} role. My skills and learning experience align with this opportunity, and I would welcome the chance to contribute to ${job.company}.\n\nSincerely,\n${name}`,
      Confident: `Dear ${job.company} Hiring Team,\n\nI am confident that my practical skills, projects and commitment to continuous learning make me a strong candidate for the ${job.title} role. I am ready to contribute meaningful work and grow with ${job.company}.\n\nSincerely,\n${name}`,
      Warm: `Hello ${job.company} Hiring Team,\n\nI was excited to discover the ${job.title} opportunity. The role closely matches the work I enjoy and the skills I am building, and I would love to bring that energy to your team.\n\nWarm regards,\n${name}`,
      Professional: `Dear ${job.company} Hiring Team,\n\nI am excited to apply for the ${job.title} role. My skills, projects and learning experience align with this opportunity, and I would value the chance to contribute while continuing to grow.\n\nI would welcome the opportunity to discuss how I can contribute to ${job.company}.\n\nSincerely,\n${name}`,
    };
    setCoverLetter(templates[coverLetterTone] || templates.Professional);
  };
  const selectResumeFile = (event) => {
    const file = event.target.files?.[0];
    setFileError("");
    if (!file) return;
    const allowed = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
    if (!allowed.has(file.type)) {
      setFileError("Choose a PDF, DOC or DOCX resume.");
      event.target.value = "";
      return;
    }
    if (file.size > 1.25 * 1024 * 1024) {
      setFileError("Uploaded resume must be smaller than 1.25 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const encoded = String(reader.result || "").split(",")[1] || "";
      setResumeFile({ name: file.name, type: file.type, data: encoded });
    };
    reader.onerror = () => setFileError("The resume file could not be read.");
    reader.readAsDataURL(file);
  };
  const submit = async () => {
    setSaving(true);
    await onSubmit({ coverLetter, resumeFile });
    setSaving(false);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><span className="eyebrow"><FileText size={13} /> Smart application</span><h2 className="mt-2 text-xl font-extrabold">{job.title} · {job.company}</h2></div><button onClick={onClose} className="btn-ghost"><X size={18} /></button></div><div className="mt-6 space-y-4"><div className="rounded-2xl border border-ink/[0.08] bg-white/55 p-4"><div className="flex items-center justify-between"><span><b className="block text-sm">{resumeFile?.name || resumeFileName}</b><small className="text-muted">{resumeFile ? "Uploaded resume file" : "Career Vault snapshot · captured when you apply"}</small></span><span className="tag !text-jade"><Check size={12} /> {resumeFile ? "Uploaded" : "Selected"}</span></div></div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/20 bg-white/35 p-5 text-xs font-bold text-muted hover:bg-white/60"><Upload size={17} /> {resumeFile ? "Replace uploaded resume" : "Upload a different resume"}<input className="hidden" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={selectResumeFile} /></label>{fileError && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{fileError}</p>}<div><div className="mb-2 flex items-center justify-between"><b className="text-xs">Cover letter</b>{coverLetterEnabled && <button onClick={generate} className="text-xs font-bold text-cobalt"><Zap size={13} className="mr-1 inline" />Generate · {coverLetterTone}</button>}</div><textarea className="input min-h-40 resize-none py-3" value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} placeholder={coverLetterEnabled ? "Write your note or generate a tailored draft..." : "Write your cover letter..."} /></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="btn-secondary">Save draft</button><button disabled={saving} onClick={submit} className="btn-accent disabled:opacity-50">{saving ? "Submitting..." : "Submit application"} <Send size={15} /></button></div></div></div>
  );
}

function QuizLoadingModal({ assessment, onClose }) {
  return <div className="modal-backdrop"><div className="modal-card max-w-lg text-center"><RefreshCw className="mx-auto animate-spin text-cobalt" size={30} /><h2 className="mt-4 text-lg font-extrabold">Preparing {assessment.title}</h2><p className="mt-1 text-xs text-muted">Loading the latest published questions...</p><button onClick={onClose} className="btn-secondary mt-6">Cancel</button></div></div>;
}

function AdaptiveLoadingModal({ level }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-cobalt text-white shadow-lift"><RefreshCw className="animate-spin" size={27} /></span>
        <h2 className="mt-5 text-xl font-extrabold">Generating level {level}</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">Gemini is creating six unique questions from your degree, target role and career interests. This can take a few seconds.</p>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-wider text-muted">Please keep this window open</p>
      </div>
    </div>
  );
}

function AdaptiveQuizModal({ attempt, onClose, onFinished, notify }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const initialSeconds = Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const questions = attempt.questions || [];
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  const submit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const response = await apiRequest(`/adaptive-assessment/attempts/${attempt.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: questions.map((item) => ({
            questionId: item.id,
            optionIndex: Object.prototype.hasOwnProperty.call(answers, item.id) ? answers[item.id] : null,
          })),
        }),
      });
      setResult(response.result);
      await onFinished();
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (result || submitting) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [result, submitting]);

  useEffect(() => {
    if (secondsLeft === 0 && !result && !submitting) submit();
  }, [secondsLeft, result, submitting]);

  if (result) {
    return (
      <div className="modal-backdrop">
        <div className="modal-card max-h-[92vh] max-w-4xl overflow-y-auto">
          <div className="text-center">
            <span className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-white shadow-lift ${result.passed ? "bg-jade" : "bg-coral"}`}>{result.passed ? <Trophy size={32} /> : <Target size={32} />}</span>
            <span className="eyebrow mt-5">Level {result.level} complete</span>
            <h2 className="mt-2 font-display text-5xl">{result.correctCount}/6</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted">{result.passed ? (result.nextLevel ? `Great work. Level ${result.nextLevel} is now unlocked.` : "You completed the full 10-level expert journey.") : "You need 4 correct answers to advance. Review the explanations and try this level again."}</p>
          </div>
          <div className="mt-7 space-y-3">
            {result.review.map((item, reviewIndex) => (
              <article key={item.id} className={`rounded-[20px] border p-4 ${item.correct ? "border-jade/20 bg-jade/10" : "border-coral/20 bg-coral/10"}`}>
                <div className="flex items-start gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${item.correct ? "bg-jade" : "bg-coral"}`}>{item.correct ? <Check size={14} /> : <X size={14} />}</span><div><b className="text-xs">Question {reviewIndex + 1} · {item.focusArea}</b><p className="mt-1 text-sm font-semibold leading-6">{item.prompt}</p></div></div>
                <p className="mt-3 text-xs leading-5 text-muted"><b className="text-ink">Correct answer:</b> {item.options[item.correctIndex]}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.explanation}</p>
              </article>
            ))}
          </div>
          <div className="mt-7 flex justify-center"><button onClick={onClose} className="btn-accent">{result.passed && result.nextLevel ? "Continue to level map" : "Return to assessments"} <ArrowRight size={15} /></button></div>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  if (!question) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div><span className="eyebrow"><Target size={12} /> AI adaptive · {attempt.difficulty}</span><h2 className="mt-1 text-lg font-extrabold">Level {attempt.level} skill assessment</h2></div>
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${secondsLeft < 60 ? "bg-coral text-white" : "bg-coral/10 text-coral"}`}><Clock3 size={15} /> {minutes}:{seconds}</div>
        </div>
        <div className="mt-6 flex gap-1.5">{questions.map((item, questionIndex) => <span key={item.id} className={`h-1.5 flex-1 rounded-full ${questionIndex <= index ? "bg-cobalt" : "bg-ink/[0.08]"}`} />)}</div>
        <div className="mt-8 flex items-center justify-between"><p className="text-xs font-bold text-muted">QUESTION {index + 1} OF {questions.length}</p><p className="text-[10px] font-bold text-muted">{answeredCount}/{questions.length} answered</p></div>
        <span className="tag mt-3">{question.focusArea}</span>
        <h3 className="mt-3 text-xl font-extrabold leading-7">{question.prompt}</h3>
        <div className="mt-6 grid gap-3">
          {question.options.map((option, optionIndex) => (
            <button key={`${question.id}-${optionIndex}`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${answers[question.id] === optionIndex ? "border-cobalt bg-cobalt/10 text-cobalt" : "border-ink/[0.08] bg-white/55 hover:bg-white"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs ${answers[question.id] === optionIndex ? "bg-cobalt text-white" : "bg-ink/[0.06] text-muted"}`}>{String.fromCharCode(65 + optionIndex)}</span>{option}
            </button>
          ))}
        </div>
        <div className="mt-7 flex items-center justify-between">
          <button disabled={index === 0 || submitting} onClick={() => setIndex((current) => current - 1)} className="btn-secondary disabled:opacity-40"><ChevronLeft size={15} /> Back</button>
          {index === questions.length - 1 ? <button disabled={answeredCount !== questions.length || submitting} onClick={submit} className="btn-accent disabled:opacity-40">{submitting ? "Submitting..." : "Submit level"} <Check size={15} /></button> : <button disabled={answers[question.id] === undefined || submitting} onClick={() => setIndex((current) => current + 1)} className="btn-primary disabled:opacity-40">Next question <ChevronRight size={15} /></button>}
        </div>
        <button onClick={onClose} className="mx-auto mt-4 block text-[10px] font-bold text-muted underline">Save progress and close</button>
      </div>
    </div>
  );
}

function QuizModal({ assessment, questions, quiz, setQuiz, onSubmit, onClose }) {
  const question = questions[quiz.index];
  const [secondsLeft, setSecondsLeft] = useState(Number(assessment.time_limit_minutes || 15) * 60);
  const select = (optionId) => setQuiz((current) => ({ ...current, answers: { ...current.answers, [current.index]: optionId } }));

  useEffect(() => {
    if (quiz.finished || quiz.submitting) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onSubmit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quiz.finished, quiz.submitting, onSubmit]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const answeredCount = Object.keys(quiz.answers).length;

  if (quiz.finished) {
    const passed = quiz.score >= Number(assessment.passing_percentage || 60);
    return (
      <div className="modal-backdrop">
        <div className="modal-card max-w-3xl">
          <div className="py-6 text-center">
            <span className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-white shadow-lift ${passed ? "bg-jade" : "bg-coral"}`}><Trophy size={32} /></span>
            <span className="eyebrow mt-6">Assessment complete</span>
            <h2 className="mt-2 font-display text-5xl">{quiz.score}%</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{passed ? "You reached the passing score. Your result is saved to your assessment history." : `Your result is saved. The passing score for this assessment is ${assessment.passing_percentage}%.`}</p>
            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3"><div className="rounded-2xl bg-jade/10 p-4"><b className="text-lg text-jade">{quiz.result?.correctAnswers ?? 0}/{quiz.result?.questionCount ?? questions.length}</b><small className="block text-muted">Correct</small></div><div className="rounded-2xl bg-cobalt/10 p-4"><b className="text-lg text-cobalt">{quiz.result?.score ?? 0}/{quiz.result?.total ?? 0}</b><small className="block text-muted">Points</small></div></div>
            <button onClick={onClose} className="btn-accent mt-7">Return to assessments</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-3xl">
        <div className="flex items-center justify-between gap-4"><div><span className="eyebrow">{assessment.category}</span><h2 className="mt-1 text-lg font-extrabold">{assessment.title}</h2></div><div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${secondsLeft < 60 ? "bg-coral text-white" : "bg-coral/10 text-coral"}`}><Clock3 size={15} /> {minutes}:{seconds}</div></div>
        <div className="mt-6 flex gap-1.5">{questions.map((item, index) => <span key={item.id} className={`h-1.5 flex-1 rounded-full ${index <= quiz.index ? "bg-cobalt" : "bg-ink/[0.08]"}`} />)}</div>
        <div className="mt-8 flex items-center justify-between"><p className="text-xs font-bold text-muted">QUESTION {quiz.index + 1} OF {questions.length}</p><p className="text-[10px] font-bold text-muted">{answeredCount}/{questions.length} answered</p></div>
        <h3 className="mt-3 text-xl font-extrabold leading-7">{question.prompt}</h3>
        <div className="mt-6 grid gap-3">
          {question.options.map((option, index) => (
            <button onClick={() => select(option.id)} key={option.id} className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${quiz.answers[quiz.index] === option.id ? "border-cobalt bg-cobalt/10 text-cobalt" : "border-ink/[0.08] bg-white/55 hover:bg-white"}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${quiz.answers[quiz.index] === option.id ? "bg-cobalt text-white" : "bg-ink/[0.06] text-muted"}`}>{String.fromCharCode(65 + index)}</span>{option.option_text}
            </button>
          ))}
        </div>
        <div className="mt-7 flex items-center justify-between"><button disabled={quiz.index === 0 || quiz.submitting} onClick={() => setQuiz((current) => ({ ...current, index: current.index - 1 }))} className="btn-secondary disabled:opacity-40"><ChevronLeft size={15} /> Back</button>{quiz.index === questions.length - 1 ? <button disabled={answeredCount !== questions.length || quiz.submitting} onClick={onSubmit} className="btn-accent disabled:opacity-40">{quiz.submitting ? "Submitting..." : "Submit answers"} <Check size={15} /></button> : <button disabled={quiz.answers[quiz.index] === undefined || quiz.submitting} onClick={() => setQuiz((current) => ({ ...current, index: current.index + 1 }))} className="btn-primary disabled:opacity-40">Next question <ChevronRight size={15} /></button>}</div>
      </div>
    </div>
  );
}

function PostModal({ user, onClose, onSubmit }) {
  const [text, setText] = useState("");
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}><div className="flex justify-between"><div><span className="eyebrow"><Users size={13} /> Career community</span><h2 className="mt-2 text-xl font-extrabold">Share with the community</h2></div><button onClick={onClose} className="btn-ghost"><X size={18} /></button></div><div className="mt-6 flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-plum text-xs font-bold text-white">{getInitials(user?.name)}</span><textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} className="input min-h-40 resize-none py-3" placeholder="What are you learning, building or wondering?" /></div><div className="mt-4 flex flex-wrap gap-2"><button className="tag"><Link2 size={12} /> Add link</button><button className="tag"><Target size={12} /> Add topic</button><button className="tag"><Upload size={12} /> Add image</button></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="btn-secondary">Cancel</button><button disabled={!text.trim()} onClick={() => onSubmit(text)} className="btn-accent disabled:opacity-40">Publish post <Send size={15} /></button></div></div></div>;
}
