import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "../../lib/router";
import Brand from "../Brand";
import ThemeToggle from "../ThemeToggle";

const navigation = [
  { label: "Platform", href: "/#platform", kind: "anchor" },
  { label: "How it works", href: "/#journey", kind: "anchor" },
  { label: "Community", href: "/community", id: "community" },
  { label: "Resources", href: "/resources", id: "resources" },
];

const editorialNavigation = [
  { label: "Platform", href: "#platform", kind: "anchor" },
  { label: "How it works", href: "#journey", kind: "anchor" },
  { label: "Community", href: "#community", kind: "anchor" },
  { label: "Resources", href: "/resources", id: "resources" },
];

function EditorialNavLink({ item, current, onNavigate }) {
  const shared = {
    className: "landing-nav-link",
    onClick: onNavigate,
    ...(item.id === current ? { "aria-current": "page" } : {}),
  };

  return item.kind === "anchor"
    ? <a href={item.href} {...shared}>{item.label}</a>
    : <Link to={item.href} {...shared}>{item.label}</Link>;
}

function PublicNavLink({ item, current, mobile = false, onNavigate }) {
  const active = item.id === current;
  const className = mobile
    ? `dash-side-link ${active ? "!bg-ink !text-white" : ""}`
    : `btn-ghost ${active ? "!bg-ink/[0.07] !text-ink" : ""}`;
  const shared = {
    className,
    onClick: onNavigate,
    ...(active ? { "aria-current": "page" } : {}),
  };

  if (item.kind === "anchor") {
    return <a href={item.href} {...shared}>{item.label}</a>;
  }

  return <Link to={item.href} {...shared}>{item.label}</Link>;
}

export function PublicHeader({ current = "", variant = "default" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  if (variant === "editorial") {
    return (
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand"><Brand href="/" /></div>
          <nav className="landing-nav" aria-label="Primary navigation">
            {editorialNavigation.map((item) => (
              <EditorialNavLink key={item.label} item={item} current={current} />
            ))}
          </nav>
          <div className="landing-header-actions">
            <ThemeToggle className="landing-theme-toggle" />
            <Link to="/login/admin" className="landing-admin-link">Admin</Link>
            <Link to="/login/student" className="landing-login-link">Log in</Link>
            <Link to="/login/student?mode=register" className="landing-button landing-button-primary">
              Get started <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className="landing-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-navigation"
            >
              {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="landing-mobile-navigation" className="landing-mobile-menu">
            <nav className="landing-mobile-nav" aria-label="Mobile navigation">
              {editorialNavigation.map((item) => (
                <EditorialNavLink
                  key={item.label}
                  item={item}
                  current={current}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="landing-mobile-actions">
              <Link to="/login/admin" className="landing-admin-link" onClick={() => setMenuOpen(false)}>Admin portal</Link>
              <Link to="/login/student" className="landing-login-link" onClick={() => setMenuOpen(false)}>Student login</Link>
              <Link to="/login/student?mode=register" className="landing-button landing-button-primary" onClick={() => setMenuOpen(false)}>
                Create your account <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </header>
    );
  }

  return (
    <header className="public-header page-shell sticky top-0 z-50 pt-4">
      <nav aria-label="Primary navigation" className="clay-public-nav glass public-nav flex h-[70px] items-center justify-between rounded-[22px] px-4 sm:px-5">
        <Brand href="/" />
        <div className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <PublicNavLink key={item.label} item={item} current={current} />
          ))}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Link to="/login/admin" className="btn-ghost">Admin</Link>
          <Link to="/login/student" className="btn-primary min-h-11 px-4">
            Student login <ArrowRight size={16} />
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="clay-icon-button grid h-10 w-10 place-items-center rounded-xl bg-ink text-white"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="public-mobile-navigation"
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="public-mobile-navigation" className="clay-popover glass-strong absolute left-5 right-5 top-[5.65rem] z-50 animate-enter rounded-[22px] p-3 sm:hidden">
          {navigation.map((item) => (
            <PublicNavLink
              key={item.label}
              item={item}
              current={current}
              mobile
              onNavigate={() => setMenuOpen(false)}
            />
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-ink/10 pt-3">
            <Link to="/login/admin" className="btn-secondary">Admin</Link>
            <Link to="/login/student" className="btn-primary">Student login</Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter({ variant = "default" }) {
  if (variant === "editorial") {
    return (
      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <Brand href="/" />
            <p className="landing-footer-tagline">For the career you haven’t met yet.</p>
            <p className="landing-footer-note">Build your skills. Find your people. Make your next move.</p>
          </div>
          <nav className="landing-footer-links" aria-label="Footer navigation">
            <div className="landing-footer-link-group">
              <h2 className="landing-footer-label">Explore</h2>
              <a href="#platform">The platform</a>
              <a href="#journey">How it works</a>
              <Link to="/community">Your community</Link>
              <Link to="/resources">Learning resources</Link>
            </div>
            <div className="landing-footer-link-group">
              <h2 className="landing-footer-label">Your next chapter</h2>
              <Link to="/login/student?mode=register">Create an account</Link>
              <Link to="/login/student">Student login</Link>
              <Link to="/login/admin">Admin portal</Link>
            </div>
          </nav>
        </div>
        <div className="landing-footer-bottom">
          <p>© {new Date().getFullYear()} CareerCube. All rights reserved.</p>
          <span>Small steps. Real possibilities.</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="clay-public-footer border-t border-ink/[0.08] py-8">
      <div className="page-shell flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
        <Brand href="/" />
        <p className="text-xs text-muted">© 2026 CareerCube. Built for the careers still becoming.</p>
        <div className="flex gap-1">
          <Link to="/community" className="btn-ghost text-xs">Community</Link>
          <Link to="/resources" className="btn-ghost text-xs">Resources</Link>
          <Link to="/login/student" className="btn-ghost text-xs">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
