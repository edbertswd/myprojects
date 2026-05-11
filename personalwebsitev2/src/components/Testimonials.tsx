import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  relationship: string;
  avatarInitials: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "Edbert consistently went above and beyond during our capstone project. He took the initiative to lead backend architecture decisions and kept the entire team aligned across 18 engineers. His ability to communicate technical trade-offs clearly made him an invaluable team lead.",
    name: "Capstone Teammate",
    role: "Software Engineer",
    relationship: "Biotech Futures Capstone",
    avatarInitials: "DT",
  },
  {
    quote: "Working with Edbert on the product migration was a great experience. He automated what would have been weeks of manual work into a reliable script that handled 20,000+ SKUs without a single error. He's the kind of engineer who finds the efficient solution, not just a solution.",
    name: "Project Supervisor",
    role: "Software Engineer",
    relationship: "Europe Enchanting",
    avatarInitials: "OS",
  },
];

const avatarColors = [
  "hsl(var(--sage))",
  "hsl(var(--soft-blue))",
  "hsl(var(--primary-dark))",
  "hsl(var(--accent))",
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (isAnimating || index === activeIndex) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex(index);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  }, [isAnimating, activeIndex]);

  const next = useCallback(() => {
    const nextIndex = (activeIndex + 1) % testimonials.length;
    goTo(nextIndex, 'right');
  }, [activeIndex, goTo]);

  const prev = useCallback(() => {
    const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
    goTo(prevIndex, 'left');
  }, [activeIndex, goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(next, 7000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next]);

  const resetAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 7000);
  }, [next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipe = 50;

    if (distance > minSwipe) {
      next();
      resetAutoRotate();
    } else if (distance < -minSwipe) {
      prev();
      resetAutoRotate();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = testimonials[activeIndex];

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden py-16"
      style={{
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "hsl(var(--section-bg))",
      }}
    >
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--sage)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          className="absolute inset-0"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 relative">
        {/* Section header */}
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div
            className="inline-block px-4 py-2 mb-4 rounded-lg"
            style={{
              background: "linear-gradient(45deg, hsl(var(--sage)), hsl(var(--primary)))",
              border: "1px solid hsl(var(--sage))",
              color: "#fff",
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">TESTIMONIALS</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(var(--slate))" }}>
            Listen to the Glaze
          </h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>
            Words from colleagues and project partners I've worked with.
          </p>
        </motion.div>

        {/* Testimonial card */}
        <motion.div
          className="relative px-6 md:px-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <div
            className="bg-white rounded-xl p-5 md:p-10 border border-border/50"
            style={{
              boxShadow: "var(--shadow-card)",
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating
                ? `translateX(${direction === 'right' ? '-24px' : '24px'})`
                : 'translateX(0)',
              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            }}
          >
            {/* Quote icon */}
            <Quote
              className="w-7 h-7 md:w-10 md:h-10 mb-3 md:mb-4"
              style={{ color: "hsl(var(--sage) / 0.4)" }}
            />

            {/* Quote text */}
            <blockquote className="text-base md:text-xl leading-relaxed mb-5 md:mb-8 italic" style={{ color: "hsl(var(--foreground) / 0.75)" }}>
              "{current.quote}"
            </blockquote>

            {/* Attribution */}
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0"
                style={{ backgroundColor: avatarColors[activeIndex % avatarColors.length] }}
              >
                {current.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm md:text-base" style={{ color: "hsl(var(--slate))" }}>{current.name}</p>
                <p className="text-xs md:text-sm truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {current.role} &middot; {current.relationship}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={() => { prev(); resetAutoRotate(); }}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-5 w-10 h-10 rounded-full bg-white items-center justify-center border border-border/50 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out"
            style={{ boxShadow: "var(--shadow-card)" }}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
          <button
            onClick={() => { next(); resetAutoRotate(); }}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-5 w-10 h-10 rounded-full bg-white items-center justify-center border border-border/50 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out"
            style={{ boxShadow: "var(--shadow-card)" }}
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </motion.div>

        {/* Dots + swipe hint */}
        <div className="flex flex-col items-center gap-3 mt-6 md:mt-8">
          <div className="flex justify-center gap-2.5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  goTo(i, i > activeIndex ? 'right' : 'left');
                  resetAutoRotate();
                }}
                className="rounded-full transition-all duration-200 ease-out"
                style={{
                  width: i === activeIndex ? '28px' : '8px',
                  height: '8px',
                  backgroundColor:
                    i === activeIndex ? 'hsl(var(--sage))' : 'hsl(var(--border))',
                }}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <p className="text-xs md:hidden" style={{ color: "hsl(var(--taupe))" }}>Swipe to see more</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
