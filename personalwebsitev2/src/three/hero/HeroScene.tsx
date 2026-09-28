import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Group, Mesh, Vector3 } from "three";
import SceneCanvas, { useSceneMotion } from "../SceneCanvas";
import { useDomAnchor } from "../hooks/useDomAnchor";
import { usePointerNDC } from "../hooks/usePointerNDC";
import { createTweenScope, ease, type TweenScope } from "../lib/tween";
import { palette } from "../lib/palette";
import Lamp, { LAMP_HEIGHT, type LampHandle } from "./Lamp";
import Avatar from "./Avatar";
import HeroLights from "./HeroLights";
import HeroBackdrop from "./HeroBackdrop";
import { domTVisibleAtom, heroPhaseAtom, isRevealed, lampHoverAtom, type HeroPhase } from "./heroPhase";

/* Tuning ------------------------------------------------------------------ */
/** Lamp height relative to the T's cap height (measured from the real glyph). */
const LAMP_FRACTION = 1.2;

/* ---- manual nudges for the 3D "T" (and where the lamp lands) -------------
 * All values are fractions of the T's cap height, so they scale with the font.
 *   T_OFFSET_Y  positive = move up,   negative = move down
 *   T_OFFSET_X  positive = move right, negative = move left
 *   T_SCALE     1 = same size as the measured glyph
 */
const T_OFFSET_Y = 0;
const T_OFFSET_X = 0;
const T_SCALE = 1;
/** Where the lamp lands before flipping onto the T (multiples of lamp height, to the right). */
const LANDING_OFFSET = 1.15;
/** Model faces +z by default; adjust if the scan is rotated. */
const AVATAR_BASE_YAW = -Math.PI / 2 + 0.3;

type Props = {
  className?: string;
  /** The "T" span in the headline. */
  tRef: RefObject<HTMLElement | null>;
  /** Placeholder box where the avatar should stand. */
  avatarRef: RefObject<HTMLElement | null>;
  /** Section element used as the pointer-event source. */
  sectionRef: RefObject<HTMLElement | null>;
  fallback?: ReactNode;
};

export default function HeroScene({ className, tRef, avatarRef, sectionRef, fallback }: Props) {
  return (
    <SceneCanvas
      className={className}
      fallback={fallback}
      camera={{ fov: 35, position: [0, 1.1, 8.5], near: 0.1, far: 60 }}
      dpr={[1, 1.5]}
      eventSource={sectionRef}
      onCreated={({ gl }) => gl.setClearColor("#000000", 1)}
    >
      <HeroContent tRef={tRef} avatarRef={avatarRef} />
    </SceneCanvas>
  );
}

