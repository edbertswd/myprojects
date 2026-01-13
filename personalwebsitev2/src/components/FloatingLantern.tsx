import { useEffect, useState } from 'react';

interface Lantern {
  id: number;
  x: number;
  y: number;
  size: number;
  animationDuration: number;
  delay: number;
}

const FloatingLanterns = () => {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);

  useEffect(() => {
    const generateLanterns = () => {
      const newLanterns: Lantern[] = [];
      
      for (let i = 0; i < 15; i++) {
        newLanterns.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 8 + 4, // 4-12px
          animationDuration: Math.random() * 3 + 2, // 2-5s
          delay: Math.random() * 2,
        });
      }
      
      setLanterns(newLanterns);
    };

    generateLanterns();
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {lanterns.map((lantern) => (
        <div
          key={lantern.id}
          className="lantern"
          style={{
            left: `${lantern.x}%`,
            top: `${lantern.y}%`,
            width: `${lantern.size}px`,
            height: `${lantern.size}px`,
            animationDuration: `${lantern.animationDuration}s`,
            animationDelay: `${lantern.delay}s`,
          }}
        />
      ))}
      
      {/* Additional magical sparkles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-secondary rounded-full animate-sparkle opacity-60" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-accent rounded-full animate-sparkle opacity-80" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary-glow rounded-full animate-sparkle opacity-40" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-secondary rounded-full animate-sparkle opacity-70" style={{ animationDelay: '1.5s' }} />
    </div>
  );
};

export default FloatingLanterns;