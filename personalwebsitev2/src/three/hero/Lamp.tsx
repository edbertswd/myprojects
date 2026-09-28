import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SpotLight as ThreeSpotLight,
  Vector3,
} from "three";
import { damp3 } from "maath/easing";
import {
  createTweenScope,
  ease,
  sampleKeyframes,
  lerp,
  type TweenScope,
} from "../lib/tween";
import { palette } from "../lib/palette";

/** Height of the lamp in local units when standing straight (base → top of head). */
export const LAMP_HEIGHT = 1.85;
const COM_Y = 0.95; // centre of mass, pivot for the backflip

export type LampHandle = {
  /** Instantly place the lamp (world position, uniform scale). */
  place: (position: Vector3, scale: number) => void;
  /** Move the root without touching scale/squash/rotation (e.g. sinking into the morph). */
  setPosition: (position: Vector3) => void;
  /** Hop to a world position in `hops` bounces. Resolves when landed. */
  hopTo: (target: Vector3, hops?: number) => Promise<void>;
  /** Flicker the light on. Resolves when steady. */
  flickerOn: () => Promise<void>;
  /** Backflip to a world position (the "T" slot). */
  backflipTo: (target: Vector3) => Promise<void>;
  /** Squash flat on landing, then settle — the impact before morphing into the T. */
  squish: () => Promise<void>;
  /** Set light level 0..1 immediately. */
  setLight: (v: number) => void;
  /** World point the head should look at (damped). */
  setAim: (target: Vector3) => void;
  /** Stop every running tween. */
  cancelAll: () => void;
  /** Current uniform scale. */
  getScale: () => number;
  /** 0 = full lamp, 1 = fully morphed away (hidden). Scales the lamp down. */
  setMorph: (m: number) => void;
};

type LampProps = {
  /** Scale applied to the whole lamp; can be updated later via `place`. */
  scale?: number;
  /** Max spotlight intensity (candela). */
  spotIntensity?: number;
};

const CONE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const CONE_FRAG = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // uv.y = 1 at the apex (lamp head), 0 at the far, wide end
    float along = pow(vUv.y, 1.6);
    float a = along * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

