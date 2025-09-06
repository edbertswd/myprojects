import { useEffect, useMemo, useRef, useState } from "react";
import city7 from "/src/assets/city/7.png";

type Checkpoint = {
  t: number;
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  id?: string;
};

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

export default function AboutMobile() {
  const checkpoints: Checkpoint[] = useMemo(
    () => [
      { t: 0.04, id: "chapter-beginnings", title: "Beginnings", text: "Born in 2002, the youngest — learned to be heard.", imageSrc: "", imageAlt: "" },
      { t: 0.16, id: "chapter-jakarta", title: "High School in Jakarta", text: "Tried everything I wanted (mostly video games though unfortunately).", imageSrc: "", imageAlt: "" },
      { t: 0.36, id: "chapter-atlanta", title: "Atlanta & Covid Era", text: "Moved to Atlanta and learned how to code. First Hello World.", imageSrc: "", imageAlt: "" },
      { t: 0.52, id: "chapter-sydney", title: "Sydney Chapter", text: "Moved to Sydney for my girlfriend. Worked hard to build a strong future here.", imageSrc: "", imageAlt: "" },
      { t: 0.66, id: "chapter-content", title: "Content Creation Era", text: "Built a Twitch community of 1.8k — learned content creating and networking.", imageSrc: "", imageAlt: "" },
      { t: 0.80, id: "chapter-gamedev", title: "Locked In Era", text: "Decided I had to specialize and chose two areas: web development and game development.", imageSrc: "", imageAlt: "" },
      { t: 0.92, id: "chapter-next", title: "What's Next?", text: "Still writing the story — excited for the next thing!", imageSrc: "", imageAlt: "" },
    ],
    []
  );

  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const activeIndex = useMemo(() => {
    return Math.floor(progress * checkpoints.length);
  }, [progress, checkpoints]);

  // Touch handlers for swipe navigation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe && progress < 1) {
        const nextProgress = Math.min(progress + (1 / checkpoints.length), 1);
        setProgress(nextProgress);
      }
      if (isRightSwipe && progress > 0) {
        const prevProgress = Math.max(progress - (1 / checkpoints.length), 0);
        setProgress(prevProgress);
      }
    };

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchmove', handleTouchMove);
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd, progress, checkpoints.length]);

  const currentCheckpoint = checkpoints[activeIndex] || checkpoints[0];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
      aria-labelledby="journey-heading"
    >
      <h2 id="journey-heading" className="sr-only">Journey</h2>

      {/* Background city */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${city7})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      {/* Instruction text */}
      <div className="absolute top-8 left-0 right-0 text-center z-40 px-4">
        <h2 className="text-white text-2xl font-bold mb-2">
          My Journey
        </h2>
        <p className="text-yellow-300 text-sm font-medium">
          Swipe left/right to navigate • Tap cards for details
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute top-20 left-4 right-4 z-30">
        <div className="relative">
          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          {checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.id || index}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primary shadow-md"
              style={{ 
                left: `${checkpoint.t * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className={`w-1 h-1 rounded-full ${progress >= checkpoint.t ? 'bg-primary' : 'bg-gray-400'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-2 text-white text-xs">
          <span>{Math.round(progress * 100)}%</span>
          <span>{activeIndex + 1} of {checkpoints.length}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-24">
        {/* Current checkpoint card */}
        <div 
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/20 cursor-pointer transform transition-all duration-300 hover:scale-105"
          onClick={() => setSelectedCheckpoint(currentCheckpoint)}
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-sm">
              {activeIndex + 1}
            </div>
            <h3 className="text-white text-xl font-bold mb-3">
              {currentCheckpoint.title}
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">
              {currentCheckpoint.text}
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex space-x-2 mt-8">
          {checkpoints.map((_, index) => (
            <button
              key={index}
              onClick={() => setProgress(checkpoints[index].t)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === activeIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Swipe indicators */}
        <div className="flex items-center justify-between w-full max-w-sm mt-8 text-white/60">
          <div className="flex items-center space-x-1">
            {progress > 0 && (
              <>
                <span className="text-sm">←</span>
                <span className="text-xs">Previous</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {progress < 1 && (
              <>
                <span className="text-xs">Next</span>
                <span className="text-sm">→</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detailed view modal */}
      {selectedCheckpoint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/20 transform scale-100 transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                {checkpoints.findIndex(cp => cp.id === selectedCheckpoint.id) + 1}
              </div>
              <h3 className="text-white text-2xl font-bold mb-4">
                {selectedCheckpoint.title}
              </h3>
              <p className="text-gray-200 text-base leading-relaxed mb-6">
                {selectedCheckpoint.text}
              </p>
              <button
                onClick={() => setSelectedCheckpoint(null)}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Continue Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SR-only list for accessibility */}
      <ol className="sr-only">
        {checkpoints.map((cp, i) => (
          <li key={cp.id ?? i} id={cp.id}>
            <h3>{cp.title}</h3>
            <p>{cp.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}