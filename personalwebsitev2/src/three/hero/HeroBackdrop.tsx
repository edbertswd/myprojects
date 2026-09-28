import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MeshBasicMaterial } from "three";
import { makeSkyTexture } from "../journey/textures";
import { Clouds, Skyline } from "../journey/scenery";
import { createTweenScope, ease } from "../lib/tween";

/** Colour at the top edge of the journey view — the hero's sky ends on it so the two sections read as one. */
export const SEAM_COLOR = "#addcea";

/**
 * Sky + skyline behind the hero: the same instanced city as the journey
 * section, sunk below the floor so only the towers rise into the frame.
 * Fades in with the reveal (the stage stays black before that).
 */
export default function HeroBackdrop({ revealed }: { revealed: boolean }) {
  const group = useRef<Group>(null);
  const skyMat = useRef<MeshBasicMaterial>(null);
  const skyTex = useMemo(() => makeSkyTexture("#f6f4ee", "#d8ecf3", SEAM_COLOR), []);
  const fade = useRef(0);

  useEffect(() => {
    const scope = createTweenScope();
    const from = fade.current;
    scope.run({
      duration: revealed ? 1.3 : 0.3,
      ease: ease.inOutSine,
      onUpdate: (t) => {
        fade.current = from + ((revealed ? 1 : 0) - from) * t;
      },
    });
    return () => scope.dispose();
  }, [revealed]);

  useFrame(() => {
    const f = fade.current;
    if (group.current) group.current.visible = f > 0.001;
    if (skyMat.current) skyMat.current.opacity = f;
  });

  return (
    <group ref={group} visible={false}>
      {/* sky: cream at the top of the page → seam blue at the bottom */}
      <mesh position={[0, 2, -40]}>
        <planeGeometry args={[220, 70]} />
        <meshBasicMaterial ref={skyMat} map={skyTex} transparent opacity={0} depthWrite={false} fog={false} />
      </mesh>
      <fog attach="fog" args={[SEAM_COLOR, 16, 46]} />
      {/* towers rise from below the frame */}
      <Skyline seed={3} count={70} z={-20} spread={70} xStart={-34} hMin={5} hMax={16} baseY={-13} depth={8} color="#b9cbd8" />
      <Skyline seed={11} count={40} z={-13} spread={60} xStart={-30} hMin={2} hMax={8} baseY={-10.5} depth={4} color="#c8d6cd" />
      <Clouds count={10} yMin={-2} ySpan={7} zMin={-24} zSpan={14} opacity={0.9} />
    </group>
  );
}