const Lamp = forwardRef<LampHandle, LampProps>(function Lamp(
  { scale = 1, spotIntensity = 140 },
  ref,
) {
  const root = useRef<Group>(null);
  const flip = useRef<Group>(null);
  const squash = useRef<Group>(null);
  const hip = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  const head = useRef<Group>(null);
  const spot = useRef<ThreeSpotLight>(null);
  const bulbMat = useRef<MeshStandardMaterial>(null);
  const innerMat = useRef<MeshStandardMaterial>(null);

  const state = useRef({
    light: 0, // 0..1 — bulb/spot/room glow
    beam: 0, // 0..1 — the visible cone; flashes ahead of `light` on power-up
    aim: new Vector3(0, -3, 3),
    aimCurrent: new Vector3(0, -3, 3),
    aimFrozen: false,
    scale,
    landed: false,
    morph: 0,
    placed: false,
  });

  const scope = useRef<TweenScope>(createTweenScope());
  useEffect(() => {
    scope.current = createTweenScope();
    return () => scope.current.dispose();
  }, []);

  const target = useMemo(() => new Object3D(), []);
  useEffect(() => {
    if (spot.current) spot.current.target = target;
  }, [target]);

  const colors = useMemo(
    () => ({
      metal: palette.slate(),
      hinge: new Color("#4a5160"),
      shade: new Color("#eadfc6"),
      inner: new Color("#fff5dc"),
      bulb: new Color("#fff1c9"),
      light: new Color("#fff0c8"),
    }),
    [],
  );

  const coneUniforms = useMemo(
    () => ({
      uIntensity: { value: 0 },
      uColor: { value: colors.light.clone() },
    }),
    [colors],
  );

  // ---- imperative API ---------------------------------------------------

  /** Root scale = placed scale × (1 − morph); hidden until placed. */
  const applyScale = () => {
    const r = root.current;
    if (!r) return;
    const st = state.current;
    const k = st.scale * Math.max(0, 1 - st.morph);
    r.scale.setScalar(Math.max(k, 1e-4));
    r.visible = st.placed && st.morph < 0.995;
  };

  const setSquash = (sx: number, sy: number) => {
    squash.current?.scale.set(sx, sy, sx);
  };

  const flightArc = (
    from: Vector3,
    to: Vector3,
    height: number,
    t: number,
    out: Vector3,
  ) => {
    out.lerpVectors(from, to, t);
    out.y += 4 * height * t * (1 - t);
    return out;
  };

  useImperativeHandle(
    ref,
    () => {
      const hopSegment = async (
        to: Vector3,
        height: number,
        duration: number,
      ) => {
        const r = root.current!;
        const from = r.position.clone();
        const tmp = new Vector3();
        const dir = Math.sign(to.x - from.x) || -1; // -1 = travelling left
        const sc = scope.current;

        // crouch
        await sc.run({
          duration: 0.11,
          ease: ease.outQuad,
          onUpdate: (t) => setSquash(lerp(1, 1.12, t), lerp(1, 0.8, t)),
        }).promise;
        // flight
        await sc.run({
          duration,
          ease: ease.linear,
          onUpdate: (t) => {
            flightArc(from, to, height, t, tmp);
            r.position.copy(tmp);
            const air = Math.sin(Math.PI * t);
            setSquash(lerp(1.12, 0.94, air), lerp(0.8, 1.14, air));
            if (hip.current) hip.current.rotation.z = -dir * 0.28 * air;
            if (elbow.current) elbow.current.rotation.z = dir * 0.45 * air;
          },
        }).promise;
        r.position.copy(to);
        // land squash + recover
        await sc.run({
          duration: 0.08,
          ease: ease.outQuad,
          onUpdate: (t) => setSquash(lerp(0.94, 1.2, t), lerp(1.14, 0.76, t)),
        }).promise;
        await sc.run({
          duration: 0.26,
          ease: ease.outBack,
          onUpdate: (t) => {
            setSquash(lerp(1.2, 1, t), lerp(0.76, 1, t));
            if (hip.current)
              hip.current.rotation.z = lerp(hip.current.rotation.z, 0, t);
            if (elbow.current)
              elbow.current.rotation.z = lerp(elbow.current.rotation.z, 0, t);
          },
        }).promise;
      };

      return {
        place: (position, s) => {
          state.current.scale = s;
          state.current.placed = true;
          if (root.current) root.current.position.copy(position);
          if (flip.current) flip.current.rotation.z = 0;
          setSquash(1, 1);
          applyScale();
        },
        setPosition: (position) => {
          root.current?.position.copy(position);
        },
        setMorph: (m) => {
          state.current.morph = Math.min(Math.max(m, 0), 1);
          applyScale();
        },
        hopTo: async (to, hops = 3) => {
          const r = root.current;
          if (!r) return;
          const s = state.current.scale;
          const from = r.position.clone();
          const heights = [1.35, 0.85, 0.45].map((h) => h * s);
          const durations = [0.5, 0.4, 0.32];
          for (let i = 0; i < hops; i++) {
            if (scope.current.disposed) return;
            const k = (i + 1) / hops;
            // ease the horizontal spacing so the last hop is short
            const eased = 1 - Math.pow(1 - k, 1.6);
            const seg = from.clone().lerp(to, eased);
            seg.y = to.y;
            await hopSegment(
              seg,
              heights[Math.min(i, heights.length - 1)],
              durations[Math.min(i, durations.length - 1)],
            );
          }
          r.position.copy(to);
          state.current.landed = true;
        },
        flickerOn: async () => {
          const sc = scope.current;
          // a thin beam shoots out first, ahead of the bulb/room glow
          await sc.run({
            duration: 0.14,
            ease: ease.outQuad,
            onUpdate: (t) => {
              state.current.beam = t;
            },
          }).promise;
          await sc.wait(0.1).promise;
          // ...then the bulb catches up and everything lights up
          const values = [0, 0.9, 0.08, 0.7, 0.05, 1, 0.35, 1];
          const times = [0, 0.1, 0.18, 0.3, 0.42, 0.55, 0.7, 1];
          await sc.run({
            duration: 0.95,
            ease: ease.linear,
            onUpdate: (t) => {
              state.current.light = sampleKeyframes(values, times, t);
              state.current.beam = state.current.light;
            },
          }).promise;
          state.current.light = 1;
          state.current.beam = 1;
        },
        backflipTo: async (to) => {
          const r = root.current;
          const f = flip.current;
          if (!r || !f) return;
          const sc = scope.current;
          const from = r.position.clone();
          const tmp = new Vector3();
          const height = 1.7 * state.current.scale;
          state.current.aimFrozen = true;

          await sc.run({
            duration: 0.16,
            ease: ease.outQuad,
            onUpdate: (t) => setSquash(lerp(1, 1.16, t), lerp(1, 0.74, t)),
          }).promise;
          await sc.run({
            duration: 0.9,
            ease: ease.linear,
            onUpdate: (t) => {
              const p = ease.inOutSine(t);
              flightArc(from, to, height, p, tmp);
              r.position.copy(tmp);
              // full backwards rotation around the centre of mass
              f.rotation.z = -Math.PI * 2 * ease.inOutCubic(t);
              const air = Math.sin(Math.PI * t);
              setSquash(lerp(1.16, 0.9, air), lerp(0.74, 1.18, air));
              if (elbow.current) elbow.current.rotation.z = -0.9 * air;
              if (hip.current) hip.current.rotation.z = 0.35 * air;
            },
          }).promise;
          r.position.copy(to);
          f.rotation.z = 0;
          // settle the flight's pre-landing squash back to neutral so the
          // curious little test-hops that follow start from a clean pose
          await sc.run({
            duration: 0.18,
            ease: ease.outBack,
            onUpdate: (t) => setSquash(lerp(1.16, 1, t), lerp(0.74, 1, t)),
          }).promise;
        },
        squish: async () => {
          const sc = scope.current;
          // hard flat impact
          await sc.run({
            duration: 0.09,
            ease: ease.outQuad,
            onUpdate: (t) => setSquash(lerp(1, 1.32, t), lerp(1, 0.58, t)),
          }).promise;
          // hold the contact frame briefly
          await sc.wait(0.07).promise;
          // one smooth release back to normal
          await sc.run({
            duration: 0.26,
            ease: ease.outBack,
            onUpdate: (t) => setSquash(lerp(1.32, 1, t), lerp(0.58, 1, t)),
          }).promise;
          state.current.aimFrozen = false;
        },
        setLight: (v) => {
          state.current.light = v;
          state.current.beam = v;
        },
        setAim: (t) => {
          state.current.aim.copy(t);
        },
        cancelAll: () => {
          scope.current.dispose();
          scope.current = createTweenScope();
        },
        getScale: () => state.current.scale,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---- per-frame: light level + head aim --------------------------------

  const tmpQ = useMemo(() => new Quaternion(), []);
  const parentQ = useMemo(() => new Quaternion(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const wp = useMemo(() => new Vector3(), []);

  useFrame((_, dt) => {
    const st = state.current;
    const l = st.light;
    if (spot.current) spot.current.intensity = l * spotIntensity;
    if (bulbMat.current) bulbMat.current.emissiveIntensity = 0.12 + l * 3.2;
    if (innerMat.current) innerMat.current.emissiveIntensity = l * 1.6;
    coneUniforms.uIntensity.value = st.beam * 0.7;

    const h = head.current;
    if (h && !st.aimFrozen) {
      damp3(st.aimCurrent, st.aim, 0.22, dt);
      h.getWorldPosition(wp);
      dummy.position.copy(wp);
      dummy.lookAt(st.aimCurrent);
      h.parent!.getWorldQuaternion(parentQ);
      tmpQ.copy(parentQ).invert().multiply(dummy.quaternion);
      h.quaternion.slerp(tmpQ, 1 - Math.exp(-9 * dt));
    }
  });

  return (
    <group ref={root} scale={scale} position={[60, 0, 0]} visible={false}>
      <group ref={flip} position={[0, COM_Y, 0]}>
        <group ref={squash} position={[0, -COM_Y, 0]}>
          {/* base */}
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.56, 0.11, 40]} />
            <meshStandardMaterial
              color={colors.metal}
              metalness={0.55}
              roughness={0.42}
            />
          </mesh>
          <mesh position={[0, 0.115, 0]}>
            <cylinderGeometry args={[0.2, 0.26, 0.06, 24]} />
            <meshStandardMaterial
              color={colors.hinge}
              metalness={0.6}
              roughness={0.35}
            />
          </mesh>

          {/* hip hinge + lower arm */}
          <group ref={hip} position={[0, 0.13, 0]}>
            <mesh>
              <sphereGeometry args={[0.12, 20, 20]} />
              <meshStandardMaterial
                color={colors.hinge}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0.425, 0]} castShadow>
              <cylinderGeometry args={[0.075, 0.085, 0.85, 20]} />
              <meshStandardMaterial
                color={colors.metal}
                metalness={0.55}
                roughness={0.4}
              />
            </mesh>

            {/* elbow + upper arm */}
            <group ref={elbow} position={[0, 0.85, 0]}>
              <mesh>
                <sphereGeometry args={[0.11, 20, 20]} />
                <meshStandardMaterial
                  color={colors.hinge}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.065, 0.075, 0.8, 20]} />
                <meshStandardMaterial
                  color={colors.metal}
                  metalness={0.55}
                  roughness={0.4}
                />
              </mesh>

              {/* neck hinge + head (looks along +z) */}
              <group position={[0, 0.8, 0]}>
                <mesh>
                  <sphereGeometry args={[0.12, 20, 20]} />
                  <meshStandardMaterial
                    color={colors.hinge}
                    metalness={0.7}
                    roughness={0.3}
                  />
                </mesh>
                <group ref={head}>
                  {/* collar */}
                  <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.12, 0.15, 0.16, 20]} />
                    <meshStandardMaterial
                      color={colors.hinge}
                      metalness={0.6}
                      roughness={0.35}
                    />
                  </mesh>
                  {/* shade — apex at the collar, opening toward +z */}
                  <mesh
                    position={[0, 0, 0.38]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    castShadow
                  >
                    <coneGeometry args={[0.46, 0.6, 40, 1, true]} />
                    <meshStandardMaterial
                      color={colors.shade}
                      metalness={0.25}
                      roughness={0.5}
                      side={DoubleSide}
                    />
                  </mesh>
                  {/* glowing interior */}
                  <mesh
                    position={[0, 0, 0.375]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <coneGeometry args={[0.43, 0.58, 40, 1, true]} />
                    <meshStandardMaterial
                      ref={innerMat}
                      color={colors.inner}
                      emissive={colors.inner}
                      emissiveIntensity={0}
                      side={DoubleSide}
                      roughness={0.9}
                    />
                  </mesh>
                  {/* bulb */}
                  <mesh position={[0, 0, 0.32]}>
                    <sphereGeometry args={[0.14, 20, 20]} />
                    <meshStandardMaterial
                      ref={bulbMat}
                      color={colors.bulb}
                      emissive={colors.bulb}
                      emissiveIntensity={0.12}
                      roughness={0.6}
                    />
                  </mesh>
                  {/* light */}
                  <spotLight
                    ref={spot}
                    position={[0, 0, 0.35]}
                    color={colors.light}
                    intensity={0}
                    angle={0.52}
                    penumbra={0.65}
                    decay={1.7}
                    distance={0}
                  />
                  <primitive object={target} position={[0, 0, 5]} />
                  {/* visible beam */}
                  <mesh
                    position={[0, 0, 3.6]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    renderOrder={10}
                  >
                    <coneGeometry args={[2.4, 6.6, 48, 1, true]} />
                    <shaderMaterial
                      vertexShader={CONE_VERT}
                      fragmentShader={CONE_FRAG}
                      uniforms={coneUniforms}
                      transparent
                      depthWrite={false}
                      blending={AdditiveBlending}
                      side={DoubleSide}
                    />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});

export default Lamp;
