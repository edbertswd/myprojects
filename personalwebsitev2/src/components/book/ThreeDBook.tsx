import React, { Suspense, useState, ErrorBoundary } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { Book } from './Book';
import { BookUI } from './BookUI';
import PictureBook from '@/components/PictureBook';

class ThreeErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <PictureBook />;
    }
    return this.props.children;
  }
}

const ThreeDBook = () => {
  const [show3D, setShow3D] = useState(true);

  if (!show3D) {
    return (
      <div className="w-full">
        <PictureBook />
        
        <div className="fixed bottom-4 right-4 z-20">
          <button
            onClick={() => setShow3D(true)}
            className="px-6 py-3 bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm rounded-full text-white transition-all border border-white/20"
          >
            📚 Switch to 3D Book
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* 3D Book */}
        <Book />
        
        <OrbitControls />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <BookUI />
        </div>
      </div>
      
      {/* View toggle button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setShow3D(false)}
          className="px-6 py-3 bg-purple-600/80 hover:bg-purple-700/80 backdrop-blur-sm rounded-full text-white transition-all border border-white/20"
        >
          📖 Switch to 2D Book
        </button>
      </div>
      
      {/* Instructions */}
      <div className="fixed top-4 left-4 z-20 text-white/70 text-sm">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="mb-2">🖱️ Click and drag to rotate</p>
          <p className="mb-2">🔍 Scroll to zoom</p>
          <p>📚 Click pages to turn them</p>
        </div>
      </div>
    </div>
  );
};

export default ThreeDBook;