function HeroContent({ tRef, avatarRef }: Pick<Props, "tRef" | "avatarRef">) {
  const [phase, setPhase] = useAtom(heroPhaseAtom);
  const setDomT = useSetAtom(domTVisibleAtom);
  const hovering = useAtomValue(lampHoverAtom);
  const { reduced } = useSceneMotion();
  const lamp = useRef<LampHandle>(null);
  // Only needs per-frame tracking while the headline's entrance transform
  // could still be moving; once we're flipping onto the T that's long
  // settled, so stop the per-frame getBoundingClientRect reads there.
  const tAnchorLive = phase === "hopping" || phase === "lit" || phase === "revealed";
  const tAnchor = useDomAnchor(tRef, 0, "T", tAnchorLive); 
  const avAnchor = useDomAnchor(avatarRef, 0);
  const pointer = usePointerNDC();
  const [avatarReady, setAvatarReady] = useState(false);
  const onAvatarReady = useCallback(() => setAvatarReady(true), []);

  const phaseRef = useRef<HeroPhase>(phase);
  phaseRef.current = phase;
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __heroPhase?: HeroPhase }).__heroPhase = phase;
  }, [phase]);

  /** 0 = lamp, 1 = letter T (may overshoot slightly during the bounce). */
  const morph = useRef(0);
  const morphScope = useRef<TweenScope | null>(null);

  /** World position + scale for the lamp when it stands on the T's baseline. */
  const tSlot = useCallback(() => {
    const a = tAnchor.current;
    const cap = a.glyphCap || a.height * 0.72;
    const scale = (cap * LAMP_FRACTION) / LAMP_HEIGHT;
    const pos = a.glyphCap ? a.glyphBase.clone() : new Vector3(a.bottomCenter.x, a.bottomCenter.y + a.height * 0.16, 0);
    pos.x += cap * T_OFFSET_X;
    pos.y += cap * T_OFFSET_Y;
    pos.z = 0;
    return { pos, scale };
  }, [tAnchor]);

  /** Same slot, but standing on top of the T's crossbar (where the jump lands). */
  const tTopSlot = useCallback(() => {
    const a = tAnchor.current;
    const cap = a.glyphCap || a.height * 0.72;
    const slot = tSlot();
    const pos = slot.pos.clone();
    pos.y += cap;
    return { pos, scale: slot.scale };
  }, [tAnchor, tSlot]);

  const morphPos = useMemo(() => new Vector3(), []);
  const morphTo = useCallback(
    (target: 0 | 1, duration = 0.55, fromPos?: Vector3, toPos?: Vector3) => {
      morphScope.current?.dispose();
      const scope = createTweenScope();
      morphScope.current = scope;
      const from = morph.current;
      const L = lamp.current;
      if (target === 1) setDomT(false);
      if (target === 0) L?.setLight(1);
      return scope.run({
        duration,
        ease: target === 1 ? ease.outBack : ease.outCubic,
        onUpdate: (t) => {
          morph.current = from + (target - from) * t;
          L?.setMorph(morph.current);
          if (fromPos && toPos) {
            morphPos.lerpVectors(fromPos, toPos, Math.min(Math.max(t, 0), 1));
            L?.setPosition(morphPos);
          }
        },
      }).promise;
    },
    [setDomT, morphPos]
  );

  // ---- choreography ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const scope = createTweenScope();

    const waitFor = (test: () => boolean, ms: number) =>
      new Promise<boolean>((resolve) => {
        const start = performance.now();
        const tick = () => {
          if (cancelled) return resolve(false);
          if (test()) return resolve(true);
          if (performance.now() - start > ms) return resolve(false);
          requestAnimationFrame(tick);
        };
        tick();
      });

    (async () => {
      await waitFor(() => tAnchor.current.ready && !!lamp.current, 4000);
      if (cancelled || !lamp.current) return;
      const L = lamp.current;
      const slot = tSlot();
      // no flat "T" ever exists on its own 
      setDomT(false);

      if (reduced) {
        L.place(slot.pos, slot.scale);
        morph.current = 1;
        L.setMorph(1);
        setDomT(false);
        setPhase("settled");
        return;
      }

      const landing = slot.pos.clone();
      landing.x += LAMP_HEIGHT * slot.scale * LANDING_OFFSET;
      const start = landing.clone();
      start.x += 7;
      L.place(start, slot.scale);
      L.setLight(0);
      setPhase("hopping");

      await scope.wait(0.35).promise;
      if (cancelled) return;
      await L.hopTo(landing, 3);
      if (cancelled) return;
      await scope.wait(0.25).promise;

      setPhase("lit");
      await L.flickerOn();
      if (cancelled) return;
      // give the model a moment to arrive before revealing the stage
      await waitFor(() => avatarReadyRef.current, 2500);
      await scope.wait(0.6).promise;
      if (cancelled) return;

      setPhase("revealed");
      await scope.wait(1.6).promise;
      if (cancelled) return;

      setPhase("flipping");
      await L.backflipTo(tSlot().pos);
      if (cancelled) return;
      // land right on the T's spot and squash flat
      await L.squish();
      if (cancelled) return;
      // ...and become the letter, already in place
      await morphTo(1, 0.6);
      if (cancelled) return;
      setPhase("settled");
    })();

    const lampAtStart = lamp.current;
    return () => {
      cancelled = true;
      scope.dispose();
      morphScope.current?.dispose();
      lampAtStart?.cancelAll();
    };
    // run once per mount (StrictMode re-runs it; everything above resets itself)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Hovering the T wakes the lamp back up; leaving turns it back into the letter
  useEffect(() => {
    if (phase !== "settled") return;
    if (hovering) {
      morphTo(0, 0.45);
      return;
    }
    const id = window.setTimeout(() => morphTo(1, 0.55), 350);
    return () => window.clearTimeout(id);
  }, [hovering, phase, morphTo]);

  const avatarReadyRef = useRef(false);
  avatarReadyRef.current = avatarReady;

  // ---- per-frame: keep the lamp glued to the T when settled; aim head ----
  const aim = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const L = lamp.current;
    if (!L) return;
    const p = phaseRef.current;
    const av = avAnchor.current;
    const pt = pointer.current;

    if (p === "settled") {
      const slot = tSlot();
      L.place(slot.pos, slot.scale);
    }

    if (p === "hopping" || p === "dark") {
      // look ahead-and-down while travelling left
      const slot = tSlot();
      aim.set(slot.pos.x - 2, slot.pos.y - 1.2, 1.5);
    } else if (p === "settled" && pt.active) {
      aim.set(pt.x * 6.5, 1 + pt.y * 3.2, 2.2);
    } else if (av.ready) {
      aim.set(av.center.x, av.center.y + av.height * 0.1, 0.6);
    }
    L.setAim(aim);
  });

  const revealed = isRevealed(phase);

  return (
    <>
      <HeroLights phase={phase} reduced={reduced} />
      <HeroBackdrop revealed={revealed || reduced} />
      <Lamp ref={lamp} />
      <LetterT anchor={tAnchor} morph={morph} />
      {/* the model streams in behind its own boundary so the lamp can start immediately */}
      <Suspense fallback={null}>
        <Avatar anchor={avAnchor} pointer={pointer} visible={revealed} baseYaw={AVATAR_BASE_YAW} onReady={onAvatarReady} />
      </Suspense>
      {/* soft grounding under the avatar; follows the anchor */}
      <AvatarShadow anchor={avAnchor} visible={revealed} />
    </>
  );
}

