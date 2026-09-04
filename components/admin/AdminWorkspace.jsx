import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileQuestion,
  FileText,
  Filter,
  Flag,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import DashboardShell from "../DashboardShell";
import Toast from "../Toast";
import AdminApplications from "./AdminApplications";
import AdminCommunity from "./AdminCommunity";
import { resources as seedResources } from "../../lib/mockData";
import { apiRequest } from "../../lib/api";

const navItems = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, group: "Command center" },
  { id: "users", label: "User management", icon: Users },
  { id: "assessments", label: "Assessments", icon: FileCheck2, group: "Content" },
  { id: "questions", label: "Question bank", icon: FileQuestion },
  { id: "resources", label: "Resources", icon: BookOpen },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness, group: "Operations" },
  { id: "community", label: "Moderation", icon: ShieldCheck },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "settings", label: "System settings", icon: Settings, group: "System" },
];

const meta = {
  overview: ["Operations overview", "Monitor platform health, momentum and actions that need attention."],
  users: ["User management", "Search, review and manage student accounts and access."],
  assessments: ["Assessment management", "Create and maintain skill assessments across every category."],
  questions: ["Question bank", "Keep assessment content accurate, balanced and up to date."],
  resources: ["Resource library", "Publish focused learning material and manage downloads."],
  events: ["Event management", "Schedule workshops, career fairs and live sessions."],
  jobs: ["Job management", "Review opportunities and keep listings relevant and active."],
  community: ["Community moderation", "Protect a constructive, safe and useful student community."],
  applications: ["Application management", "Track application volume, progression and outcomes."],
  performance: ["Platform performance", "Understand engagement, learning and career outcomes."],
  settings: ["System settings", "Configure platform defaults, notifications and security."],
};

