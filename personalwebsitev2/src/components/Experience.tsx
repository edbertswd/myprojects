import { lazy, Suspense, useRef } from "react";
import { motion, type Variants } from "motion/react";
import { Briefcase, Calendar, CheckCircle2, Clock, ExternalLink, Github, MapPin, Sparkles } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import { allSkills, completedProjects, inDevProjects, workExperience, type ProjectCategory } from "@/data/experience";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const TechCloud = lazy(() => import("@/three/experience/TechCloud"));

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const categoryStyle: Record<ProjectCategory, string> = {
  Fullstack: "bg-primary text-white",
  Frontend: "bg-soft-blue text-slate",
  "Data Science": "bg-gold text-slate",
  "Game Dev": "bg-primary-dark text-white",
};

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const showCloud = useMediaQuery("(min-width: 1024px)");

  return (
    <section ref={sectionRef} id="experience" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh-section" />

      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          badge="Professional experience"
          icon={<Briefcase />}
          title="Where I've worked"
          subtitle="Internships, a capstone and the tools that came with them."
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          {/* timeline */}
          <motion.ol
            className="relative space-y-8 border-l border-sage/25 pl-8 md:pl-10"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            {workExperience.map((exp, idx) => (
              <motion.li key={exp.company} variants={rise} className="relative">
                <span className="absolute -left-[41px] top-7 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary shadow-soft md:-left-[49px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <GlassCard hover className="relative p-6 md:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sage/30 bg-white p-1.5 sm:h-16 sm:w-16">
                        <img src={exp.logo} alt={exp.logoAlt} className="h-full w-full object-contain" loading="lazy" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-raleway text-xl font-extrabold leading-tight text-slate sm:text-2xl">{exp.company}</h3>
                        <p className="text-sm font-medium text-muted-foreground sm:text-base">{exp.role}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-taupe sm:text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {exp.date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {exp.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={exp.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-sage hover:underline"
                    >
                      Visit site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <ul className="mt-5 space-y-2">
                    {exp.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/80 sm:text-[15px]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {exp.skills.map((s) => (
                      <span key={s} className="rounded-full border border-sage/35 bg-sage/10 px-3 py-1 text-xs font-semibold text-primary-dark">
                        {s}
                      </span>
                    ))}
                  </div>

                  <span className="pointer-events-none absolute right-5 top-4 select-none font-raleway text-6xl font-black leading-none text-sage/10">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </GlassCard>
              </motion.li>
            ))}
          </motion.ol>

          {/* tech cloud */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <GlassCard className="overflow-hidden p-4">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-dark">Toolbox</span>
                  <span className="text-xs text-muted-foreground">{allSkills.length} tools</span>
                </div>
                <div className="relative mt-2 h-[380px]">
                  {showCloud && (
                    <Suspense fallback={null}>
                      <TechCloud skills={allSkills} className="absolute inset-0" />
                    </Suspense>
                  )}
                </div>
                <p className="px-2 pb-1 text-center text-xs text-muted-foreground">Move your cursor to spin it around.</p>
              </GlassCard>
            </div>
          </aside>
        </div>

        {/* In development */}
        <motion.div className="mt-20" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
          <motion.div variants={rise} className="mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <h3 className="font-raleway text-xl font-extrabold text-slate">In development</h3>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-2">
            {inDevProjects.map((p) => (
              <motion.div key={p.title} variants={rise}>
                <GlassCard hover className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-raleway text-lg font-extrabold text-slate">{p.title}</h4>
                    <span className="shrink-0 rounded-full bg-gold/25 px-2.5 py-1 text-[11px] font-semibold text-slate">{p.timeline}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/75">{p.description}</p>
                  <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" /> {p.highlight}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.technologies.map((t) => (
                        <span key={t} className="rounded-full bg-sage px-2 py-0.5 text-[11px] font-medium text-white">
                          {t}
                        </span>
                      ))}
                    </div>
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-sage/40 px-3 py-1 text-xs font-semibold text-sage transition hover:bg-sage hover:text-white"
                      >
                        <Github className="h-3.5 w-3.5" /> Code
                      </a>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div className="mt-16" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
          <motion.h3 variants={rise} className="mb-5 font-raleway text-xl font-extrabold text-slate">
            Completed projects
          </motion.h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedProjects.map((p) => (
              <motion.div key={p.title} variants={rise}>
                <GlassCard hover className="flex h-full flex-col overflow-hidden">
                  <div className={`flex items-center justify-between px-4 py-2 text-xs font-semibold ${categoryStyle[p.category]}`}>
                    <span>{p.category}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="font-raleway text-base font-extrabold leading-tight text-slate">{p.title}</h4>
                    <ul className="mt-3 flex-1 space-y-1.5">
                      {p.highlight.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-foreground/75">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" /> {h}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.technologies.map((t) => (
                        <span key={t} className="rounded-md bg-slate/8 px-2 py-0.5 text-[11px] font-medium text-slate">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border/70 bg-white/50 px-3 py-2 text-sm font-medium text-slate transition hover:bg-white"
                      >
                        <Github className="h-4 w-4" /> View code
                      </a>
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
                        >
                          <ExternalLink className="h-4 w-4" /> Live
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
