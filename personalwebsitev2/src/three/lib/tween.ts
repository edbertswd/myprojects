/**
 * Minimal rAF tween used to drive Object3D properties through refs.
 * No React re-renders, cancellable, promise-based so choreography can be
 * written as `await hop(); await flicker();`.
 */

export type EaseFn = (t: number) => number;

export const ease = {
  linear: ((t) => t) as EaseFn,
  inQuad: ((t) => t * t) as EaseFn,
  outQuad: ((t) => 1 - (1 - t) * (1 - t)) as EaseFn,
  inOutQuad: ((t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)) as EaseFn,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as EaseFn,
  inCubic: ((t) => t * t * t) as EaseFn,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as EaseFn,
  outBack: ((t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }) as EaseFn,
  outElastic: ((t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  }) as EaseFn,
  inOutSine: ((t) => -(Math.cos(Math.PI * t) - 1) / 2) as EaseFn,
};

export type TweenOptions = {
  duration: number; // seconds
  ease?: EaseFn;
  delay?: number;
  /** Called with eased progress 0..1 */
  onUpdate: (t: number) => void;
  onComplete?: () => void;
};

export type TweenHandle = {
  promise: Promise<void>;
  cancel: () => void;
};

/** Registry so a component can cancel everything on unmount (StrictMode safe). */
export function createTweenScope() {
  const active = new Set<TweenHandle>();
  let disposed = false;

  const run = (opts: TweenOptions): TweenHandle => {
    let raf = 0;
    let cancelled = false;
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));

    const handle: TweenHandle = {
      promise,
      cancel: () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        active.delete(handle);
        resolve();
      },
    };

    if (disposed) {
      handle.cancel();
      return handle;
    }

    const easing = opts.ease ?? ease.outCubic;
    const startAt = performance.now() + (opts.delay ?? 0) * 1000;
    const durMs = Math.max(opts.duration, 0.0001) * 1000;

    const step = (now: number) => {
      if (cancelled) return;
      const raw = Math.min(Math.max((now - startAt) / durMs, 0), 1);
      opts.onUpdate(easing(raw));
      if (raw < 1) {
        raf = requestAnimationFrame(step);
      } else {
        active.delete(handle);
        opts.onComplete?.();
        resolve();
      }
    };

    active.add(handle);
    raf = requestAnimationFrame(step);
    return handle;
  };

  const wait = (seconds: number): TweenHandle =>
    run({ duration: seconds, ease: ease.linear, onUpdate: () => {} });

  const dispose = () => {
    disposed = true;
    for (const h of Array.from(active)) h.cancel();
    active.clear();
  };

  return { run, wait, dispose, get disposed() { return disposed; } };
}

export type TweenScope = ReturnType<typeof createTweenScope>;

/** Piecewise-linear keyframe sampler: values[] at times[] (0..1). */
export function sampleKeyframes(values: number[], times: number[], t: number) {
  if (t <= times[0]) return values[0];
  for (let i = 1; i < times.length; i++) {
    if (t <= times[i]) {
      const span = times[i] - times[i - 1] || 1e-6;
      const k = (t - times[i - 1]) / span;
      return values[i - 1] + (values[i] - values[i - 1]) * k;
    }
  }
  return values[values.length - 1];
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