/**
 * A 3D "T" matching the headline glyph (baseline, cap height and ink width
 * come from canvas text metrics of the real span). Unlit so its colour is
 * exactly the headline's slate; scales with the morph value.
 */
function LetterT({ anchor, morph }: { anchor: ReturnType<typeof useDomAnchor>; morph: RefObject<number> }) {
  const group = useRef<Group>(null);
  const bar = useRef<Mesh>(null);
  const stem = useRef<Mesh>(null);
  const color = useMemo(() => palette.slate(), []);

  useFrame(() => {
    const g = group.current;
    const a = anchor.current;
    if (!g || !a.ready) return;
    const m = morph.current ?? 0;
    const cap = a.glyphCap || a.height * 0.72; // world units
    g.visible = m > 0.001;
    const bx = a.glyphCap ? a.glyphBase.x : a.bottomCenter.x;
    const by = a.glyphCap ? a.glyphBase.y : a.bottomCenter.y + a.height * 0.16;
    g.position.set(bx + cap * T_OFFSET_X, by + cap * T_OFFSET_Y, 0);
    g.scale.setScalar(cap * T_SCALE * Math.max(m, 0.0001));
    // glyph proportions relative to cap height (Raleway ExtraBold "T")
    const w = (a.glyphWidth || a.width * 0.9) / cap;
    if (bar.current) bar.current.scale.set(w, 1, 1);
    if (stem.current) stem.current.scale.set(w * 0.3, 1, 1);
  });

  return (
    <group ref={group} visible={false}>
      {/* stem: 1 unit tall, origin at the baseline */}
      <mesh ref={stem} position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 0.02]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* crossbar */}
      <mesh ref={bar} position={[0, 1 - 0.095, 0]}>
        <boxGeometry args={[1, 0.19, 0.02]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AvatarShadow({ anchor, visible }: { anchor: ReturnType<typeof useDomAnchor>; visible: boolean }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const a = anchor.current;
    if (!ref.current || !a.ready) return;
    ref.current.position.set(a.bottomCenter.x, a.bottomCenter.y + 0.005, 0);
    const s = Math.max(a.height / 3.6, 0.6);
    ref.current.scale.set(s, s, s);
  });
  return (
    <group ref={ref} visible={visible}>
      <ContactShadows opacity={0.4} blur={2.2} far={1.4} scale={2.6} resolution={256} frames={Infinity} color="#33413a" />
    </group>
  );
}
