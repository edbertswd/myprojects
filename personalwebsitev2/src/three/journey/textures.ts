import { CanvasTexture, LinearFilter, LinearMipMapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

/** Small deterministic PRNG so instanced layouts are stable between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Procedural asphalt: dark base with fine speckle. */
export function makeAsphaltTexture(size = 256): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#3a3d43";
  ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(7);
  for (let i = 0; i < size * 22; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const v = 40 + Math.floor(rnd() * 60);
    ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.35 + rnd() * 0.5})`;
    ctx.fillRect(x, y, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipMapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

/** Vertical sky gradient. */
export function makeSkyTexture(top: string, horizon: string, bottom: string): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top);
  g.addColorStop(0.62, horizon);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
