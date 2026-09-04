import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Download,
  FileText,
  Search,
  Target,
} from "lucide-react";
import { Link } from "../../lib/router";
import { events, resources } from "../../lib/mockData";
import { PublicFooter, PublicHeader } from "./PublicChrome";

const categories = ["All", "Career Toolkit", "Data & Analytics", "Development", "Communication"];
const cleanText = (value) => String(value)
  .replaceAll("Â·", "·")
  .replaceAll("â€”", "—")
  .replaceAll("â€™", "’");

export default function ResourcesLandingPage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filteredResources = useMemo(() => {
    const search = query.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesCategory = category === "All" || resource.category.includes(category);
      const matchesSearch = !search || `${resource.title} ${resource.category} ${resource.level}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  return (
    <main className="clay-app public-clay-page noise min-h-screen overflow-hidden">
      <PublicHeader current="resources" />

      <section className="page-shell pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="eyebrow mb-6"><BookOpen size={14} /> CareerCube resource library</div>
            <h1 className="display-title max-w-3xl">
              Learn what moves
              <span className="block italic text-jade">your career forward.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Practical guides, focused courses, interview tools and career events—curated around the skills employers actually ask for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#resource-library" className="btn-accent px-6">Browse resources <ArrowRight size={17} /></a>
              <Link to="/login/student?mode=register" className="btn-secondary px-5">Get personalized picks</Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[38px] bg-ink p-6 text-white shadow-lift sm:p-9">
            <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[58px] border-jade/35" />
            <div className="relative z-10">
              <span className="eyebrow !text-[#9bd5ba]"><Target size={14} /> This week’s guided path</span>
              <h2 className="mt-5 font-display text-4xl leading-none tracking-[-0.045em] sm:text-5xl">From data curious<br /><i className="text-[#E59779]">to interview ready.</i></h2>
              <div className="mt-8 space-y-3">
                {[["01", "SQL for Product Decisions", "2h 40m"], ["02", "Product Analytics Field Guide", "42 pages"], ["03", "Interview Stories that Stick", "1h 20m"]].map(([number, title, duration]) => (
                  <div key={number} className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
                    <span className="font-display text-2xl italic text-[#E59779]">{number}</span>
                    <span className="flex-1"><b className="block text-sm">{title}</b><small className="text-white/45">{duration}</small></span>
                    <Check size={16} className="text-[#8ad0ae]" />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-white/55"><span>Role-aligned learning plan</span><span>3 resources</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/[0.07] bg-white/35 py-7">
        <div className="page-shell grid grid-cols-2 gap-5 text-center sm:grid-cols-4">
          {[["68+", "curated resources"], ["12", "skill pathways"], ["9.8k", "monthly downloads"], ["4.8/5", "learner rating"]].map(([value, label]) => (
            <div key={label}><b className="font-display text-3xl tracking-[-0.04em] sm:text-4xl">{value}</b><span className="mt-1 block text-xs font-semibold text-muted">{label}</span></div>
          ))}
        </div>
      </section>

      <section id="resource-library" className="page-shell py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><div className="eyebrow mb-5"><Target size={14} /> Explore the library</div><h2 className="section-title">Useful now.<br /><i className="text-jade">Valuable later.</i></h2></div>
          <label className="relative block w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="input min-h-14 pl-12" placeholder="Search guides, skills or topics" />
          </label>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? "bg-ink text-white shadow-lg" : "border border-ink/10 bg-white/60 text-muted hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="panel group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className={`relative h-36 overflow-hidden p-5 text-white ${resource.tone}`}>
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[28px] border-white/15" />
                <span className="relative z-10 font-display text-4xl italic">{resource.icon}</span>
                <span className="absolute bottom-4 left-5 rounded-full bg-black/15 px-3 py-1 text-[10px] font-bold backdrop-blur-md">{cleanText(resource.category)}</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted"><span>{resource.level}</span><span className="h-1 w-1 rounded-full bg-muted/50" /><span className="flex items-center gap-1"><Clock3 size={12} /> {resource.time}</span></div>
                <h3 className="mt-4 text-xl font-extrabold tracking-[-0.03em]">{resource.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">A focused, practical resource designed to turn knowledge into visible career progress.</p>
                <div className="mt-6 flex items-center justify-between border-t border-ink/[0.08] pt-4">
                  <span className="text-xs font-bold text-muted">{resource.progress ? `${resource.progress}% explored` : "Ready to start"}</span>
                  <Link to="/login/student" aria-label={`Open ${resource.title}`} className="grid h-9 w-9 place-items-center rounded-full bg-ink/[0.07] transition group-hover:bg-ink group-hover:text-white"><ArrowRight size={15} /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!filteredResources.length && (
          <div className="panel mt-8 p-10 text-center"><Search className="mx-auto text-muted" size={28} /><h3 className="mt-4 text-lg font-extrabold">No resources found</h3><p className="mt-2 text-sm text-muted">Try another keyword or choose a different category.</p></div>
        )}
      </section>

      <section className="bg-ink py-20 text-white sm:py-28">
        <div className="page-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="eyebrow mb-5 !text-[#9cb1ff]"><CalendarDays size={14} /> Upcoming opportunities</div><h2 className="section-title">Learning happens<br /><i className="text-[#E59779]">live, too.</i></h2><p className="mt-5 max-w-md text-sm leading-6 text-white/55">Workshops, career fairs and mentor sessions that connect what you learn with who you meet.</p></div>
          <div className="space-y-3">
            {events.slice(0, 4).map((event) => (
              <article key={event.id} className="grid items-center gap-4 rounded-[24px] border border-white/10 bg-white/[0.055] p-5 sm:grid-cols-[74px_1fr_auto]">
                <div><b className="font-display text-3xl">{event.day}</b><span className="ml-1 text-[10px] font-extrabold text-[#E59779]">{event.month}</span></div>
                <div><h3 className="text-sm font-extrabold">{event.title}</h3><p className="mt-1 text-xs text-white/45">{event.time} · {event.host}</p></div>
                <Link to="/login/student" className="btn-secondary min-h-10 !border-white/15 !bg-white/10 !text-white hover:!bg-white/20">View event</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {[{ icon: FileText, title: "Downloadable playbooks", copy: "Keep field guides, worksheets and checklists close." }, { icon: BarChart3, title: "Progress-aware picks", copy: "Recommendations adapt as your skills and goals change." }, { icon: Download, title: "Learn your way", copy: "Read, watch, practise or save resources for later." }].map(({ icon: Icon, title, copy }) => (
            <article key={title} className="panel p-6"><span className="icon-tile !bg-jade"><Icon size={19} /></span><h3 className="mt-6 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{copy}</p></article>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-center justify-between gap-6 rounded-[34px] bg-jade px-7 py-9 text-center text-white sm:flex-row sm:px-10 sm:text-left">
          <div><h2 className="font-display text-3xl tracking-[-0.04em] sm:text-4xl">Get a library shaped around your goals.</h2><p className="mt-2 text-sm text-white/70">Create a free profile and let CareerCube prioritize the right next resource.</p></div>
          <Link to="/login/student?mode=register" className="btn-primary shrink-0 !bg-white !text-ink">Create free account <ArrowRight size={17} /></Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
