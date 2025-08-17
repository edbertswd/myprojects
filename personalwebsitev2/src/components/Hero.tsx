// Hero.tsx
import { useRef } from "react";
import profilePlaceholder from "@/assets/profile-placeholder.jpg";
import FlyingRayquaza from "./pets/rayquaza";
import SectionWave from "./ui/section-wave";

const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative isolate min-h-screen flex items-center bg-gradient-warm pt-20"
    >
      {/* Flying Rayquaza above content, below navbar */}
      <FlyingRayquaza topOffset="5rem" zIndexClass="z-40" />

      <div className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center lg:items-start lg:justify-items-start">
          {/* Content */}
          <div className="space-y-8 animate-fade-in text-left">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-portfolio-dark">
                I&apos;m <span className="text-portfolio-orange">Edbert</span>
              </h1>
              <p className="text-xl text-portfolio-gray max-w-lg">
                Welcome to my garage.
              </p>
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
              {/* decorative dots */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-portfolio-orange rounded-full opacity-20" />
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
