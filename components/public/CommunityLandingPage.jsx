import {
  ArrowRight,
  CalendarDays,
  Check,
  GraduationCap,
  Heart,
  MessageCircle,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "../../lib/router";
import { communityPosts } from "../../lib/mockData";
import { PublicFooter, PublicHeader } from "./PublicChrome";

const cleanText = (value) => String(value)
  .replaceAll("Â·", "·")
  .replaceAll("â€”", "—")
  .replaceAll("â€™", "’");

const circles = [
  { icon: GraduationCap, title: "Assessment study circles", copy: "Practice together, compare approaches and turn difficult topics into shared progress.", tone: "bg-cobalt" },
  { icon: Trophy, title: "Wins worth sharing", copy: "Celebrate interviews, portfolio launches, certifications and the small milestones between them.", tone: "bg-coral" },
  { icon: CalendarDays, title: "Campus & career events", copy: "Find workshops, career fairs and peer-led sessions across Bangladesh.", tone: "bg-jade" },
  { icon: ShieldCheck, title: "A safer professional space", copy: "Role-aware moderation keeps conversations useful, respectful and focused.", tone: "bg-plum" },
];

export default function CommunityLandingPage() {
  return (
    <main className="clay-app public-clay-page noise min-h-screen overflow-hidden">
      <PublicHeader current="community" />

      <section className="page-shell pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <div className="eyebrow mb-6"><Users size={14} /> CareerCube community</div>
            <h1 className="display-title max-w-3xl">
              Grow beside people
              <span className="block italic text-coral">going somewhere.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Meet ambitious students across Bangladesh, learn in public, exchange practical advice and keep each other moving.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login/student?mode=register" className="btn-accent px-6">
                Join the community <ArrowRight size={17} />
              </Link>
              <a href="#community-feed" className="btn-secondary px-5">
                Explore conversations
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted">
              {["Student-first network", "Moderated discussions", "Campus-wide connections"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-jade/15 text-jade"><Check size={12} /></span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="community-hero-board relative min-h-[480px] overflow-hidden rounded-[38px] border border-white/70 bg-[#DED2BE] p-5 shadow-lift sm:p-8">
            <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full border-[52px] border-coral/55" />
            <div className="absolute -bottom-16 left-12 h-48 w-48 rounded-[54px] bg-cobalt/80" />
            <article className="glass-strong relative z-10 ml-auto max-w-[410px] rounded-[26px] p-5 sm:mt-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-coral text-sm font-extrabold text-white">SN</span>
                <span><b className="block text-sm">Samiha Noor</b><small className="text-muted">BRAC University · 18 min</small></span>
              </div>
              <p className="mt-5 text-sm leading-6">“The STAR story worksheet made my first technical interview feel structured. Write the story before you need it.”</p>
              <div className="mt-5 flex gap-4 text-xs font-bold text-muted"><span className="flex items-center gap-1.5"><Heart size={14} /> 48</span><span className="flex items-center gap-1.5"><MessageCircle size={14} /> 9</span></div>
            </article>
            <div className="glass absolute bottom-7 left-7 z-10 rounded-[24px] p-5 sm:w-[330px]">
              <span className="eyebrow"><Users size={13} /> Live circle</span>
              <h2 className="mt-3 text-xl font-extrabold">SQL practice · Saturday</h2>
              <p className="mt-2 text-sm leading-6 text-muted">12 students from 7 universities are joining.</p>
              <div className="mt-4 flex -space-x-2">
                {["UI", "DU", "BU", "JU", "+8"].map((label, index) => (
                  <span key={label} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[10px] font-extrabold text-white ${["bg-cobalt", "bg-jade", "bg-coral", "bg-plum", "bg-ink"][index]}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/[0.07] bg-white/35 py-7">
        <div className="page-shell grid grid-cols-2 gap-5 text-center sm:grid-cols-4">
          {[["8.4k+", "student members"], ["42", "universities"], ["680+", "study circles"], ["94%", "positive interactions"]].map(([value, label]) => (
            <div key={label}><b className="font-display text-3xl tracking-[-0.04em] sm:text-4xl">{value}</b><span className="mt-1 block text-xs font-semibold text-muted">{label}</span></div>
          ))}
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div><div className="eyebrow mb-5"><Users size={14} /> Find your people</div><h2 className="section-title">Connection with<br /><i className="text-coral">career direction.</i></h2></div>
          <p className="max-w-2xl text-base leading-7 text-muted lg:justify-self-end">Every space is designed around useful action—learning a skill, preparing for an opportunity or sharing experience that helps someone else move faster.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {circles.map(({ icon: Icon, title, copy, tone }) => (
            <article key={title} className="panel min-h-[270px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className={`grid h-12 w-12 place-items-center rounded-[18px] text-white ${tone}`}><Icon size={20} /></span>
              <h3 className="mt-7 text-lg font-extrabold tracking-[-0.025em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="community-feed" className="bg-ink py-20 text-white sm:py-28">
        <div className="page-shell">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><div className="eyebrow mb-4 !text-[#9cb1ff]"><MessageCircle size={14} /> From the community</div><h2 className="section-title">Real progress,<br /><i className="text-[#E59779]">shared openly.</i></h2></div>
            <Link to="/login/student?mode=register" className="btn-secondary !border-white/15 !bg-white/10 !text-white hover:!bg-white/20">Create your first post <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {communityPosts.map((post) => (
              <article key={post.id} className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-full text-sm font-extrabold text-white ${post.tone}`}>{post.initials}</span>
                  <span><b className="block text-sm">{post.author}</b><small className="text-white/45">{cleanText(post.role)} · {post.time}</small></span>
                </div>
                <p className="mt-5 text-sm leading-7 text-white/72">{cleanText(post.text)}</p>
                <div className="mt-5 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/65">{tag}</span>)}</div>
                <div className="mt-6 flex gap-5 border-t border-white/10 pt-4 text-xs font-bold text-white/50"><span className="flex items-center gap-1.5"><Heart size={14} /> {post.likes}</span><span className="flex items-center gap-1.5"><MessageCircle size={14} /> {post.comments}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20">
        <div className="relative overflow-hidden rounded-[38px] bg-coral px-7 py-12 text-white shadow-lift sm:px-12 sm:py-16">
          <div className="relative z-10 max-w-2xl"><span className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/70">Your circle is waiting</span><h2 className="mt-4 font-display text-5xl leading-none tracking-[-0.05em] sm:text-6xl">Bring your questions.<br /><i>Leave with momentum.</i></h2><Link to="/login/student?mode=register" className="btn-primary mt-8 !bg-white !text-ink">Join CareerCube free <ArrowRight size={17} /></Link></div>
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border-[70px] border-white/10" />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
