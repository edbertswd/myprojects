// Hero.tsx
import { useCallback, useEffect, useRef } from "react";
import profilePlaceholder from "@/assets/profile-placeholder.jpg";
import FlyingRayquaza from "./pets/rayquaza";
import SectionWave from "./ui/section-wave";

const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const lockRef = useRef(false); 

  const scrollToNext = useCallback(() => {
    const target = document.querySelector<HTMLElement>("#about");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const unlock = () => setTimeout(() => (lockRef.current = false), 700);

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && !lockRef.current) {
        lockRef.current = true;
        scrollToNext();
        unlock();
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => (touchStartY = e.touches[0].clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchStartY - (e.changedTouches?.[0]?.clientY ?? touchStartY);
      if (dy > 20 && !lockRef.current) {
        lockRef.current = true;
        scrollToNext();
        unlock();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollToNext]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative isolate  min-h-screen flex items-center bg-gradient-warm pt-20"
    >
      {/* Flying Rayquaza above content, below navbar */}
      <FlyingRayquaza topOffset="5rem" zIndexClass="z-40" />

      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-portfolio-dark">
                I'm <span className="text-portfolio-orange">Edbert</span>
              </h1>
              <p className="text-xl text-portfolio-gray max-w-lg">
                I build things that makes life easier.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToNext}
                className="px-6 py-3 bg-primary text-white rounded-md font-medium transition-colors hover:bg-primary/90"
              >
                Welcome to my garage.
              </button>
            </div>
          </div>

          {/* Profile Image */}
          <div className="flex justify-center lg:justify-end animate-float">
            <div className="relative">
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-card bg-portfolio-cream">
                <img
                  src={profilePlaceholder}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* decorative dots  */}
              <div className="absolute -top-4 -right-4 w-16 h-16  bg-portfolio-orange rounded-full opacity-20" />
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-primary-light rounded-full opacity-30" />
            </div>
          </div>
        </div>
      </div>
      <SectionWave />
    </section>
  );
};

export default Hero;
