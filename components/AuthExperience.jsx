import { useEffect, useState } from "react";
import { Link, useLocation } from "../lib/router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import AuthVisual from "./AuthVisual";
import {
  apiRequest,
  confirmPasswordReset,
  registerStudent,
  requestPasswordReset,
  resendPasswordResetCode,
  resendRegistrationCode,
  signIn,
  verifyPasswordResetCode,
  verifyStudentEmail,
} from "../lib/api";
import { navigateFresh } from "../lib/sessionNavigation";

export default function AuthExperience({ role = "student" }) {
  const { search } = useLocation();
  const isAdmin = role === "admin";
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordReset, setPasswordReset] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [pendingVerification, setPendingVerification] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = JSON.parse(sessionStorage.getItem("careerforge_pending_verification") || "null");
      return saved?.email ? saved : null;
    } catch {
      return null;
    }
  });
  const [resendRemaining, setResendRemaining] = useState(0);
  const [platformConfig, setPlatformConfig] = useState({
    features: { registrationEnabled: true, maintenanceMode: false },
    security: { minimumPasswordLength: 8, requireUppercase: false, requireNumber: false },
  });
  const workspacePath = isAdmin ? "/admin" : "/student";
  const verificationActive = !isAdmin && mode === "register" && Boolean(pendingVerification?.email);
  const passwordResetActive = !isAdmin && Boolean(passwordReset?.stage);
  const passwordResetCodeActive = passwordReset?.stage === "verify";

  const enterWorkspace = (session, token) => {
    if (token) localStorage.setItem("careerforge_token", token);
    localStorage.setItem("careerforge_session", JSON.stringify(session));
    navigateFresh(workspacePath);
  };

  const rememberPendingVerification = (details) => {
    setPendingVerification(details);
    sessionStorage.setItem("careerforge_pending_verification", JSON.stringify(details));
  };

  const clearPendingVerification = () => {
    setPendingVerification(null);
    setResendRemaining(0);
    sessionStorage.removeItem("careerforge_pending_verification");
  };

  useEffect(() => {
    if (!isAdmin) {
      const requestedMode = new URLSearchParams(search).get("mode") === "register" ? "register" : "login";
      setMode(requestedMode === "register" && !platformConfig.features.registrationEnabled ? "login" : requestedMode);
    }
  }, [isAdmin, search, platformConfig.features.registrationEnabled]);

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
    const resendAvailableAt = verificationActive
      ? pendingVerification?.resendAvailableAt
      : passwordResetCodeActive
        ? passwordReset?.resendAvailableAt
        : null;
    if (!resendAvailableAt) {
      setResendRemaining(0);
      return undefined;
    }
    const updateCountdown = () => {
      setResendRemaining(Math.max(
        0,
        Math.ceil((Number(resendAvailableAt) - Date.now()) / 1000),
      ));
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [verificationActive, pendingVerification?.resendAvailableAt, passwordResetCodeActive, passwordReset?.resendAvailableAt]);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");

    if (!email || !password || (mode === "register" && !name)) {
      setError("Please enter your email and password.");
      return;
    }
    if (mode === "register" && password.length < platformConfig.security.minimumPasswordLength) {
      setError(`Password must contain at least ${platformConfig.security.minimumPasswordLength} characters.`);
      return;
    }
    if (mode === "register" && platformConfig.security.requireUppercase && !/[A-Z]/.test(password)) {
      setError("Password must contain an uppercase letter.");
      return;
    }
    if (mode === "register" && platformConfig.security.requireNumber && !/\d/.test(password)) {
      setError("Password must contain a number.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await registerStudent({ name, email, password });
        const verification = {
          email: result.email || email,
          expiresAt: Date.now() + Number(result.expiresInSeconds || 600) * 1000,
          resendAvailableAt: Date.now() + Number(result.resendAfterSeconds || 60) * 1000,
        };
        rememberPendingVerification(verification);
        form.reset();
        setShowPassword(false);
        setSuccess(result.message || "We sent a verification code to your email.");
        return;
      }

      const result = await signIn({ email, password, role });
      enterWorkspace(result.user, result.token);
    } catch (requestError) {
      setError(requestError.message || "Authentication is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (event) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the complete 6-digit code from your email.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await verifyStudentEmail({ email: pendingVerification.email, code });
      clearPendingVerification();
      enterWorkspace(result.user, result.token);
    } catch (requestError) {
      setError(requestError.message || "We could not verify that code.");
      if ([404, 410, 429].includes(requestError.status)) {
        clearPendingVerification();
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!pendingVerification?.email || resendRemaining > 0 || loading) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await resendRegistrationCode(pendingVerification.email);
      const updated = {
        ...pendingVerification,
        expiresAt: Date.now() + Number(result.expiresInSeconds || 600) * 1000,
        resendAvailableAt: Date.now() + Number(result.resendAfterSeconds || 60) * 1000,
      };
      rememberPendingVerification(updated);
      setSuccess(result.message || "A new verification code was sent.");
    } catch (requestError) {
      setError(requestError.message || "We could not send another code.");
      if ([404, 410].includes(requestError.status)) {
        clearPendingVerification();
      } else if (requestError.status === 429 && requestError.retryAfterSeconds) {
        const updated = {
          ...pendingVerification,
          resendAvailableAt: Date.now() + Number(requestError.retryAfterSeconds) * 1000,
        };
        rememberPendingVerification(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  const beginPasswordReset = () => {
    setPasswordReset({ stage: "email" });
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const cancelPasswordReset = () => {
    setPasswordReset(null);
    setError("");
    setSuccess("");
    setResendRemaining(0);
  };

  const submitPasswordResetRequest = async (event) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter the email address used for your student account.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setPasswordReset({
        stage: "verify",
        email: result.email || email,
        expiresAt: Date.now() + Number(result.expiresInSeconds || 600) * 1000,
        resendAvailableAt: Date.now() + Number(result.resendAfterSeconds || 60) * 1000,
      });
      setSuccess(result.message || "If your account matches, a reset code has been sent.");
    } catch (requestError) {
      setError(requestError.message || "We could not send a password reset code.");
    } finally {
      setLoading(false);
    }
  };

  const resendPasswordReset = async () => {
    if (!passwordReset?.email || resendRemaining > 0 || loading) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await resendPasswordResetCode(passwordReset.email);
      setPasswordReset((current) => current && {
        ...current,
        expiresAt: Date.now() + Number(result.expiresInSeconds || 600) * 1000,
        resendAvailableAt: Date.now() + Number(result.resendAfterSeconds || 60) * 1000,
      });
      setSuccess(result.message || "A new password reset code was sent.");
    } catch (requestError) {
      setError(requestError.message || "We could not send another code.");
      if (requestError.status === 429 && requestError.retryAfterSeconds) {
        setPasswordReset((current) => current && {
          ...current,
          resendAvailableAt: Date.now() + Number(requestError.retryAfterSeconds) * 1000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordResetCode = async (event) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(code) || !passwordReset?.email) {
      setError("Enter the complete 6-digit code from your email.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await verifyPasswordResetCode({ email: passwordReset.email, code });
      setPasswordReset((current) => current && {
        ...current,
        stage: "password",
        resetToken: result.resetToken,
      });
      setSuccess(result.message || "Code verified. Choose a new password.");
    } catch (requestError) {
      setError(requestError.message || "We could not verify that code.");
      if ([404, 410, 429].includes(requestError.status)) setPasswordReset({ stage: "email" });
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    const confirmPassword = String(data.get("confirmPassword") || "");
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await confirmPasswordReset({ resetToken: passwordReset?.resetToken, password });
      const resetEmail = passwordReset?.email || "";
      setPasswordReset(null);
      setMode("login");
      setLoginEmail(resetEmail);
      setShowPassword(false);
      setSuccess(result.message || "Password changed. Sign in with your new password.");
    } catch (requestError) {
      setError(requestError.message || "We could not change your password.");
      if (requestError.status === 410) setPasswordReset({ stage: "email" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-clay-shell min-h-screen bg-canvas p-3 sm:p-5">
      <div className="auth-clay-frame mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[30px] border border-white/75 bg-white/55 shadow-lift backdrop-blur-xl sm:min-h-[calc(100vh-40px)] lg:grid-cols-[.95fr_1.05fr]">
        <section className="auth-media-panel relative hidden overflow-hidden bg-[#DED2BE] p-8 lg:block">
          <AuthVisual role={isAdmin ? "admin" : "student"} />
          <div className="auth-brand-card absolute left-8 top-8 glass-strong rounded-2xl px-4 py-3">
            <Brand />
          </div>
          <div className="auth-story-card absolute bottom-8 left-8 right-8 rounded-[28px] border border-white/60 bg-white/75 p-7 shadow-glass backdrop-blur-2xl">
            <div className="eyebrow mb-4 !text-ink">
              {isAdmin ? <ShieldCheck size={14} /> : <GraduationCap size={14} />}
              {isAdmin ? "Secure operations portal" : "Your guided career workspace"}
            </div>
            <h1 className="font-display text-4xl leading-[1.03] tracking-[-0.045em]">
              {isAdmin ? "Steer the platform with total clarity." : "One sign-in. Every career move connected."}
            </h1>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-muted">
              {(isAdmin
                ? ["Role-based access", "Live moderation", "Actionable reporting"]
                : ["AI job matches", "Skill progress", "Resume builder"]
              ).map((item) => (
                <span className="flex items-center gap-1.5" key={item}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-jade text-white"><Check size={11} /></span>{item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-clay-form-panel flex min-h-full flex-col p-5 sm:p-8 lg:p-12 xl:p-16">
          <div className="flex items-center justify-between">
            <div className="lg:hidden"><Brand /></div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link to="/" className="btn-ghost"><ArrowLeft size={16} /> Back home</Link>
            </div>
          </div>

          <div className="mx-auto my-auto w-full max-w-[470px] py-10">
            <div className="mb-8">
              <span className={`auth-clay-intro-icon mb-5 grid h-12 w-12 place-items-center rounded-[18px] text-white ${isAdmin ? "bg-plum" : "bg-cobalt"}`}>
                {isAdmin ? <LockKeyhole size={21} /> : passwordResetActive ? passwordReset?.stage === "password" ? <LockKeyhole size={21} /> : <Mail size={21} /> : verificationActive ? <Mail size={21} /> : <User size={21} />}
              </span>
              <h2 className="font-display text-4xl leading-none tracking-[-0.045em] sm:text-5xl">
                {passwordResetActive
                  ? passwordReset?.stage === "email" ? "Reset your password." : passwordReset?.stage === "verify" ? "Check your inbox." : "Choose a new password."
                  : verificationActive ? "Check your inbox." : mode === "register" ? "Start your journey." : isAdmin ? "Admin access." : "Welcome back."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {passwordResetActive
                  ? passwordReset?.stage === "email"
                    ? "Enter the email address you used to create your student account."
                    : passwordReset?.stage === "verify"
                      ? `Enter the 6-digit reset code sent to ${passwordReset.email}.`
                      : "Use a strong password you have not used elsewhere."
                  : verificationActive
                  ? `Enter the 6-digit code sent to ${pendingVerification.email}.`
                  : mode === "register"
                  ? "Create your student profile and get your first readiness score."
                  : isAdmin
                    ? "Use your authorized administrator credentials."
                    : "Continue building the career you want."}
              </p>
            </div>

            {!isAdmin && !passwordResetActive && (
              <div className="auth-clay-tabs mb-7 grid grid-cols-2 rounded-2xl bg-ink/[0.055] p-1">
                {["login", "register"].map((item) => (
                  <button
                    key={item}
                    disabled={item === "register" && !platformConfig.features.registrationEnabled}
                    onClick={() => { setMode(item); setError(""); setSuccess(""); setShowPassword(false); }}
                    aria-pressed={mode === item}
                    className={`min-h-10 rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${mode === item ? "bg-white text-ink shadow-sm" : "text-muted"}`}
                  >
                    {item === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
            )}

            {!isAdmin && platformConfig.features.maintenanceMode && (
              <p className="mb-5 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-xs font-semibold leading-5 text-coral">Student services are temporarily under maintenance. Administrator access remains available.</p>
            )}

            {passwordResetActive ? (
              passwordReset?.stage === "email" ? (
                <form key="password-reset-request" onSubmit={submitPasswordResetRequest} className="space-y-4">
                  <div className="rounded-2xl border border-cobalt/15 bg-cobalt/[0.055] p-4 text-sm leading-6 text-muted">
                    <div className="flex items-center gap-2 font-bold text-ink"><Mail size={17} className="text-cobalt" /> Student account recovery</div>
                    <p className="mt-1 text-xs leading-5">We will send a one-time code to the email already registered for your student account.</p>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-ink">Student account email</span>
                    <span className="relative block"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="email" type="email" autoComplete="email" className="input pl-11" placeholder="you@example.com" autoFocus /></span>
                  </label>
                  {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
                  {success && <p className="rounded-xl bg-jade/10 px-3 py-2 text-xs font-semibold text-jade">{success}</p>}
                  <button disabled={loading} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Sending code..." : "Send verification code"}{!loading && <ArrowRight size={17} />}</button>
                  <button type="button" onClick={cancelPasswordReset} className="mx-auto block text-xs font-bold text-muted hover:text-ink">Back to sign in</button>
                </form>
              ) : passwordReset?.stage === "verify" ? (
                <form key="password-reset-verify" onSubmit={submitPasswordResetCode} className="space-y-4">
                  <div className="rounded-2xl border border-cobalt/15 bg-cobalt/[0.055] p-4 text-sm leading-6 text-muted"><div className="flex items-center gap-2 font-bold text-ink"><ShieldCheck size={17} className="text-cobalt" /> Verify your reset code</div><p className="mt-1 text-xs leading-5">The code expires after 10 minutes and can only be attempted five times.</p></div>
                  <label className="block"><span className="mb-2 block text-xs font-bold text-ink">Verification code</span><input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" className="input text-center text-2xl font-extrabold tracking-[0.35em]" placeholder="000000" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6); }} autoFocus /></label>
                  {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
                  {success && <p className="rounded-xl bg-jade/10 px-3 py-2 text-xs font-semibold text-jade">{success}</p>}
                  <button disabled={loading} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Verifying code..." : "Verify code"}{!loading && <ArrowRight size={17} />}</button>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs"><button type="button" onClick={() => setPasswordReset({ stage: "email" })} className="font-bold text-muted hover:text-ink">Use another email</button><button type="button" onClick={resendPasswordReset} disabled={loading || resendRemaining > 0} className="font-bold text-cobalt disabled:cursor-not-allowed disabled:text-muted">{resendRemaining > 0 ? `Resend code in ${resendRemaining}s` : "Resend code"}</button></div>
                </form>
              ) : (
                <form key="password-reset-confirm" onSubmit={submitNewPassword} className="space-y-4">
                  <div className="rounded-2xl border border-jade/15 bg-jade/[0.055] p-4 text-sm leading-6 text-muted"><div className="flex items-center gap-2 font-bold text-ink"><ShieldCheck size={17} className="text-jade" /> Email code confirmed</div><p className="mt-1 text-xs leading-5">Set a new password for your student account.</p></div>
                  <label className="block"><span className="mb-2 block text-xs font-bold text-ink">New password</span><span className="relative block"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" className="input pl-11 pr-11" placeholder={`Minimum ${platformConfig.security.minimumPasswordLength} characters`} autoFocus /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
                  <label className="block"><span className="mb-2 block text-xs font-bold text-ink">Confirm new password</span><span className="relative block"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" className="input pl-11" placeholder="Repeat your new password" /></span></label>
                  {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
                  {success && <p className="rounded-xl bg-jade/10 px-3 py-2 text-xs font-semibold text-jade">{success}</p>}
                  <button disabled={loading} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Updating password..." : "Change password"}{!loading && <ArrowRight size={17} />}</button>
                </form>
              )
            ) : verificationActive ? (
              <form key="student-verification" onSubmit={submitVerification} className="space-y-4">
                <div className="rounded-2xl border border-cobalt/15 bg-cobalt/[0.055] p-4 text-sm leading-6 text-muted">
                  <div className="flex items-center gap-2 font-bold text-ink">
                    <ShieldCheck size={17} className="text-cobalt" />
                    Email verification required
                  </div>
                  <p className="mt-1 text-xs leading-5">The code expires after 10 minutes and can only be attempted five times.</p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-ink">Verification code</span>
                  <input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    className="input text-center text-2xl font-extrabold tracking-[0.35em]"
                    placeholder="000000"
                    onInput={(event) => {
                      event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
                    }}
                    autoFocus
                  />
                </label>
                {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
                {success && <p className="rounded-xl bg-jade/10 px-3 py-2 text-xs font-semibold text-jade">{success}</p>}
                <button disabled={loading} className="btn-accent w-full disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? "Verifying your email..." : "Verify & create account"}
                  {!loading && <ArrowRight size={17} />}
                </button>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { clearPendingVerification(); setError(""); setSuccess(""); }}
                    className="font-bold text-muted hover:text-ink"
                  >
                    Use another email
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading || resendRemaining > 0}
                    className="font-bold text-cobalt disabled:cursor-not-allowed disabled:text-muted"
                  >
                    {resendRemaining > 0 ? `Resend code in ${resendRemaining}s` : "Resend code"}
                  </button>
                </div>
              </form>
            ) : (
            <form key={`${role}-${mode}`} onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-ink">Full name</span>
                  <span className="relative block">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
                    <input name="name" autoComplete="name" className="input pl-11" placeholder="Your full name" />
                  </span>
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-ink">{isAdmin ? "Work email" : "Email address"}</span>
                <span className="relative block">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    className="input pl-11"
                    placeholder={isAdmin ? "Your private admin email" : "you@example.com"}
                    value={!isAdmin && mode === "login" ? loginEmail : undefined}
                    onChange={!isAdmin && mode === "login" ? (event) => setLoginEmail(event.target.value) : undefined}
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-xs font-bold text-ink">
                  Password
                  {!isAdmin && mode === "login" && <button type="button" onClick={beginPasswordReset} className="font-semibold text-cobalt hover:underline">Forgot password?</button>}
                </span>
                <span className="relative block">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="input pl-11 pr-11"
                    placeholder={mode === "register" ? `Minimum ${platformConfig.security.minimumPasswordLength} characters` : "Your password"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              {mode === "register" && (
                <label className="flex items-start gap-3 text-xs leading-5 text-muted">
                  <input type="checkbox" required className="mt-1 accent-cobalt" />
                  I agree to the Terms of Service and understand how CareerCube uses profile data to personalize recommendations.
                </label>
              )}
              {error && <p className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">{error}</p>}
              {success && <p className="rounded-xl bg-jade/10 px-3 py-2 text-xs font-semibold text-jade">{success}</p>}
              <button disabled={loading || (!isAdmin && platformConfig.features.maintenanceMode)} className={`w-full disabled:cursor-not-allowed disabled:opacity-50 ${isAdmin ? "btn-primary !bg-plum hover:!bg-[#64465b]" : "btn-accent"}`}>
                {loading ? "Preparing your workspace..." : mode === "register" ? "Create student account" : `Enter ${isAdmin ? "admin portal" : "workspace"}`}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
            )}

            <p className="mt-7 text-center text-xs text-muted">
              {isAdmin ? "Student trying to sign in?" : "Platform administrator?"}{" "}
              <Link className="font-bold text-cobalt hover:underline" to={isAdmin ? "/login/student" : "/login/admin"}>
                Go to {isAdmin ? "student login" : "admin portal"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
