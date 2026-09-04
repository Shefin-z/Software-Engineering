import { Link } from "../lib/router";
import {
  ArrowDown, ArrowUpRight, BookOpen, Check, CheckCheck, Compass, FileText, Flag,
  GraduationCap, Layers3, MessageCircle, Plus, ShieldCheck, Target, TrendingUp, Users,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "./public/PublicChrome";
import "../src/landing.css";

const steps = [
  { number: "01", title: "Start with you.", copy: "Your degree, skills and ambitions. Bring them together in a profile that grows with you.", icon: GraduationCap },
  { number: "02", title: "Find your direction.", copy: "Explore your strengths through adaptive assessments. Discover what to learn and where you could fit.", icon: Target },
  { number: "03", title: "Make your move.", copy: "Build your resume, meet your peers and apply for opportunities with a clearer sense of what you bring.", icon: ArrowUpRight },
];

const questions = [
  ["Who is CareerCube for?", "CareerCube is built for university students and recent graduates exploring their next step. Whether you are choosing a direction or preparing to apply, your workspace brings your profile, learning and opportunities together."],
  ["Do I need to know my career path already?", "No. Start with your current interests and skills. You can update your target role as you explore assessments, learning resources and opportunities."],
  ["How do the skill assessments work?", "Adaptive assessments use your degree, target role and career interests to shape a ten-level learning journey. Complete each level to see your results and work toward the next."],
  ["Can I connect with other students?", "Yes. Search for students by name, university, role or student ID, send a connection request, and message each other once it is accepted."],
];

function SectionLabel({ number, children }) {
  return <p className="landing-section-label"><span>{number}</span>{children}</p>;
}

export default function LandingPage() {
  return (
    <div className="landing-editorial">
      <a className="landing-skip-link" href="#landing-content">Skip to content</a>
      <PublicHeader variant="editorial" />
      <main id="landing-content">
        <section className="landing-hero landing-container" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span />Career growth, made tangible</p>
            <h1 id="landing-title">Your ambition.<br />A clearer<br /><em>way forward.</em></h1>
            <p className="landing-hero-description">There’s a world beyond your degree. Discover your strengths, find your people, and turn what’s next into something real.</p>
            <div className="landing-hero-actions">
              <Link to="/login/student?mode=register" className="landing-button landing-button-primary">Start your workspace <ArrowUpRight size={18} /></Link>
              <a href="#journey" className="landing-text-link">See how it works <ArrowDown size={16} /></a>
            </div>
            <p className="landing-hero-note"><ShieldCheck size={15} /> Free to join. Built around you.</p>
          </div>
          <div className="landing-hero-art">
            <div className="landing-photo-heading"><span>THE NEXT CHAPTER</span><span>BEGINS WITH YOU <ArrowUpRight size={13} /></span></div>
            <figure className="landing-photo-frame">
              <img className="landing-graduation-photo" src="/careercube-hero-graduation-light.jpg" width="1920" height="1280" fetchPriority="high" decoding="async" alt="Five university graduates sitting together on the campus lawn in their graduation gowns" />
              <figcaption className="landing-photo-caption"><span>Big dreams.<br /><em>Real beginnings.</em></span><span className="landing-photo-arrow" aria-hidden="true"><ArrowUpRight size={28} strokeWidth={1.5} /></span></figcaption>
            </figure>
            <div className="landing-chapter-note"><span className="landing-chapter-icon"><Compass size={18} /></span><div><strong>Potential, meet possibility.</strong><span>Your next chapter deserves a little direction.</span></div></div>
            <div className="landing-photo-footnote"><span>FROM CAMPUS TO WHAT’S NEXT</span><span>01 / YOUR JOURNEY</span></div>
          </div>
        </section>

        <div className="landing-principles landing-container" aria-label="What CareerCube brings together">
          <p>One workspace.<br /><strong>Every next step.</strong></p>
          <span><Target size={20} strokeWidth={1.5} />Discover your direction</span>
          <span><Layers3 size={20} strokeWidth={1.5} />Build skills that matter</span>
          <span><Users size={20} strokeWidth={1.5} />Grow alongside others</span>
        </div>

        <section id="platform" className="landing-platform landing-container landing-section" aria-labelledby="platform-title">
          <div className="landing-section-heading">
            <div><SectionLabel number="01">A SPACE FOR YOUR POTENTIAL</SectionLabel><h2 id="platform-title">Less figuring it out alone.<br /><em>More moving forward.</em></h2></div>
            <p>Everything you need to connect who you are today with who you want to become.</p>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature landing-feature-match">
              <span className="landing-feature-kicker"><Target size={17} /> A LITTLE MORE DIRECTION</span>
              <h3>Find where<br />you <em>belong.</em></h3>
              <p>Explore opportunities that connect with your skills, interests and the role you’re working toward.</p>
              <div className="landing-match-preview" aria-label="How matching uses your profile">
                <div className="landing-preview-top"><span className="landing-preview-icon"><GraduationCap size={19} /></span><span><strong>Your next opportunity</strong><small>Shaped around your profile</small></span><ArrowUpRight size={17} /></div>
                <div className="landing-match-tags"><span><Check size={12} /> Your skills</span><span><Check size={12} /> Your interests</span><span><Check size={12} /> Your goals</span></div>
              </div>
              <Link to="/login/student?mode=register" className="landing-feature-link">Explore your possibilities <ArrowUpRight size={18} /></Link>
            </article>
            <article className="landing-feature landing-feature-skills">
              <span className="landing-feature-kicker"><TrendingUp size={17} /> CONFIDENCE THROUGH PRACTICE</span>
              <h3>Small steps.<br /><em>Stronger you.</em></h3>
              <p>Adaptive assessments help you understand your strengths and make your next learning step clear.</p>
              <div className="landing-skill-preview">
                <div><span>Your assessment journey</span><strong>10 levels</strong></div>
                <div className="landing-levels" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} style={{ "--level": i }}>{i === 9 ? <Flag size={13} /> : null}</span>)}</div>
                <small>From foundations to what comes next.</small>
              </div>
              <Link to="/login/student?mode=register" className="landing-feature-link">Discover your strengths <ArrowUpRight size={18} /></Link>
            </article>
            <article className="landing-feature landing-feature-story">
              <span className="landing-feature-kicker"><FileText size={17} /> YOUR CAREER VAULT</span>
              <h3>Make your<br /><em>story count.</em></h3>
              <p>Bring your skills and experience into a resume you can keep refining for your next opportunity.</p>
              <div className="landing-resume-preview" aria-hidden="true"><div className="landing-resume-avatar"><GraduationCap size={18} /></div><div className="landing-resume-lines"><i /><i /><i /></div><span><FileText size={13} /> YOUR STORY, READY</span></div>
              <Link to="/login/student?mode=register" className="landing-feature-link">Build your career story <ArrowUpRight size={18} /></Link>
            </article>
          </div>
        </section>

        <section id="journey" className="landing-journey-section" aria-labelledby="journey-title">
          <div className="landing-container landing-section">
            <div className="landing-section-heading"><div><SectionLabel number="02">A SIMPLE PLACE TO START</SectionLabel><h2 id="journey-title">Big futures start<br />with <em>small moves.</em></h2></div><Link to="/login/student?mode=register" className="landing-text-link">Find your first step <ArrowUpRight size={17} /></Link></div>
            <div className="landing-steps">{steps.map(({ number, title, copy, icon: Icon }) => <article key={number} className="landing-step"><div className="landing-step-top"><span>{number}</span><Icon size={22} strokeWidth={1.5} /></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
          </div>
        </section>

        <section id="community" className="landing-container landing-section" aria-labelledby="community-title">
          <div className="landing-community">
            <div className="landing-community-copy"><SectionLabel number="03">BETTER, TOGETHER</SectionLabel><h2 id="community-title">Your people.<br />Your pace.<br /><em>Your next chapter.</em></h2><p>Find students who get the journey. Share a question, make a connection, and keep each other moving.</p><Link to="/community" className="landing-button landing-button-primary">Find your community <ArrowUpRight size={18} /></Link></div>
            <div className="landing-community-art" aria-label="Connect, share and learn with your peers">
              <div className="landing-orbit-decoration" aria-hidden="true" />
              <div className="landing-peer-card"><span className="landing-peer-avatar"><Users size={24} /></span><span><strong>A shared ambition.<br />A new connection.</strong><small>Find your people on CareerCube</small></span><span className="landing-peer-check"><Check size={16} /></span></div>
              <div className="landing-conversation"><span className="landing-conversation-label"><MessageCircle size={15} /> GOOD CONVERSATIONS START HERE</span><p className="landing-conversation-prompt">What are you<br /><em>working towards?</em></p><div><span>Connect. Share. Grow.</span><CheckCheck size={19} /></div></div>
              <Link to="/resources" className="landing-resource-note"><span className="landing-resource-note-icon"><BookOpen size={19} /></span><span><strong>A little inspiration goes a long way.</strong><small>Explore learning resources &amp; events</small></span><ArrowUpRight size={20} /></Link>
            </div>
          </div>
        </section>

        <section className="landing-faq landing-container landing-section" aria-labelledby="faq-title">
          <div><SectionLabel number="04">A FEW THINGS TO KNOW</SectionLabel><h2 id="faq-title">Good questions.<br /><em>Clear answers.</em></h2><p>Getting started should feel simple.</p></div>
          <div className="landing-faq-list">{questions.map(([question, answer], index) => <details key={question}><summary><span className="landing-faq-number">0{index + 1}</span><span>{question}</span><Plus size={19} /></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="landing-container landing-last-section" aria-labelledby="cta-title">
          <div className="landing-final-cta"><div className="landing-cta-copy"><p className="landing-eyebrow"><span />YOUR NEXT CHAPTER IS CALLING</p><h2 id="cta-title">You’ve got potential.<br /><em>Let’s give it direction.</em></h2><p>You don’t need every answer. Just a place to start.</p><Link to="/login/student?mode=register" className="landing-button landing-button-light">Create free account <ArrowUpRight size={18} /></Link></div><div className="landing-cta-mark" aria-hidden="true"><img src="/careercube-mark-forward-v1.png" alt="" width="220" height="220" loading="lazy" /><span>YOUR FUTURE, IN THE MAKING.</span></div></div>
        </section>
      </main>
      <PublicFooter variant="editorial" />
    </div>
  );
}
