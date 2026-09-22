import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useThree, type CanvasProps } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import { useSceneVisibility } from "./hooks/useSceneVisibility";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type SceneMotion = { reduced: boolean };
const SceneMotionContext = createContext<SceneMotion>({ reduced: false });
/** Inside a scene: whether to skip choreography and snap to the end state. */
export const useSceneMotion = () => useContext(SceneMotionContext);

function useWebGLSupport() {
  return useMemo(() => {
    if (typeof document === "undefined") return false;
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  }, []);
}

/** Kick one render when the scene becomes visible again (demand loops). */
function InvalidateOnVisible({ visible }: { visible: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (visible) invalidate();
  }, [visible, invalidate]);
  return null;
}

export type SceneCanvasProps = {
  children: ReactNode;
  className?: string;
  /** Rendered when WebGL is unavailable or the scene crashes. */
  fallback?: ReactNode;
  shadows?: boolean;
  dpr?: [number, number];
  camera?: CanvasProps["camera"];
  frameloop?: "always" | "demand";
  /** Element that should receive pointer events for raycasting (e.g. the section). */
  eventSource?: RefObject<HTMLElement | null>;
  gl?: CanvasProps["gl"];
  onCreated?: CanvasProps["onCreated"];
  style?: React.CSSProperties;
};

/**
 * Shared Canvas wrapper: pauses when off-screen, degrades gracefully without
 * WebGL, exposes reduced-motion to the scene, and code-splits nothing itself
 * (callers lazy-load heavy scenes).
 */
export default function SceneCanvas({
  children,
  className,
  fallback = null,
  shadows = false,
  dpr = [1, 1.5],
  camera,
  frameloop = "always",
  eventSource,
  gl,
  onCreated,
  style,
}: SceneCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const visible = useSceneVisibility(wrapRef);
  const reduced = useReducedMotion();
  const webgl = useWebGLSupport();
  const [lost, setLost] = useState(false);

  const motionValue = useMemo(() => ({ reduced }), [reduced]);

  if (!webgl || lost) {
    return (
      <div ref={wrapRef} className={cn("relative", className)} style={style}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)} style={style}>
      <ErrorBoundary fallback={<>{fallback}</>}>
        <Canvas
          dpr={dpr}
          shadows={shadows}
          camera={camera}
          frameloop={visible ? frameloop : "never"}
          eventSource={eventSource as RefObject<HTMLElement> | undefined}
          eventPrefix="client"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            ...(typeof gl === "object" ? gl : {}),
          }}
          onCreated={(state) => {
            state.gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              setLost(true);
            });
            onCreated?.(state);
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          <SceneMotionContext.Provider value={motionValue}>
            <Suspense fallback={null}>
              {children}
              <Preload all />
            </Suspense>
            <AdaptiveDpr />
            <InvalidateOnVisible visible={visible} />
          </SceneMotionContext.Provider>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
