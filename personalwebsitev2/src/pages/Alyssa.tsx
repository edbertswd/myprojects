import { Suspense, lazy } from 'react';
import { Provider } from 'jotai';
import FloatingLanterns from '@/components/FloatingLanterns';
import '@/styles/rapunzel.css';

// Lazy load the 3D book to isolate potential Three.js errors
const ThreeDBook = lazy(() => import('@/components/book/ThreeDBook'));

const Alyssa = () => {
  return (
    <Provider>
      <div className="rapunzel-page relative overflow-hidden">
        <FloatingLanterns />
        
        <div className="min-h-screen flex items-center justify-center">
          <Suspense fallback={
            <div className="text-center">
              <h1 className="princess-title text-6xl mb-8 text-white drop-shadow-2xl">
                Alyssa's Fairy Tale
              </h1>
              <p className="fairy-script text-3xl text-white/90 drop-shadow-lg mb-12">
                A Magical Story from Jakarta
              </p>
              <div className="text-white/70 text-lg">
                <p>Loading your magical 3D book...</p>
              </div>
            </div>
          }>
            <ThreeDBook />
          </Suspense>
        </div>
      </div>
    </Provider>
  );
};

export default Alyssa;