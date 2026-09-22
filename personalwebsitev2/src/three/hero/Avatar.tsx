import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { damp } from "maath/easing";
import type { WorldAnchor } from "../lib/domToWorld";
import type { PointerNDC } from "../hooks/usePointerNDC";
import { createTweenScope, ease } from "../lib/tween";

export const AVATAR_URL = "/models/me.glb";
useGLTF.preload(AVATAR_URL, false, true);

type AvatarProps = {
  /** DOM placeholder mapped to world space — the avatar stands on its bottom edge. */
  anchor: MutableRefObject<WorldAnchor>;
  pointer: MutableRefObject<PointerNDC>;
  /** Whether the avatar should be on stage (drops in when this turns true). */
  visible: boolean;
  /** Extra yaw so the model faces the camera (tune per asset). */
  baseYaw?: number;
  /** Fraction of the anchor height the avatar should fill. */
  fill?: number;
  onReady?: () => void;
};

export default function Avatar({ anchor, pointer, visible, baseYaw = 0, fill = 0.92, onReady }: AvatarProps) {
  const { scene } = useGLTF(AVATAR_URL, false, true);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const bounds = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center, minY: box.min.y };
  }, [scene]);

  // Materials: shadows + slightly matte
  useEffect(() => {
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) {
        const m = o as Mesh;
        m.castShadow = true;
        m.receiveShadow = false;
        const mat = m.material as MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 0.5;
      }
    });
    onReady?.();
  }, [scene, onReady]);

  // Drop-in animation
  const pop = useRef(0); // 0 hidden → 1 shown
  useEffect(() => {
    if (!visible) return;
    const scope = createTweenScope();
    scope.run({ duration: 0.75, ease: ease.outBack, onUpdate: (t) => (pop.current = t) });
    return () => scope.dispose();
  }, [visible]);

  const targetScale = useRef(1);

  useFrame(({ clock }, dt) => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const a = anchor.current;
    if (!a.ready) return;

    const desired = (a.height * fill) / (bounds.size.y || 1);
    targetScale.current = desired;
    const p = pop.current;
    const s = desired * Math.max(p, 0.0001);
    o.scale.setScalar(s);
    o.position.set(a.bottomCenter.x, a.bottomCenter.y, 0);
    o.visible = p > 0.001;

    // yaw toward the pointer, gentle idle sway + float
    const pt = pointer.current;
    const yawTarget = baseYaw + (pt.active ? pt.x * 0.38 : Math.sin(clock.elapsedTime * 0.35) * 0.12);
    damp(o.rotation, "y", yawTarget, 0.3, dt);
    damp(o.rotation, "x", pt.active ? -pt.y * 0.08 : 0, 0.4, dt);
    i.position.y = -bounds.minY + Math.sin(clock.elapsedTime * 1.25) * 0.012 * bounds.size.y;
  });

  return (
    <group ref={outer} visible={false}>
      <group ref={inner} position={[-bounds.center.x, -bounds.minY, -bounds.center.z]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
