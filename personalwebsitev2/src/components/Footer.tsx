import { motion } from "motion/react";
import { ArrowUp, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative py-16 md:py-20">
      <motion.div
        className="mx-auto max-w-3xl px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="display-lg font-extrabold text-slate">Let&rsquo;s build something.</h2>
        <p className="mt-3 text-muted-foreground">Open to internships, graduate roles and interesting side quests.</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:edbertswd@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-hover"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
          <a
            href="https://github.com/edbertswd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-slate transition hover:-translate-y-0.5 hover:shadow-hover"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/edbert-suwandi/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-slate transition hover:-translate-y-0.5 hover:shadow-hover"
          >
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-sm text-taupe">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-sage/10 hover:text-slate"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Back to top
          </button>
          <p>&copy; {year} Edbert Suwandi. Built with React, Three.js &amp; Tailwind CSS.</p>
        </div>
      </motion.div>
    </footer>
  );
}
