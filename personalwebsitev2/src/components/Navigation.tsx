import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useAtomValue } from "jotai";
import { Github, Linkedin, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { heroPhaseAtom, isRevealed } from "@/three/hero/heroPhase";
import { cn } from "@/lib/utils";
import logo from "@/assets/edsuw-logo.png";

const links = [
  { href: "#about", id: "about", label: "Journey" },
  { href: "#experience", id: "experience", label: "Experience" },
  { href: "#testimonials", id: "testimonials", label: "Testimonials" },
  { href: "#hobbies", id: "hobbies", label: "Hobbies" },
];

export default function Navigation() {
  const revealed = isRevealed(useAtomValue(heroPhaseAtom));
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
        else if (window.scrollY < 200) setActive(null);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : -12 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ pointerEvents: revealed ? "auto" : "none" }}
    >
      <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full px-3 py-2 transition-all duration-300 md:px-4",
            scrolled ? "glass-strong" : "bg-transparent"
          )}
          aria-label="Primary"
        >
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 pl-1"
          >
            <img src={logo} alt="Edbert Suwandi" className="-my-3 h-14 w-auto" />
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.href}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.id);
                  }}
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    active === l.id ? "text-primary-dark" : "text-slate/75 hover:text-slate"
                  )}
                >
                  {active === l.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-sage/15"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <a
              href="https://github.com/edbertswd"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded-full p-2 text-slate/75 transition hover:bg-sage/15 hover:text-slate"
            >
              <Github className="h-[18px] w-[18px]" />
            </a>
            <a
              href="https://www.linkedin.com/in/edbert-suwandi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-full p-2 text-slate/75 transition hover:bg-sage/15 hover:text-slate"
            >
              <Linkedin className="h-[18px] w-[18px]" />
            </a>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="rounded-full p-2 text-slate/75 transition hover:bg-sage/15 hover:text-slate md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-strong w-72 border-l-0">
                <SheetTitle className="font-raleway text-lg font-extrabold text-slate">Menu</SheetTitle>
                <ul className="mt-6 space-y-1">
                  {links.map((l) => (
                    <li key={l.id}>
                      <button
                        onClick={() => go(l.id)}
                        className={cn(
                          "w-full rounded-xl px-4 py-3 text-left text-base font-semibold transition",
                          active === l.id ? "bg-sage/15 text-primary-dark" : "text-slate hover:bg-sage/10"
                        )}
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
