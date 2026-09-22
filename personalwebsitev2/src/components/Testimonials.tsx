import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MessageCircle, Quote } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import { testimonials } from "@/data/testimonials";

const avatarColors = ["bg-sage", "bg-soft-blue", "bg-primary-dark", "bg-gold"];
const AUTO_MS = 7000;

export default function Testimonials() {
  const [[index, dir], setState] = useState<[number, 1 | -1]>([0, 1]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number, d: 1 | -1) => {
    setState([((next % testimonials.length) + testimonials.length) % testimonials.length, d]);
  }, []);

  const restart = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setState(([i]) => [(i + 1) % testimonials.length, 1]), AUTO_MS);
  }, []);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restart]);

  const next = () => {
    go(index + 1, 1);
    restart();
  };
  const prev = () => {
    go(index - 1, -1);
    restart();
  };

  const t = testimonials[index];

  return (
    <section id="testimonials" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 dot-grid opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeader
          badge="Testimonials"
          icon={<MessageCircle />}
          title="Listen to the glaze"
          subtitle="Words from colleagues and project partners I've worked with."
        />

        <div
          className="relative"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const d = touchX.current - e.changedTouches[0].clientX;
            if (d > 50) next();
            if (d < -50) prev();
            touchX.current = null;
          }}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <GlassCard className="p-7 md:p-11">
                  <Quote className="h-8 w-8 text-sage/40 md:h-10 md:w-10" />
                  <blockquote className="mt-4 font-raleway text-lg font-medium leading-relaxed text-slate md:text-2xl md:leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-7 flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        avatarColors[index % avatarColors.length]
                      }`}
                    >
                      {t.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate">{t.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {t.role} · {t.relationship}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="absolute -left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full glass-strong text-slate transition hover:scale-105 md:flex lg:-left-14"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="absolute -right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full glass-strong text-slate transition hover:scale-105 md:flex lg:-right-14"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  go(i, i > index ? 1 : -1);
                  restart();
                }}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-7 bg-sage" : "w-2 bg-slate/20 hover:bg-slate/40"}`}
              />
            ))}
          </div>
          <p className="text-xs text-taupe md:hidden">Swipe to see more</p>
        </div>
      </div>
    </section>
  );
}