export default function AdminWorkspace() {
  const [active, setActive] = useState("overview");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [communityData, setCommunityData] = useState({ posts: [], stats: {} });
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState("");
  const [assessmentRecords, setAssessmentRecords] = useState([]);
  const [questionRecords, setQuestionRecords] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  const [jobRecords, setJobRecords] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [eventRecords, setEventRecords] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [applicationRecords, setApplicationRecords] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const loadUsers = async ({ silent = false } = {}) => {
    if (!silent) {
      setUsersLoading(true);
      setUsersError("");
    }
    try {
      setUsers(await apiRequest("/admin/users"));
      setUsersError("");
    } catch (error) {
      if (!silent) setUsersError(error.message);
    } finally {
      if (!silent) setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const refresh = () => loadUsers({ silent: true });
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

  const changeUserStatus = async (user) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const action = nextStatus === "suspended" ? "suspend" : "activate";
    if (!window.confirm(`${action === "suspend" ? "Suspend" : "Activate"} ${user.name}'s student account?`)) return;
    try {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadUsers({ silent: true });
      notify(`${user.name}'s account is now ${nextStatus}.`);
    } catch (error) {
      notify(error.message);
    }
  };

  const loadAssessmentContent = async () => {
    setContentLoading(true);
    setContentError("");
    try {
      const [nextAssessments, nextQuestions] = await Promise.all([
        apiRequest("/admin/assessments"),
        apiRequest("/admin/questions"),
      ]);
      setAssessmentRecords(nextAssessments);
      setQuestionRecords(nextQuestions);
    } catch (error) {
      setContentError(error.message);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    loadAssessmentContent();
  }, []);

  const loadJobs = async ({ silent = false } = {}) => {
    if (!silent) {
      setJobsLoading(true);
      setJobsError("");
    }
    try {
      setJobRecords(await apiRequest("/admin/jobs"));
      setJobsError("");
    } catch (error) {
      if (!silent) setJobsError(error.message);
    } finally {
      if (!silent) setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const refresh = () => loadJobs({ silent: true });
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const interval = window.setInterval(refresh, 10000);
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
      setEventRecords(await apiRequest("/admin/events"));
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
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const loadApplications = async ({ silent = false } = {}) => {
    if (!silent) {
      setApplicationsLoading(true);
      setApplicationsError("");
    }
    try {
      setApplicationRecords(await apiRequest("/admin/applications"));
      setApplicationsError("");
    } catch (error) {
      if (!silent) setApplicationsError(error.message);
    } finally {
      if (!silent) setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    const refresh = () => loadApplications({ silent: true });
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const loadCommunity = async ({ silent = false } = {}) => {
    if (!silent) {
      setCommunityLoading(true);
      setCommunityError("");
    }
    try {
      setCommunityData(await apiRequest("/admin/community"));
      setCommunityError("");
    } catch (error) {
      if (!silent) setCommunityError(error.message);
    } finally {
      if (!silent) setCommunityLoading(false);
    }
  };

  useEffect(() => {
    loadCommunity();
    const refresh = () => loadCommunity({ silent: true });
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const saveAssessmentContent = async (entity, values, record) => {
    const path = `/admin/${entity}${record?.id ? `/${record.id}` : ""}`;
    await apiRequest(path, {
      method: record?.id ? "PATCH" : "POST",
      body: JSON.stringify(values),
    });
    setModal(null);
    await loadAssessmentContent();
    notify(`${entity === "questions" ? "Question" : "Assessment"} ${record?.id ? "updated" : "created"} successfully.`);
  };

  const deleteAssessmentContent = async (entity, record) => {
    if (!window.confirm(`Delete this ${entity === "questions" ? "question" : "assessment"}? This cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/${entity}/${record.id}`, { method: "DELETE" });
      await loadAssessmentContent();
      notify(`${entity === "questions" ? "Question" : "Assessment"} deleted.`);
    } catch (error) {
      notify(error.message);
    }
  };

  const saveJob = async (values, record) => {
    await apiRequest(`/admin/jobs${record?.id ? `/${record.id}` : ""}`, {
      method: record?.id ? "PATCH" : "POST",
      body: JSON.stringify(values),
    });
    setModal(null);
    await loadJobs();
    notify(`Job ${record?.id ? "updated" : "created"} successfully.`);
  };

  const changeJobStatus = async (record, status) => {
    try {
      await apiRequest(`/admin/jobs/${record.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadJobs();
      notify(status === "live" ? "Job is now visible to students." : "Job hidden from the student portal.");
    } catch (error) {
      notify(error.message);
    }
  };

  const deleteJob = async (record) => {
    if (!window.confirm(`Delete “${record.title}”? Its applications will also be removed.`)) return;
    try {
      await apiRequest(`/admin/jobs/${record.id}`, { method: "DELETE" });
      await loadJobs();
      notify("Job deleted.");
    } catch (error) {
      notify(error.message);
    }
  };

  const saveEvent = async (values, record) => {
    await apiRequest(`/admin/events${record?.id ? `/${record.id}` : ""}`, {
      method: record?.id ? "PATCH" : "POST",
      body: JSON.stringify(values),
    });
    setModal(null);
    await loadEvents();
    notify(`Event ${record?.id ? "updated" : "created"} successfully.`);
  };

  const changeEventStatus = async (record, status) => {
    try {
      await apiRequest(`/admin/events/${record.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadEvents();
      notify(status === "published" ? "Event is now visible to students." : "Event hidden from the student portal.");
    } catch (error) {
      notify(error.message);
    }
  };

  const deleteEvent = async (record) => {
    if (!window.confirm(`Delete “${record.title}”? All event reservations will also be removed.`)) return;
    try {
      await apiRequest(`/admin/events/${record.id}`, { method: "DELETE" });
      await loadEvents();
      notify("Event deleted.");
    } catch (error) {
      notify(error.message);
    }
  };

  const moderateCommunityPost = async (post, action) => {
    const actionLabel = action === "remove" ? "remove" : action === "restore" ? "restore" : action;
    if (["remove", "restore", "approve"].includes(action) && !window.confirm(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} this community post?`)) return;
    try {
      const result = await apiRequest(`/admin/community/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await loadCommunity({ silent: true });
      notify(result.message);
    } catch (error) {
      notify(error.message);
    }
  };

  const dashboardNavItems = navItems.map((item) => {
    if (item.id === "users") return { ...item, badge: users.length ? String(users.length) : undefined };
    if (item.id === "questions") return { ...item, badge: questionRecords.length ? String(questionRecords.length) : undefined };
    if (item.id === "jobs") return { ...item, badge: jobRecords.length ? String(jobRecords.length) : undefined };
    if (item.id === "events") return { ...item, badge: eventRecords.length ? String(eventRecords.length) : undefined };
    if (item.id === "community") {
      const attention = Number(communityData.stats?.pending || 0) + Number(communityData.stats?.openReports || 0);
      return { ...item, badge: attention ? String(attention) : undefined };
    }
    if (item.id === "applications") {
      const activeApplications = applicationRecords.filter((application) => application.status !== "withdrawn").length;
      return { ...item, badge: activeApplications ? String(activeApplications) : undefined };
    }
    return item;
  });

  const addLabel = {
    assessments: "New assessment",
    questions: "Add question",
    resources: "Add resource",
    events: "Create event",
    jobs: "Add job",
  }[active];

  return (
    <>
      <DashboardShell
        role="admin"
        navItems={dashboardNavItems}
        active={active}
        onNavigate={setActive}
        title={meta[active][0]}
        subtitle={meta[active][1]}
        actions={addLabel ? <button onClick={() => setModal({ type: "create", entity: active })} className="btn-primary !bg-plum hover:!bg-[#64465b]"><Plus size={16} /> {addLabel}</button> : active === "performance" ? <button onClick={() => notify("Analytics report exported.")} className="btn-secondary"><Download size={15} /> Export report</button> : null}
      >
        {active === "overview" && <AdminOverview onNavigate={setActive} assessments={assessmentRecords} questions={questionRecords} jobs={jobRecords} users={users} communityStats={communityData.stats} />}
        {active === "users" && <UsersPage users={users} loading={usersLoading} error={usersError} onRetry={loadUsers} onStatus={changeUserStatus} />}
        {active === "assessments" && <AssessmentAdmin records={assessmentRecords} loading={contentLoading} error={contentError} onRetry={loadAssessmentContent} onEdit={(record) => setModal({ type: "edit", entity: "assessments", record })} onDelete={(record) => deleteAssessmentContent("assessments", record)} />}
        {active === "questions" && <QuestionsAdmin records={questionRecords} loading={contentLoading} error={contentError} onRetry={loadAssessmentContent} onEdit={(record) => setModal({ type: "edit", entity: "questions", record })} onDelete={(record) => deleteAssessmentContent("questions", record)} />}
        {active === "resources" && <ResourcesAdmin notify={notify} />}
        {active === "events" && <EventsAdmin records={eventRecords} loading={eventsLoading} error={eventsError} onRetry={loadEvents} onEdit={(record) => setModal({ type: "edit", entity: "events", record })} onStatus={changeEventStatus} onDelete={deleteEvent} />}
        {active === "jobs" && <JobsAdmin records={jobRecords} loading={jobsLoading} error={jobsError} onRetry={loadJobs} onEdit={(record) => setModal({ type: "edit", entity: "jobs", record })} onStatus={changeJobStatus} onDelete={deleteJob} />}
        {active === "community" && <AdminCommunity data={communityData} setData={setCommunityData} loading={communityLoading} error={communityError} onRetry={loadCommunity} onModerate={moderateCommunityPost} notify={notify} />}
        {active === "applications" && <AdminApplications records={applicationRecords} loading={applicationsLoading} error={applicationsError} onRetry={loadApplications} notify={notify} />}
        {active === "performance" && <PerformanceAdmin />}
        {active === "settings" && <SettingsAdmin notify={notify} />}
      </DashboardShell>
      <Toast message={toast} onClose={() => setToast("")} />
      {(modal?.type === "create" || modal?.type === "edit") && modal.entity === "assessments" && (
        <AssessmentEditorModal record={modal.record} onClose={() => setModal(null)} onSubmit={(values) => saveAssessmentContent("assessments", values, modal.record)} />
      )}
      {(modal?.type === "create" || modal?.type === "edit") && modal.entity === "questions" && (
        <QuestionEditorModal assessments={assessmentRecords} record={modal.record} onClose={() => setModal(null)} onSubmit={(values) => saveAssessmentContent("questions", values, modal.record)} />
      )}
      {(modal?.type === "create" || modal?.type === "edit") && modal.entity === "jobs" && (
        <JobEditorModal record={modal.record} onClose={() => setModal(null)} onSubmit={(values) => saveJob(values, modal.record)} />
      )}
      {(modal?.type === "create" || modal?.type === "edit") && modal.entity === "events" && (
        <EventEditorModal record={modal.record} onClose={() => setModal(null)} onSubmit={(values) => saveEvent(values, modal.record)} />
      )}
      {modal?.type === "create" && !["assessments", "questions", "jobs", "events"].includes(modal.entity) && <CreateEntityModal entity={modal.entity} onClose={() => setModal(null)} onSubmit={() => { setModal(null); notify(`New ${modal.entity.replace(/s$/, "")} created successfully.`); }} />}
    </>
  );
}

function AdminOverview({ onNavigate, assessments, questions, jobs, users, communityStats }) {
  const publishedAssessments = assessments.filter((assessment) => assessment.status === "published");
  const reviewQuestions = questions.filter((question) => question.status === "needs_review");
  const latestAssessment = assessments[0];
  const liveJobs = jobs.filter((job) => job.status === "live" && new Date(job.expires_at).getTime() > Date.now());
  const totalApplications = jobs.reduce((sum, job) => sum + Number(job.application_count || 0), 0);
  const expiringJobs = liveJobs.filter((job) => {
    const days = (new Date(job.expires_at).getTime() - Date.now()) / 86400000;
    return days <= 7;
  });
  const latestJob = jobs[0];
  const attentionItems = [
    [Flag, `${Number(communityStats?.pending || 0) + Number(communityStats?.openReports || 0)} community items need attention`, "Review now", "community", "text-coral bg-coral/10"],
    [BriefcaseBusiness, `${expiringJobs.length} job listings expire soon`, "Manage", "jobs", "text-cobalt bg-cobalt/10"],
    [FileQuestion, `${reviewQuestions.length} questions need review`, "Open bank", "questions", "text-plum bg-plum/10"],
  ];
  const recentActivity = [
    ...(latestAssessment ? [["Assessment updated", `${latestAssessment.title} · ${latestAssessment.status}`, "Latest", FileCheck2, "bg-jade"]] : []),
    ...(latestJob ? [["Job listing updated", `${latestJob.title} · ${latestJob.company_name}`, "Latest", BriefcaseBusiness, "bg-cobalt"]] : []),
    ...(Number(communityStats?.total || 0) ? [["Community activity", `${Number(communityStats.total)} real posts · ${Number(communityStats.visible || 0)} visible`, "Current", ShieldCheck, "bg-coral"]] : []),
    ["Resource downloaded 100 times", "Product Analytics Field Guide", "1 hr", BookOpen, "bg-plum"],
  ];
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric label="Total students" value={users.length} delta={`${users.filter((user) => user.status === "active").length} active`} note="registered student accounts" icon={Users} tone="bg-cobalt" />
        <AdminMetric label="Active assessments" value={publishedAssessments.length} delta={`${assessments.length} total`} note="published by administrators" icon={FileCheck2} tone="bg-jade" />
        <AdminMetric label="Live jobs" value={liveJobs.length} delta={`${jobs.length} total`} note="visible, unexpired listings" icon={BriefcaseBusiness} tone="bg-coral" />
        <AdminMetric label="Applications" value={totalApplications} delta="Actual" note="submitted to managed jobs" icon={FileText} tone="bg-plum" />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Platform growth</h2><p className="text-xs text-muted">Student acquisition and weekly active users</p></div><select className="select min-h-9 w-36 py-0 text-xs"><option>Last 8 weeks</option><option>Last 6 months</option></select></div>
          <div className="mt-7 flex h-56 items-end gap-3">{[["W1", 44, 31], ["W2", 56, 40], ["W3", 52, 43], ["W4", 68, 50], ["W5", 72, 58], ["W6", 78, 64], ["W7", 85, 70], ["W8", 94, 78]].map(([label, total, active]) => <div className="flex flex-1 items-end justify-center gap-1" key={label}><div className="w-[38%] rounded-t-md bg-sand" style={{ height: `${total}%` }} /><div className="w-[38%] rounded-t-md bg-cobalt" style={{ height: `${active}%` }} /><span className="absolute mt-5 self-end translate-y-5 text-[9px] font-bold text-muted">{label}</span></div>)}</div><div className="mt-8 flex gap-5 text-[10px] font-bold text-muted"><span><i className="mr-2 inline-block h-2 w-2 rounded-sm bg-sand" />New students</span><span><i className="mr-2 inline-block h-2 w-2 rounded-sm bg-cobalt" />Weekly active</span></div>
        </div>
        <div className="panel p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">System health</h2><p className="text-xs text-muted">All services operational</p></div><span className="h-3 w-3 rounded-full bg-jade shadow-[0_0_0_6px_rgba(78,120,100,.12)]" /></div><div className="mt-6 space-y-4">{[["Web application", "99.99%", "Healthy"], ["Express API", "184ms", "Healthy"], ["MySQL database", "37%", "Healthy"], ["Python AI service", "212ms", "Healthy"]].map(([label, value, status]) => <div className="flex items-center justify-between border-b border-ink/[0.07] pb-3 last:border-0" key={label}><span><b className="block text-xs">{label}</b><small className="text-[10px] text-jade">{status}</small></span><b className="text-xs text-muted">{value}</b></div>)}</div></div>
      </section>
      <section className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="panel p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Needs attention</h2><p className="text-xs text-muted">Prioritized operational queue</p></div><span className="tag !bg-coral/10 !text-coral">{reviewQuestions.length} question reviews</span></div><div className="mt-5 space-y-3">{attentionItems.map(([Icon, text, action, page, tone]) => <button onClick={() => onNavigate(page)} key={text} className="flex w-full items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white/55 p-3 text-left hover:bg-white"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={16} /></span><b className="flex-1 text-xs">{text}</b><span className="text-[10px] font-bold text-muted">{action}</span><ChevronRight size={14} className="text-muted" /></button>)}</div></div>
        <div className="panel p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Recent platform activity</h2><p className="text-xs text-muted">Live assessment activity with platform updates</p></div><button className="btn-ghost"><RefreshCw size={15} /></button></div><div className="mt-5 space-y-4">{recentActivity.map(([title, detail, time, Icon, tone]) => <div className="flex items-start gap-3" key={`${title}-${detail}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${tone}`}><Icon size={15} /></span><span className="flex-1"><b className="block text-xs">{title}</b><small className="text-[10px] text-muted">{detail}</small></span><small className="text-[9px] font-bold text-muted">{time}</small></div>)}</div></div>
      </section>
    </div>
  );
}

function AdminMetric({ label, value, delta, note, icon: Icon, tone }) {
  return <article className="metric-card"><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-2xl text-white ${tone}`}><Icon size={19} /></span><span className="tag !border-0 !bg-jade/10 !text-jade"><TrendingUp size={11} />{delta}</span></div><b className="mt-5 block text-2xl tracking-[-0.04em]">{value}</b><p className="mt-0.5 text-xs font-bold">{label}</p><p className="mt-2 text-[10px] text-muted">{note}</p></article>;
}

function UsersPage({ users, loading, error, onRetry, onStatus }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const tones = ["bg-cobalt", "bg-coral", "bg-jade", "bg-plum", "bg-ink"];
  const list = useMemo(() => users.filter((user) => {
    const matchesSearch = `${user.name} ${user.email} ${user.university || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || user.status === status);
  }), [users, search, status]);
  const activeCount = users.filter((user) => user.status === "active").length;
  const getInitials = (name) => String(name || "Student").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const formatJoinedDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
  };
  const exportUsers = () => {
    const escape = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
    const rows = [
      ["Name", "Email", "University", "Joined", "Readiness", "Status"],
      ...list.map((user) => [
        user.name,
        user.email,
        user.university || "Not provided",
        formatJoinedDate(user.created_at),
        `${Number(user.readiness_score || 0)}%`,
        user.status,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "careercube-students.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const openDetails = async (user) => {
    setSelectedId(user.id);
    setSelectedUser(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      setSelectedUser(await apiRequest(`/admin/users/${user.id}`));
    } catch (requestError) {
      setDetailError(requestError.message);
    } finally {
      setDetailLoading(false);
    }
  };
  const closeDetails = () => {
    setSelectedId(null);
    setSelectedUser(null);
    setDetailError("");
  };

  if (selectedId) {
    return (
      <StudentDetailView
        student={selectedUser}
        loading={detailLoading}
        error={detailError}
        onBack={closeDetails}
        onRetry={() => openDetails({ id: selectedId })}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-11" placeholder="Search name, email or university" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="select sm:w-44"><option value="all">All students</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
        <button disabled={!list.length} onClick={exportUsers} className="btn-secondary disabled:opacity-50"><ArrowDownToLine size={15} /> Export</button>
      </section>
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-lg font-extrabold">{users.length} registered students</h2><p className="text-xs text-muted">{activeCount} active · {users.length - activeCount} suspended · database-backed</p></div>
          <span className="tag !bg-jade/10 !text-jade"><Database size={12} /> Live accounts</span>
        </div>
        <ContentState loading={loading} error={error} empty={!list.length} emptyTitle={users.length ? "No students match these filters" : "No registered students yet"} emptyCopy={users.length ? "Try another name, email, university or status." : "New student sign-ups will appear here automatically."} onRetry={onRetry}>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.1em] text-muted"><tr>{["Student", "University", "Joined", "Readiness", "Status", "Actions"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {list.map((user, index) => {
                  const readiness = Math.min(100, Math.max(0, Number(user.readiness_score || 0)));
                  const isActive = user.status === "active";
                  return (
                    <tr key={user.id} className="hover:bg-white/60">
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl text-[10px] font-bold text-white ${tones[index % tones.length]}`}>{getInitials(user.name)}</span><span><b className="block text-xs">{user.name}</b><small className="text-[10px] text-muted">{user.email}</small></span></div></td>
                      <td className="px-4 py-4 text-xs text-muted">{user.university || "Not provided"}</td>
                      <td className="px-4 py-4 text-xs text-muted">{formatJoinedDate(user.created_at)}</td>
                      <td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-ink/[0.07]"><div className="h-full rounded-full bg-cobalt" style={{ width: `${readiness}%` }} /></div><b className="text-[10px]">{readiness}%</b></div></td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${isActive ? "bg-jade/10 text-jade" : "bg-coral/10 text-coral"}`}>{isActive ? "Active" : "Suspended"}</span></td>
                      <td className="px-4 py-4"><div className="flex items-center gap-1"><button onClick={() => openDetails(user)} className="btn-ghost min-h-9 gap-1 text-cobalt" aria-label={`View ${user.name}'s details`} title="View student details"><Eye size={15} /> View</button><button onClick={() => onStatus(user)} className={`btn-ghost min-h-9 gap-1 ${isActive ? "text-coral" : "text-jade"}`}>{isActive ? <><LockKeyhole size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ContentState>
        <p className="mt-4 text-xs text-muted">Showing {list.length} of {users.length} actual student accounts</p>
      </section>
    </div>
  );
}

function StudentDetailView({ student, loading, error, onBack, onRetry }) {
  const value = (content) => content || "Not provided";
  const formatDate = (content, includeTime = false) => {
    if (!content) return "Not available";
    const date = new Date(content);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString("en-BD", includeTime
      ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
      : { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="btn-secondary"><ChevronLeft size={16} /> Back to user management</button>
      {loading && <section className="panel grid min-h-72 place-items-center text-center"><div><RefreshCw className="mx-auto animate-spin text-cobalt" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading student details...</p></div></section>}
      {!loading && error && <section className="panel grid min-h-72 place-items-center text-center"><div><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 text-lg font-extrabold">Could not load student details</h2><p className="mt-2 text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></section>}
      {!loading && !error && student && (
        <>
          <section className="panel overflow-hidden">
            <div className="bg-gradient-to-r from-cobalt to-[#6a52a0] p-6 text-white sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[24px] bg-white/15 text-2xl font-extrabold ring-1 ring-white/25">
                  {student.avatar_data || student.avatar_url
                    ? <img src={student.avatar_data || student.avatar_url} alt={`${student.name || "Student"} profile`} className="h-full w-full object-cover" />
                    : String(student.name || "Student").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1"><span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/65">Student profile</span><h2 className="mt-1 text-2xl font-extrabold">{student.name}</h2><p className="mt-1 flex items-center gap-2 text-sm text-white/75"><Mail size={14} /> {student.email}</p></div>
                <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-extrabold ${student.status === "active" ? "bg-white text-jade" : "bg-coral text-white"}`}>{student.status === "active" ? "Active account" : "Suspended account"}</span>
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              {[["Profile completion", `${Number(student.profile_completion || 0)}%`], ["Career readiness", `${Number(student.readiness_score || 0)}%`], ["Joined", formatDate(student.created_at)]].map(([label, content]) => <div className="rounded-2xl bg-ink/[0.035] p-4" key={label}><span className="text-[10px] font-bold uppercase tracking-[.08em] text-muted">{label}</span><b className="mt-1 block text-lg">{content}</b></div>)}
            </div>
          </section>
          <section className="panel p-6 sm:p-8">
            <div><h2 className="text-lg font-extrabold">Personal & career details</h2><p className="mt-1 text-xs text-muted">The latest information saved by this student.</p></div>
            <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[["Full name", student.name], ["Email address", student.email], ["University", value(student.university)], ["Degree", value(student.degree)], ["Graduation year", value(student.graduation_year)], ["Target role", value(student.target_role)], ["Location", value(student.location)], ["Last sign in", formatDate(student.last_login_at, true)], ["Profile last updated", formatDate(student.profile_updated_at, true)]].map(([label, content]) => <div className="border-b border-ink/[0.07] pb-4" key={label}><dt className="text-[10px] font-extrabold uppercase tracking-[.08em] text-muted">{label}</dt><dd className="mt-1 text-sm font-bold">{content}</dd></div>)}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

function AssessmentAdmin({ records, loading, error, onRetry, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = records.filter((record) => `${record.title} ${record.category} ${record.difficulty} ${record.status}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-11" placeholder="Search assessments..." /></label>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </section>
      <section className="panel p-5">
        <div className="mb-5"><h2 className="text-lg font-extrabold">{records.length} assessments</h2><p className="text-xs text-muted">Only administrator-created records are shown.</p></div>
        <ContentState loading={loading} error={error} empty={!filtered.length} emptyTitle="No assessments yet" emptyCopy="Create your first assessment, then add and publish questions inside it." onRetry={onRetry}>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.09em] text-muted"><tr>{["Assessment", "Category", "Difficulty", "Time", "Questions", "Attempts", "Avg. score", "Status", "Actions"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-white/60">
                    <td className="max-w-[300px] px-4 py-4"><b className="block">{record.title}</b><small className="line-clamp-1 text-muted">{record.description || "No description"}</small></td>
                    <td className="px-4 py-4 text-muted">{record.category}</td>
                    <td className="px-4 py-4 text-muted">{record.difficulty}</td>
                    <td className="px-4 py-4 text-muted">{record.time_limit_minutes} min</td>
                    <td className="px-4 py-4 font-bold">{record.question_count}</td>
                    <td className="px-4 py-4 text-muted">{record.attempt_count}</td>
                    <td className="px-4 py-4 text-muted">{record.average_score == null ? "—" : `${record.average_score}%`}</td>
                    <td className="px-4 py-4"><ContentStatus value={record.status} /></td>
                    <td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => onEdit(record)} className="btn-ghost min-h-8" aria-label="Edit assessment"><Pencil size={14} /></button><button onClick={() => onDelete(record)} className="btn-ghost min-h-8 text-coral" aria-label="Delete assessment"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentState>
      </section>
    </div>
  );
}

function QuestionsAdmin({ records, loading, error, onRetry, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = records.filter((record) => `${record.prompt} ${record.assessment_title} ${record.difficulty} ${record.status}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-11" placeholder="Search question bank..." /></label>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </section>
      <section className="panel p-5">
        <div className="mb-5"><h2 className="text-lg font-extrabold">{records.length} questions</h2><p className="text-xs text-muted">Published questions become available in the student portal immediately.</p></div>
        <ContentState loading={loading} error={error} empty={!filtered.length} emptyTitle="Question bank is empty" emptyCopy="Use “Add question” to create the first real question. No demo records are displayed." onRetry={onRetry}>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.09em] text-muted"><tr>{["Question", "Assessment", "Difficulty", "Type", "Points", "Status", "Actions"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-white/60">
                    <td className="max-w-[360px] px-4 py-4 font-bold">{record.prompt}</td>
                    <td className="px-4 py-4 text-muted">{record.assessment_title}</td>
                    <td className="px-4 py-4 text-muted">{record.difficulty}</td>
                    <td className="px-4 py-4 text-muted">{record.question_type === "true_false" ? "True / false" : "Multiple choice"}</td>
                    <td className="px-4 py-4 text-muted">{Number(record.points)}</td>
                    <td className="px-4 py-4"><ContentStatus value={record.status} /></td>
                    <td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => onEdit(record)} className="btn-ghost min-h-8" aria-label="Edit question"><Pencil size={14} /></button><button onClick={() => onDelete(record)} className="btn-ghost min-h-8 text-coral" aria-label="Delete question"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentState>
      </section>
    </div>
  );
}

function ContentState({ loading, error, empty, emptyTitle, emptyCopy, onRetry, children }) {
  if (loading) return <div className="grid min-h-56 place-items-center text-center"><RefreshCw className="animate-spin text-plum" size={26} /><p className="mt-3 text-xs font-bold text-muted">Loading live content...</p></div>;
  if (error) return <div className="grid min-h-56 place-items-center text-center"><div><AlertTriangle className="mx-auto text-coral" size={28} /><h3 className="mt-3 font-extrabold">Could not load content</h3><p className="mt-1 max-w-md text-xs text-muted">{error}</p><button onClick={onRetry} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></div>;
  if (empty) return <div className="grid min-h-56 place-items-center text-center"><div><FileQuestion className="mx-auto text-muted" size={30} /><h3 className="mt-3 font-extrabold">{emptyTitle}</h3><p className="mt-1 max-w-md text-xs leading-5 text-muted">{emptyCopy}</p></div></div>;
  return children;
}

function ContentStatus({ value }) {
  const label = String(value || "").replace("_", " ");
  const tone = ["published", "live"].includes(value)
    ? "bg-jade/10 text-jade"
    : value === "draft"
      ? "bg-ink/10 text-muted"
      : value === "pending" || value === "needs_review"
        ? "bg-plum/10 text-plum"
        : "bg-coral/10 text-coral";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${tone}`}>{label}</span>;
}

function ResourcesAdmin({ notify }) {
  return <DataGrid title="68 learning resources" subtitle="9.8k downloads this month" columns={["Resource", "Category", "Level", "Format", "Downloads", "Completion", "Status", ""]} rows={seedResources.map((item, index) => [item.title, item.category, item.level, item.category.includes("PDF") ? "PDF" : "Course", 320 + index * 114, `${34 + index * 7}%`, index === 5 ? "Draft" : "Published"])} notify={notify} />;
}

function EventsAdmin({ records, loading, error, onRetry, onEdit, onStatus, onDelete }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = records.filter((record) => {
    const matchesSearch = `${record.title} ${record.event_type} ${record.host} ${record.location || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || record.status === status);
  });
  const visibleCount = records.filter((record) => record.status === "published" && new Date(record.starts_at).getTime() > Date.now()).length;
  const reservations = records.reduce((sum, record) => sum + Number(record.registration_count || 0), 0);

  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-11" placeholder="Search title, type, host or location..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="select sm:w-40"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="cancelled">Cancelled</option></select>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </section>
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold">{records.length} managed events</h2><p className="text-xs text-muted">{visibleCount} visible to students · {reservations} actual reservations</p></div><span className="tag !bg-jade/10 !text-jade">Database-backed</span></div>
        <ContentState loading={loading} error={error} empty={!filtered.length} emptyTitle="No managed events yet" emptyCopy="Use “Create event” to publish the first real workshop, fair or live session." onRetry={onRetry}>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-xs">
              <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.09em] text-muted"><tr>{["Event", "Type", "Starts", "Host / location", "Reservations", "Status", "Actions"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((record) => {
                  const start = new Date(record.starts_at);
                  const started = start.getTime() <= Date.now();
                  return <tr key={record.id} className="hover:bg-white/60">
                    <td className="max-w-[300px] px-4 py-4"><b className="block">{record.title}</b>{record.description && <small className="mt-1 block line-clamp-1 text-muted">{record.description}</small>}</td>
                    <td className="px-4 py-4 text-muted">{record.event_type}</td>
                    <td className={`px-4 py-4 ${started ? "font-bold text-coral" : "text-muted"}`}>{Number.isNaN(start.getTime()) ? "—" : <><b className="block text-ink">{start.toLocaleDateString()}</b><small>{start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></>}</td>
                    <td className="px-4 py-4 text-muted"><b className="block text-ink">{record.host}</b><small>{record.location || "Online"}</small></td>
                    <td className="px-4 py-4"><b className="text-cobalt">{Number(record.registration_count || 0)}</b><small className="ml-2 text-muted">{record.capacity == null ? "unlimited" : `/ ${record.capacity}`}</small></td>
                    <td className="px-4 py-4"><ContentStatus value={record.status} /></td>
                    <td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => onEdit(record)} className="btn-ghost min-h-8" aria-label="Edit event"><Pencil size={14} /></button><button onClick={() => onStatus(record, record.status === "published" ? "draft" : "published")} className={`btn-ghost min-h-8 gap-1 ${record.status === "published" ? "text-coral" : "text-jade"}`} aria-label={record.status === "published" ? "Hide event" : "Publish event"}>{record.status === "published" ? <><LockKeyhole size={14} /> Hide</> : <><Eye size={14} /> Publish</>}</button><button onClick={() => onDelete(record)} className="btn-ghost min-h-8 text-coral" aria-label="Delete event"><Trash2 size={14} /></button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </ContentState>
      </section>
    </div>
  );
}

function JobsAdmin({ records, loading, error, onRetry, onEdit, onStatus, onDelete }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = records.filter((record) => {
    const matchesSearch = `${record.title} ${record.company_name} ${record.location} ${record.requirements}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || record.status === status);
  });
  const liveCount = records.filter((record) => record.status === "live" && new Date(record.expires_at).getTime() > Date.now()).length;
  const applicationCount = records.reduce((sum, record) => sum + Number(record.application_count || 0), 0);

  return (
    <div className="space-y-5">
      <section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-11" placeholder="Search role, company, location or requirement..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="select sm:w-40"><option value="all">All statuses</option><option value="live">Live</option><option value="draft">Hidden / draft</option><option value="pending">Pending</option><option value="closed">Closed</option></select>
        <button onClick={onRetry} className="btn-secondary"><RefreshCw size={15} /> Refresh</button>
      </section>
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold">{records.length} managed jobs</h2><p className="text-xs text-muted">{liveCount} visible to students · {applicationCount} actual applications</p></div><span className="tag !bg-jade/10 !text-jade">Database-backed</span></div>
        <ContentState loading={loading} error={error} empty={!filtered.length} emptyTitle="No managed jobs yet" emptyCopy="Use “Add job” to create the first real opportunity. Demo listings are not displayed." onRetry={onRetry}>
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-xs">
              <thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.09em] text-muted"><tr>{["Role", "Company", "Location", "Type", "Applications", "Expires", "Status", "Actions"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtered.map((record) => {
                  const expiry = new Date(record.expires_at);
                  const expired = expiry.getTime() <= Date.now();
                  return (
                    <tr key={record.id} className="hover:bg-white/60">
                      <td className="max-w-[280px] px-4 py-4"><b className="block">{record.title}</b>{record.application_mode === "external" && <span className="mt-1 inline-flex rounded-full bg-jade/10 px-2 py-0.5 text-[9px] font-extrabold text-jade">Verified source link</span>}<small className="mt-1 line-clamp-1 text-muted">{record.requirements}</small></td>
                      <td className="px-4 py-4 text-muted">{record.company_name}</td>
                      <td className="px-4 py-4 text-muted">{record.location} · {record.workplace_type}</td>
                      <td className="px-4 py-4 text-muted">{record.employment_type}</td>
                      <td className="px-4 py-4">{record.application_mode === "external" ? <span className="text-[10px] font-bold text-muted">External · not tracked</span> : <><b className="text-cobalt">{Number(record.application_count || 0)}</b>{Number(record.withdrawn_count || 0) > 0 && <small className="ml-2 text-muted">{Number(record.withdrawn_count)} cancelled</small>}</>}</td>
                      <td className={`px-4 py-4 ${expired ? "font-bold text-coral" : "text-muted"}`}>{Number.isNaN(expiry.getTime()) ? "—" : expiry.toLocaleDateString()}</td>
                      <td className="px-4 py-4"><ContentStatus value={expired && record.status === "live" ? "expired" : record.status} /></td>
                      <td className="px-4 py-4"><div className="flex gap-1"><button onClick={() => onEdit(record)} className="btn-ghost min-h-8" aria-label="Edit job"><Pencil size={14} /></button><button onClick={() => onStatus(record, record.status === "live" ? "draft" : "live")} className={`btn-ghost min-h-8 gap-1 ${record.status === "live" ? "text-coral" : "text-jade"}`} aria-label={record.status === "live" ? "Hide job" : "Publish job"}>{record.status === "live" ? <><LockKeyhole size={14} /> Hide</> : <><Eye size={14} /> Publish</>}</button><button onClick={() => onDelete(record)} className="btn-ghost min-h-8 text-coral" aria-label="Delete job"><Trash2 size={14} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ContentState>
      </section>
    </div>
  );
}

function DataGrid({ title, subtitle, columns, rows, notify }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter((row) => row.join(" ").toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><section className="glass flex flex-col gap-3 rounded-[24px] p-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-11" placeholder="Search records..." /></label><button className="btn-secondary"><Filter size={15} /> Filter</button><button onClick={() => notify("Data exported as CSV.")} className="btn-secondary"><Download size={15} /> Export</button></section><section className="panel p-5"><div className="mb-5"><h2 className="text-lg font-extrabold">{title}</h2><p className="text-xs text-muted">{subtitle}</p></div><div className="table-shell overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.09em] text-muted"><tr>{columns.map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead><tbody className="divide-y divide-ink/[0.06]">{filtered.map((row, index) => <tr key={index} className="text-xs hover:bg-white/60">{row.map((cell, cIndex) => <td className={`max-w-[280px] px-4 py-4 ${cIndex === 0 ? "font-bold text-ink" : "text-muted"}`} key={cIndex}>{cIndex === row.length - 1 ? <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${["Published","Live"].includes(cell) ? "bg-jade/10 text-jade" : cell === "Draft" ? "bg-ink/10 text-muted" : "bg-coral/10 text-coral"}`}>{cell}</span> : cell}</td>)}<td className="px-4 py-4"><div className="flex"><button onClick={() => notify("Record editor opened.")} className="btn-ghost min-h-8"><Pencil size={14} /></button><button className="btn-ghost min-h-8"><MoreHorizontal size={14} /></button></div></td></tr>)}</tbody></table></div></section></div>;
}

function ModerationPage({ items, setItems, notify }) {
  const resolve = (id, action) => { setItems((current) => current.filter((item) => item.id !== id)); notify(action === "remove" ? "Content removed and author notified." : "Report dismissed after review."); };
  return <div className="space-y-5"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Open reports" value={items.length + 5} delta="-14%" note="vs last week" icon={Flag} tone="bg-coral" /><AdminMetric label="Posts today" value="286" delta="+9%" note="healthy activity" icon={MessageCircle} tone="bg-cobalt" /><AdminMetric label="Comments today" value="842" delta="+11%" note="healthy activity" icon={Users} tone="bg-jade" /><AdminMetric label="Resolution time" value="18m" delta="-4m" note="weekly average" icon={Clock3} tone="bg-plum" /></section><section className="panel p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Reported content queue</h2><p className="text-xs text-muted">Review context before taking action.</p></div><span className="tag !bg-coral/10 !text-coral"><AlertTriangle size={12} /> {items.length} high priority</span></div><div className="space-y-3">{items.map((item) => <article className="rounded-[22px] border border-ink/[0.08] bg-white/55 p-4" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><b className="text-sm">{item.author}</b><span className="tag">{item.type}</span><span className="tag !bg-coral/10 !text-coral">{item.reason}</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-ink/75">{item.content}</p><p className="mt-3 text-[10px] font-bold text-muted">{item.reports} reports · {item.time}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => resolve(item.id, "dismiss")} className="btn-secondary min-h-10">Dismiss</button><button onClick={() => resolve(item.id, "remove")} className="btn-primary min-h-10 !bg-coral"><Trash2 size={14} /> Remove</button></div></div></article>)}</div>{!items.length && <div className="py-16 text-center"><CheckCircle2 className="mx-auto text-jade" size={34} /><h3 className="mt-3 font-extrabold">Queue cleared</h3><p className="mt-1 text-xs text-muted">No reported content needs review.</p></div>}</section></div>;
}

function ApplicationsAdmin({ records, loading, error, onRetry }) {
  const total = records.reduce((sum, record) => sum + Number(record.application_count || 0), 0);
  const inReview = records.reduce((sum, record) => sum + Number(record.in_review_count || 0), 0);
  const interviews = records.reduce((sum, record) => sum + Number(record.interview_count || 0), 0);
  const offers = records.reduce((sum, record) => sum + Number(record.offer_count || 0), 0);
  const withdrawn = records.reduce((sum, record) => sum + Number(record.withdrawn_count || 0), 0);
  const rate = total ? `${((offers / total) * 100).toFixed(1)}%` : "0%";
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetric label="Applications" value={total} delta="Actual" note="excluding cancelled" icon={FileText} tone="bg-cobalt" />
        <AdminMetric label="In review" value={inReview} delta="Live" note="current review queue" icon={Eye} tone="bg-plum" />
        <AdminMetric label="Interviews" value={interviews} delta="Live" note="students at interview stage" icon={Users} tone="bg-coral" />
        <AdminMetric label="Offer rate" value={rate} delta={`${offers} offers`} note="of submitted applications" icon={CheckCircle2} tone="bg-jade" />
        <AdminMetric label="Cancelled" value={withdrawn} delta="Withdrawn" note="by students" icon={X} tone="bg-ink" />
      </section>
      <section className="panel p-5">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Application funnel by job</h2><p className="text-xs text-muted">Counts update from real student submissions.</p></div><button onClick={onRetry} className="btn-secondary"><RefreshCw size={14} /> Refresh</button></div>
        <ContentState loading={loading} error={error} empty={!records.length} emptyTitle="No application data yet" emptyCopy="Applications will appear after an administrator publishes a job and students apply." onRetry={onRetry}>
          <div className="table-shell overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-ink/[0.07] bg-ink/[0.035] text-[10px] uppercase tracking-[.1em] text-muted"><tr>{["Role", "Non-cancelled", "Cancelled", "In review", "Assessment", "Interview", "Offers"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead><tbody className="divide-y divide-ink/[0.06]">{records.map((record) => <tr key={record.id}><td className="px-4 py-4"><b className="block">{record.title}</b><small className="text-muted">{record.company_name}</small></td><td className="px-4 py-4 font-bold">{Number(record.application_count || 0)}</td><td className="px-4 py-4 text-muted">{Number(record.withdrawn_count || 0)}</td><td className="px-4 py-4 text-muted">{Number(record.in_review_count || 0)}</td><td className="px-4 py-4 text-muted">{Number(record.assessment_count || 0)}</td><td className="px-4 py-4 text-muted">{Number(record.interview_count || 0)}</td><td className="px-4 py-4 font-bold text-jade">{Number(record.offer_count || 0)}</td></tr>)}</tbody></table></div>
        </ContentState>
      </section>
    </div>
  );
}

function PerformanceAdmin() {
  return <div className="space-y-5"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric label="Weekly active users" value="1,934" delta="+7.8%" note="67.9% of students" icon={Activity} tone="bg-cobalt" /><AdminMetric label="Assessments completed" value="892" delta="+14%" note="this month" icon={FileCheck2} tone="bg-jade" /><AdminMetric label="Avg. readiness" value="68.4%" delta="+2.6%" note="monthly change" icon={Gauge} tone="bg-coral" /><AdminMetric label="Placement signals" value="312" delta="+18%" note="interviews + offers" icon={TrendingUp} tone="bg-plum" /></section><section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><div className="panel p-6"><h2 className="text-lg font-extrabold">Engagement by feature</h2><p className="text-xs text-muted">Share of monthly active students</p><div className="mt-8 space-y-5">{[["Job recommendations", 88, "bg-cobalt"], ["Skill assessments", 72, "bg-jade"], ["Learning resources", 65, "bg-coral"], ["Career Vault", 58, "bg-plum"], ["Community", 46, "bg-[#A57945]"]].map(([label, value, tone]) => <div key={label}><div className="mb-2 flex justify-between text-xs"><b>{label}</b><span className="font-bold text-muted">{value}%</span></div><div className="progress-track h-3"><div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} /></div></div>)}</div></div><div className="panel p-6"><h2 className="text-lg font-extrabold">Readiness distribution</h2><p className="text-xs text-muted">All active student profiles</p><div className="mt-8 flex h-56 items-end justify-between gap-4">{[["0–40", 18, "bg-coral/70"], ["41–60", 52, "bg-coral"], ["61–75", 85, "bg-cobalt"], ["76–90", 66, "bg-jade"], ["91+", 28, "bg-plum"]].map(([label, value, tone]) => <div className="flex flex-1 flex-col items-center gap-2" key={label}><div className={`w-full rounded-t-xl ${tone}`} style={{ height: `${value}%` }} /><span className="text-[9px] font-bold text-muted">{label}</span></div>)}</div></div></section></div>;
}

function SettingsAdmin({ notify }) {
  const tabs = [
    ["general", "General", Settings],
    ["security", "Security", ShieldCheck],
    ["email", "Email templates", Mail],
    ["integrations", "Integrations", Database],
    ["ai", "AI configuration", Zap],
  ];
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/admin/settings");
      setSettings(result.settings);
      setIntegrationStatus(result.integrations || {});
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (section, key, value) => {
    setSettings((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await apiRequest("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(result.settings);
      setIntegrationStatus(result.integrations || {});
      notify(result.message || "System settings saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="panel grid min-h-[420px] place-items-center"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-plum" size={28} /><p className="mt-3 text-xs font-bold text-muted">Loading live system settings...</p></div></section>;
  }

  if (!settings) {
    return <section className="panel grid min-h-[420px] place-items-center"><div className="text-center"><AlertTriangle className="mx-auto text-coral" size={30} /><h2 className="mt-3 text-lg font-extrabold">Settings could not be loaded</h2><p className="mt-2 text-xs text-muted">{error}</p><button onClick={load} className="btn-secondary mt-5"><RefreshCw size={14} /> Try again</button></div></section>;
  }

  const panels = {
    general: (
      <>
        <SettingsPanelHeader title="General platform settings" copy="Core presentation and operational defaults." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SettingsInput label="Platform name" value={settings.general.platformName} onChange={(value) => update("general", "platformName", value)} />
          <SettingsInput label="Support email" type="email" value={settings.general.supportEmail} onChange={(value) => update("general", "supportEmail", value)} />
          <SettingsInput label="Default timezone" value={settings.general.timezone} onChange={(value) => update("general", "timezone", value)} placeholder="Asia/Dhaka" />
          <SettingsInput label="Student locale" value={settings.general.locale} onChange={(value) => update("general", "locale", value)} />
        </div>
        <SettingsDivider />
        <h3 className="text-sm font-extrabold">Feature controls</h3>
        <div className="mt-4 space-y-4">
          <SettingsToggle title="Allow new student registration" copy="Controls whether public visitors can create student accounts." checked={settings.features.registrationEnabled} onChange={(value) => update("features", "registrationEnabled", value)} />
          <SettingsToggle title="AI cover letter generator" copy="Shows or hides tailored cover-letter generation inside applications." checked={settings.features.coverLetterEnabled} onChange={(value) => update("features", "coverLetterEnabled", value)} />
          <SettingsToggle title="Community posting" copy="Controls whether students can publish new community posts." checked={settings.features.communityPostingEnabled} onChange={(value) => update("features", "communityPostingEnabled", value)} />
          <SettingsToggle title="Maintenance mode" copy="Immediately blocks student sign-in and authenticated student API access." checked={settings.features.maintenanceMode} onChange={(value) => update("features", "maintenanceMode", value)} tone="danger" />
        </div>
      </>
    ),
    security: (
      <>
        <SettingsPanelHeader title="Authentication & security" copy="Password policy and session controls applied to real student authentication." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SettingsInput label="Minimum password length" type="number" min="8" max="64" value={settings.security.minimumPasswordLength} onChange={(value) => update("security", "minimumPasswordLength", value)} />
          <SettingsInput label="Session duration (hours)" type="number" min="1" max="720" value={settings.security.sessionHours} onChange={(value) => update("security", "sessionHours", value)} />
        </div>
        <SettingsDivider />
        <div className="space-y-4">
          <SettingsToggle title="Require an uppercase letter" copy="New student passwords must contain A–Z." checked={settings.security.requireUppercase} onChange={(value) => update("security", "requireUppercase", value)} />
          <SettingsToggle title="Require a number" copy="New student passwords must contain at least one digit." checked={settings.security.requireNumber} onChange={(value) => update("security", "requireNumber", value)} />
        </div>
        <div className="mt-6 rounded-2xl border border-plum/15 bg-plum/10 p-4 text-xs leading-5 text-plum"><b>Policy scope:</b> Password rules apply to new registrations. Session duration applies to tokens created after saving.</div>
      </>
    ),
    email: (
      <>
        <SettingsPanelHeader title="Email templates" copy="Reusable operational copy stored centrally for future email delivery workflows." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SettingsInput label="Sender name" value={settings.email.senderName} onChange={(value) => update("email", "senderName", value)} />
          <SettingsInput label="Reply-to email" type="email" value={settings.email.replyTo} onChange={(value) => update("email", "replyTo", value)} />
          <SettingsInput className="sm:col-span-2" label="Welcome email subject" value={settings.email.welcomeSubject} onChange={(value) => update("email", "welcomeSubject", value)} />
          <SettingsTextarea className="sm:col-span-2" label="Welcome email body" value={settings.email.welcomeBody} onChange={(value) => update("email", "welcomeBody", value)} />
          <SettingsInput className="sm:col-span-2" label="Application confirmation subject" value={settings.email.applicationSubject} onChange={(value) => update("email", "applicationSubject", value)} />
          <SettingsTextarea className="sm:col-span-2" label="Application confirmation body" value={settings.email.applicationBody} onChange={(value) => update("email", "applicationBody", value)} />
        </div>
        <p className="mt-4 text-[10px] text-muted">Supported variables: {"{{name}}"}, {"{{job_title}}"}, {"{{company}}"}. Email delivery requires a configured provider.</p>
      </>
    ),
    integrations: (
      <>
        <SettingsPanelHeader title="Integrations" copy="Connection status and safe, non-secret platform endpoints." />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <IntegrationStatus label="TiDB Cloud" status={integrationStatus.database} />
          <IntegrationStatus label="Python AI service" status={integrationStatus.aiService} />
          <IntegrationStatus label="Email service" status={integrationStatus.emailService} />
        </div>
        <SettingsDivider />
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsInput label="Support portal URL" type="url" value={settings.integrations.supportPortalUrl} onChange={(value) => update("integrations", "supportPortalUrl", value)} placeholder="https://..." />
          <SettingsInput label="External career page URL" type="url" value={settings.integrations.careerPageUrl} onChange={(value) => update("integrations", "careerPageUrl", value)} placeholder="https://..." />
          <SettingsInput className="sm:col-span-2" label="Webhook endpoint" type="url" value={settings.integrations.webhookUrl} onChange={(value) => update("integrations", "webhookUrl", value)} placeholder="https://..." />
        </div>
        <div className="mt-4"><SettingsToggle title="Enable application webhook" copy="Stores the endpoint as active. Secret credentials must remain in Vercel environment variables." checked={settings.integrations.webhookEnabled} onChange={(value) => update("integrations", "webhookEnabled", value)} /></div>
      </>
    ),
    ai: (
      <>
        <SettingsPanelHeader title="AI configuration" copy="Control recommendation availability, moderation sensitivity and writing tone." />
        <div className="mt-6 space-y-4">
          <SettingsToggle title="Job recommendations" copy="Allows the recommendation endpoint to return matching opportunities." checked={settings.ai.jobRecommendationsEnabled} onChange={(value) => update("ai", "jobRecommendationsEnabled", value)} />
          <SettingsToggle title="Community content moderation" copy="Automatically sends risky posts to administrator review." checked={settings.ai.contentModerationEnabled} onChange={(value) => update("ai", "contentModerationEnabled", value)} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SettingsInput label="Moderation threshold (1–100)" type="number" min="1" max="100" value={settings.ai.moderationThreshold} onChange={(value) => update("ai", "moderationThreshold", value)} />
          <label className="block"><span className="mb-1.5 block text-xs font-bold">Cover-letter tone</span><select className="select" value={settings.ai.coverLetterTone} onChange={(event) => update("ai", "coverLetterTone", event.target.value)}>{["Professional", "Concise", "Confident", "Warm"].map((tone) => <option key={tone}>{tone}</option>)}</select></label>
        </div>
        <div className="mt-6 rounded-2xl border border-jade/15 bg-jade/10 p-4 text-xs leading-5 text-jade"><b>Moderation is live:</b> Scores at or above the selected threshold are held for admin review.</div>
      </>
    ),
  };

  return (
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]">
      <aside className="panel h-fit p-4">
        {tabs.map(([id, label, Icon]) => <button type="button" onClick={() => { setTab(id); setError(""); }} className={`dash-side-link ${tab === id ? "dash-side-link-active" : ""}`} key={id}><Icon size={16} />{label}</button>)}
      </aside>
      <section className="panel p-6">
        {panels[tab]}
        {error && <p className="mt-5 rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{error}</p>}
        <div className="mt-8 flex flex-wrap justify-end gap-3"><button type="button" onClick={load} className="btn-secondary"><RefreshCw size={14} /> Reload</button><button disabled={saving} className="btn-primary !bg-plum disabled:opacity-50"><Check size={15} /> {saving ? "Saving..." : "Save settings"}</button></div>
      </section>
    </form>
  );
}

function SettingsPanelHeader({ title, copy }) {
  return <div><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-1 text-xs text-muted">{copy}</p></div>;
}

function SettingsDivider() {
  return <div className="my-7 h-px bg-ink/[0.08]" />;
}

function SettingsInput({ label, value, onChange, className = "", type = "text", ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold">{label}</span><input required={type === "email"} type={type} className="input" value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} /></label>;
}

function SettingsTextarea({ label, value, onChange, className = "" }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold">{label}</span><textarea className="input min-h-28 resize-y py-3" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SettingsToggle({ title, copy, checked, onChange, tone = "default" }) {
  return <label className={`flex cursor-pointer items-start justify-between gap-5 rounded-2xl border p-4 transition ${tone === "danger" && checked ? "border-coral/25 bg-coral/10" : "border-ink/[0.07] bg-white/35 hover:bg-white/55"}`}><span><b className="block text-xs">{title}</b><small className="text-[10px] leading-4 text-muted">{copy}</small></span><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-plum" /></label>;
}

function IntegrationStatus({ label, status }) {
  const healthy = status === "connected" || status === "configured";
  const display = String(status || "not_configured").replace("_", " ");
  return <div className="rounded-2xl border border-ink/[0.07] bg-white/35 p-4"><span className={`mb-3 block h-2.5 w-2.5 rounded-full ${healthy ? "bg-jade" : "bg-coral"}`} /><b className="block text-xs">{label}</b><small className={`mt-1 block capitalize ${healthy ? "text-jade" : "text-muted"}`}>{display}</small></div>;
}

function AssessmentEditorModal({ record, onClose, onSubmit }) {
  const [values, setValues] = useState({
    title: record?.title || "",
    description: record?.description || "",
    category: record?.category || "",
    difficulty: record?.difficulty || "Beginner",
    timeLimitMinutes: record?.time_limit_minutes || 15,
    passingPercentage: record?.passing_percentage || 60,
    status: record?.status || "live",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form onSubmit={submit} className="modal-card max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between"><div><span className="eyebrow">Assessment catalogue</span><h2 className="mt-2 text-xl font-extrabold">{record ? "Edit assessment" : "Create assessment"}</h2><p className="mt-1 text-xs text-muted">Published assessments appear to students after at least one question is published.</p></div><button type="button" onClick={onClose} className="btn-ghost"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AdminEditorField label="Assessment title" className="sm:col-span-2"><input required className="input" value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Data Visualization Essentials" /></AdminEditorField>
          <AdminEditorField label="Description" className="sm:col-span-2"><textarea className="input min-h-24 resize-y py-3" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="What knowledge or skill will this assessment measure?" /></AdminEditorField>
          <AdminEditorField label="Category"><input required className="input" value={values.category} onChange={(event) => update("category", event.target.value)} placeholder="e.g. Analytics" /></AdminEditorField>
          <AdminEditorField label="Difficulty"><select className="select" value={values.difficulty} onChange={(event) => update("difficulty", event.target.value)}>{["Beginner", "Intermediate", "Advanced"].map((item) => <option key={item}>{item}</option>)}</select></AdminEditorField>
          <AdminEditorField label="Time limit (minutes)"><input required min="1" max="180" type="number" className="input" value={values.timeLimitMinutes} onChange={(event) => update("timeLimitMinutes", event.target.value)} /></AdminEditorField>
          <AdminEditorField label="Passing score (%)"><input required min="0" max="100" type="number" className="input" value={values.passingPercentage} onChange={(event) => update("passingPercentage", event.target.value)} /></AdminEditorField>
          <AdminEditorField label="Status" className="sm:col-span-2"><select className="select" value={values.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></AdminEditorField>
        </div>
        {error && <p className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{error}</p>}
        <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary !bg-plum disabled:opacity-50">{saving ? "Saving..." : record ? "Save assessment" : "Create assessment"} <ArrowRight size={15} /></button></div>
      </form>
    </div>
  );
}

function QuestionEditorModal({ assessments: assessmentRecords, record, onClose, onSubmit }) {
  const existingOptions = record?.options?.length
    ? record.options.map((option) => ({ text: option.option_text, isCorrect: Boolean(option.is_correct) }))
    : [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }];
  const [values, setValues] = useState({
    assessmentId: record?.assessment_id || assessmentRecords[0]?.id || "",
    prompt: record?.prompt || "",
    questionType: record?.question_type || "multiple_choice",
    difficulty: record?.difficulty || "Beginner",
    explanation: record?.explanation || "",
    points: record?.points || 1,
    status: record?.status || "draft",
    options: existingOptions,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const updateOption = (index, key, value) => setValues((current) => ({
    ...current,
    options: current.options.map((option, optionIndex) => {
      if (key === "isCorrect") return { ...option, isCorrect: optionIndex === index };
      return optionIndex === index ? { ...option, [key]: value } : option;
    }),
  }));
  const setQuestionType = (questionType) => setValues((current) => ({
    ...current,
    questionType,
    options: questionType === "true_false"
      ? [{ text: "True", isCorrect: false }, { text: "False", isCorrect: false }]
      : current.questionType === "true_false"
        ? [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]
        : current.options,
  }));
  const submit = async (event) => {
    event.preventDefault();
    if (!values.options.some((option) => option.isCorrect)) {
      setError("Select the correct answer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form onSubmit={submit} className="modal-card max-w-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between"><div><span className="eyebrow">Question bank</span><h2 className="mt-2 text-xl font-extrabold">{record ? "Edit question" : "Add question"}</h2><p className="mt-1 text-xs text-muted">Only published questions inside published assessments are shown to students.</p></div><button type="button" onClick={onClose} className="btn-ghost"><X size={18} /></button></div>
        {!assessmentRecords.length ? (
          <div className="mt-6 rounded-[22px] border border-dashed border-ink/15 p-8 text-center"><FileCheck2 className="mx-auto text-muted" size={28} /><h3 className="mt-3 font-extrabold">Create an assessment first</h3><p className="mt-1 text-xs text-muted">A question must belong to an administrator-created assessment.</p></div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <AdminEditorField label="Assessment"><select required className="select" value={values.assessmentId} onChange={(event) => update("assessmentId", event.target.value)}>{assessmentRecords.map((assessment) => <option value={assessment.id} key={assessment.id}>{assessment.title} · {assessment.status}</option>)}</select></AdminEditorField>
              <AdminEditorField label="Question type"><select className="select" value={values.questionType} onChange={(event) => setQuestionType(event.target.value)}><option value="multiple_choice">Multiple choice</option><option value="true_false">True / false</option></select></AdminEditorField>
              <AdminEditorField label="Question text" className="sm:col-span-2"><textarea required className="input min-h-28 resize-y py-3" value={values.prompt} onChange={(event) => update("prompt", event.target.value)} placeholder="Write a clear, unambiguous question." /></AdminEditorField>
              <AdminEditorField label="Difficulty"><select className="select" value={values.difficulty} onChange={(event) => update("difficulty", event.target.value)}>{["Beginner", "Intermediate", "Advanced"].map((item) => <option key={item}>{item}</option>)}</select></AdminEditorField>
              <AdminEditorField label="Points"><input required min="0.25" max="100" step="0.25" type="number" className="input" value={values.points} onChange={(event) => update("points", event.target.value)} /></AdminEditorField>
            </div>
            <div className="mt-5 rounded-[22px] border border-ink/[0.08] bg-white/35 p-4">
              <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-extrabold">Answer options</h3><p className="text-[10px] text-muted">Select exactly one correct answer.</p></div>{values.questionType === "multiple_choice" && values.options.length < 6 && <button type="button" onClick={() => update("options", [...values.options, { text: "", isCorrect: false }])} className="btn-ghost min-h-8 text-xs text-plum"><Plus size={13} /> Add option</button>}</div>
              <div className="space-y-2">{values.options.map((option, index) => <div className="flex items-center gap-2" key={index}><input type="radio" name="correct-option" checked={option.isCorrect} onChange={() => updateOption(index, "isCorrect", true)} className="h-4 w-4 shrink-0 accent-jade" aria-label={`Mark option ${index + 1} correct`} /><input required className="input" value={option.text} readOnly={values.questionType === "true_false"} onChange={(event) => updateOption(index, "text", event.target.value)} placeholder={`Option ${index + 1}`} />{values.questionType === "multiple_choice" && values.options.length > 2 && <button type="button" onClick={() => update("options", values.options.filter((_, optionIndex) => optionIndex !== index))} className="btn-ghost min-h-9 text-coral" aria-label={`Remove option ${index + 1}`}><X size={14} /></button>}</div>)}</div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AdminEditorField label="Explanation" className="sm:col-span-2"><textarea className="input min-h-20 resize-y py-3" value={values.explanation} onChange={(event) => update("explanation", event.target.value)} placeholder="Optional feedback shown after completion." /></AdminEditorField>
              <AdminEditorField label="Status"><select className="select" value={values.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="needs_review">Needs review</option></select></AdminEditorField>
            </div>
          </>
        )}
        {error && <p className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{error}</p>}
        <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving || !assessmentRecords.length} className="btn-primary !bg-plum disabled:opacity-50">{saving ? "Saving..." : record ? "Save question" : "Add question"} <ArrowRight size={15} /></button></div>
      </form>
    </div>
  );
}

function JobEditorModal({ record, onClose, onSubmit }) {
  const expiryValue = record?.expires_at && !Number.isNaN(new Date(record.expires_at).getTime())
    ? new Date(record.expires_at).toISOString().slice(0, 10)
    : "";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [values, setValues] = useState({
    companyName: record?.company_name || "",
    companyDescription: record?.company_description || "",
    companyWebsite: record?.company_website || "",
    title: record?.title || "",
    description: record?.description || "",
    responsibilities: record?.responsibilities || "",
    requirements: record?.requirements || "",
    requiredSkills: String(record?.required_skills || "").split(/[,\n;]+/).map((skill) => skill.trim()).filter(Boolean),
    category: record?.category || "",
    employmentType: record?.employment_type || "Full-time",
    location: record?.location || "",
    workplaceType: record?.workplace_type || "On-site",
    salaryMin: record?.salary_min ?? "",
    salaryMax: record?.salary_max ?? "",
    currency: record?.currency || "BDT",
    expiresAt: expiryValue,
    status: record?.status || "draft",
    applicationMode: record?.application_mode || "careerforge",
    externalApplyUrl: record?.external_apply_url || "",
    sourceLabel: record?.source_label || "Verified company source",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(values);
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form onSubmit={submit} className="modal-card max-h-[92vh] max-w-4xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between"><div><span className="eyebrow">Real opportunity</span><h2 className="mt-2 text-xl font-extrabold">{record ? "Edit job" : "Add job"}</h2><p className="mt-1 text-xs text-muted">Only live, unexpired jobs appear in the student portal.</p></div><button type="button" onClick={onClose} className="btn-ghost"><X size={18} /></button></div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AdminEditorField label="Company name"><input required className="input" value={values.companyName} onChange={(event) => update("companyName", event.target.value)} placeholder="Company or organization" /></AdminEditorField>
          <AdminEditorField label="Company website"><input type="url" className="input" value={values.companyWebsite} onChange={(event) => update("companyWebsite", event.target.value)} placeholder="https://company.com" /></AdminEditorField>
          <AdminEditorField label="Company description" className="sm:col-span-2"><textarea className="input min-h-20 resize-y py-3" value={values.companyDescription} onChange={(event) => update("companyDescription", event.target.value)} placeholder="Optional company overview" /></AdminEditorField>
          <AdminEditorField label="Role title"><input required className="input" value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Junior Software Engineer" /></AdminEditorField>
          <AdminEditorField label="Category"><input required className="input" value={values.category} onChange={(event) => update("category", event.target.value)} placeholder="e.g. Engineering" /></AdminEditorField>
          <AdminEditorField label="Job description" className="sm:col-span-2"><textarea required className="input min-h-28 resize-y py-3" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe the opportunity and team." /></AdminEditorField>
          <AdminEditorField label="Responsibilities" className="sm:col-span-2"><textarea className="input min-h-24 resize-y py-3" value={values.responsibilities} onChange={(event) => update("responsibilities", event.target.value)} placeholder="One responsibility per line" /></AdminEditorField>
          <AdminEditorField label="Candidate requirements" className="sm:col-span-2"><textarea required className="input min-h-28 resize-y py-3" value={values.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder={"One requirement per line\ne.g. React and JavaScript\nStrong communication"} /></AdminEditorField>
          <AdminEditorField label="Required skills for AI matching" className="sm:col-span-2"><input className="input" value={values.requiredSkills.join(", ")} onChange={(event) => update("requiredSkills", event.target.value.split(/[,\n;]+/).map((skill) => skill.trim()).filter(Boolean))} placeholder="e.g. React, JavaScript, SQL, Communication" /><p className="mt-1 text-[10px] leading-4 text-muted">Enter skills separated by commas. These are weighted against the student’s saved skills; they are more reliable than free-text requirements.</p></AdminEditorField>
          <AdminEditorField label="Employment type"><select className="select" value={values.employmentType} onChange={(event) => update("employmentType", event.target.value)}>{["Full-time", "Part-time", "Internship", "Contract"].map((item) => <option key={item}>{item}</option>)}</select></AdminEditorField>
          <AdminEditorField label="Workplace type"><select className="select" value={values.workplaceType} onChange={(event) => update("workplaceType", event.target.value)}>{["On-site", "Hybrid", "Remote"].map((item) => <option key={item}>{item}</option>)}</select></AdminEditorField>
          <AdminEditorField label="Location"><input required className="input" value={values.location} onChange={(event) => update("location", event.target.value)} placeholder="e.g. Dhaka" /></AdminEditorField>
          <AdminEditorField label="Expiry date"><input required min={tomorrow} type="date" className="input" value={values.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} /></AdminEditorField>
          <AdminEditorField label="Minimum salary"><input min="0" type="number" className="input" value={values.salaryMin} onChange={(event) => update("salaryMin", event.target.value)} placeholder="Optional" /></AdminEditorField>
          <AdminEditorField label="Maximum salary"><input min="0" type="number" className="input" value={values.salaryMax} onChange={(event) => update("salaryMax", event.target.value)} placeholder="Optional" /></AdminEditorField>
          <AdminEditorField label="Currency"><input required maxLength="3" className="input uppercase" value={values.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} /></AdminEditorField>
          <AdminEditorField label="Application route"><select className="select" value={values.applicationMode} onChange={(event) => update("applicationMode", event.target.value)}><option value="careerforge">Apply with CareerCube · tracked</option><option value="external">Official source link · verified external job</option></select></AdminEditorField>
          {values.applicationMode === "external" && <><AdminEditorField label="Official application URL" className="sm:col-span-2"><input required type="url" className="input" value={values.externalApplyUrl} onChange={(event) => update("externalApplyUrl", event.target.value)} placeholder="https://company.com/careers/job-id" /><p className="mt-1 text-[10px] leading-4 text-muted">Use only the employer's official career page or an authorized partner link. CareerCube will not collect an internal application for this listing.</p></AdminEditorField><AdminEditorField label="Source label" className="sm:col-span-2"><input className="input" value={values.sourceLabel} onChange={(event) => update("sourceLabel", event.target.value)} placeholder="e.g. Official bKash careers page" /></AdminEditorField></>}
          <AdminEditorField label="Student portal visibility"><select className="select" value={values.status} onChange={(event) => update("status", event.target.value)}><option value="live">Publish now · visible to students</option><option value="draft">Save as draft · hidden</option><option value="pending">Pending review · hidden</option><option value="closed">Closed · hidden</option></select></AdminEditorField>
        </div>
        <div className={`mt-4 rounded-2xl border p-4 text-xs leading-5 ${values.status === "live" ? "border-jade/20 bg-jade/10 text-jade" : "border-ink/10 bg-ink/[0.035] text-muted"}`}>
          <b className="block">{values.status === "live" ? "This job will appear in Available jobs." : "This job will remain hidden from students."}</b>
          {values.status === "live" ? values.applicationMode === "external" ? "Students will see the verified listing and apply on the official source page. External applications are not counted inside CareerCube." : "Students can open the listing and submit one authenticated application before the expiry date." : "You can publish it later from the Job management table."}
        </div>
        {error && <p className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{error}</p>}
        <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary !bg-plum disabled:opacity-50">{saving ? "Saving..." : record ? "Save job" : "Create job"} <ArrowRight size={15} /></button></div>
      </form>
    </div>
  );
}

function AdminEditorField({ label, className = "", children }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-bold">{label}</span>{children}</label>;
}

function toDateTimeInput(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EventEditorModal({ record, onClose, onSubmit }) {
  const [values, setValues] = useState({
    title: record?.title || "",
    description: record?.description || "",
    eventType: record?.event_type || "Workshop",
    host: record?.host || "",
    location: record?.location || "",
    eventUrl: record?.event_url || "",
    startsAt: toDateTimeInput(record?.starts_at),
    endsAt: toDateTimeInput(record?.ends_at),
    capacity: record?.capacity ?? "",
    status: record?.status || "draft",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      });
    } catch (submitError) {
      setError(submitError.message);
      setSaving(false);
    }
  };
  return <div className="modal-backdrop" onClick={onClose}><form onSubmit={submit} className="modal-card max-h-[92vh] max-w-3xl overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><span className="eyebrow">Event operations</span><h2 className="mt-2 text-xl font-extrabold">{record ? "Edit event" : "Create event"}</h2><p className="mt-1 text-xs text-muted">Only published events are visible to students.</p></div><button type="button" onClick={onClose} className="btn-ghost"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><AdminEditorField label="Event title" className="sm:col-span-2"><input required maxLength="220" className="input" value={values.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Career readiness workshop" /></AdminEditorField><AdminEditorField label="Description" className="sm:col-span-2"><textarea className="input min-h-28 resize-y" maxLength="10000" value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="What will students learn or experience?" /></AdminEditorField><AdminEditorField label="Event type"><input required maxLength="100" className="input" value={values.eventType} onChange={(event) => update("eventType", event.target.value)} placeholder="Workshop, career fair, live session..." /></AdminEditorField><AdminEditorField label="Host / organizer"><input required maxLength="180" className="input" value={values.host} onChange={(event) => update("host", event.target.value)} placeholder="CareerCube or organization name" /></AdminEditorField><AdminEditorField label="Location"><input maxLength="220" className="input" value={values.location} onChange={(event) => update("location", event.target.value)} placeholder="Online, Dhaka, UIU..." /></AdminEditorField><AdminEditorField label="Event URL"><input type="url" className="input" value={values.eventUrl} onChange={(event) => update("eventUrl", event.target.value)} placeholder="https://... (optional)" /></AdminEditorField><AdminEditorField label="Starts at"><input required type="datetime-local" className="input" value={values.startsAt} onChange={(event) => update("startsAt", event.target.value)} /></AdminEditorField><AdminEditorField label="Ends at"><input required type="datetime-local" className="input" value={values.endsAt} onChange={(event) => update("endsAt", event.target.value)} /></AdminEditorField><AdminEditorField label="Capacity"><input min="1" max="100000" type="number" className="input" value={values.capacity} onChange={(event) => update("capacity", event.target.value)} placeholder="Optional — unlimited" /></AdminEditorField><AdminEditorField label="Student portal visibility"><select className="select" value={values.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft · hidden</option><option value="published">Published · visible to students</option><option value="cancelled">Cancelled · hidden</option></select></AdminEditorField></div>{error && <p className="mt-4 rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral">{error}</p>}<div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary !bg-plum disabled:opacity-50">{saving ? "Saving..." : record ? "Save event" : "Create event"} <ArrowRight size={15} /></button></div></form></div>;
}

function CreateEntityModal({ entity, onClose, onSubmit }) {
  const singular = { users: "user", assessments: "assessment", questions: "question", resources: "resource", events: "event", jobs: "job" }[entity];
  const fields = {
    users: [["Full name", "e.g. Ayesha Rahman"], ["Email address", "student@university.edu"], ["University", "University name"]],
    assessments: [["Assessment title", "e.g. Data Visualization"], ["Category", "Analytics"], ["Time limit", "20 minutes"]],
    questions: [["Question text", "Enter the question"], ["Assessment", "Choose assessment"], ["Difficulty", "Intermediate"]],
    resources: [["Resource title", "e.g. Interview Playbook"], ["Category", "Career Toolkit"], ["Resource URL", "https://..."]],
    events: [["Event title", "e.g. Career Fair 2026"], ["Date & time", "Aug 10, 2026 · 10:00"], ["Host / venue", "Host name"]],
    jobs: [["Role title", "e.g. Product Analyst"], ["Company", "Company name"], ["Location", "Dhaka · Hybrid"]],
  }[entity];
  return <div className="modal-backdrop" onClick={onClose}><form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between"><div><span className="eyebrow">Create record</span><h2 className="mt-2 text-xl font-extrabold capitalize">New {singular}</h2></div><button type="button" onClick={onClose} className="btn-ghost"><X size={18} /></button></div><div className="mt-6 space-y-4">{fields.map(([label, placeholder]) => <label className="block" key={label}><span className="mb-1.5 block text-xs font-bold">{label}</span><input required className="input" placeholder={placeholder} /></label>)}<label className="block"><span className="mb-1.5 block text-xs font-bold">Status</span><select className="select"><option>Draft</option><option>Published</option><option>Active</option></select></label></div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button className="btn-primary !bg-plum">Create {singular} <ArrowRight size={15} /></button></div></form></div>;
}
