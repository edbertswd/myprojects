import { Color, SRGBColorSpace } from "three";

/**
 * Reads an HSL triplet token (e.g. `--sage: 140 20% 45%`) from :root so
 * 3D materials follow the same design tokens as the CSS.
 */
export function cssHsl(token: string, fallback: string): Color {
  let raw = "";
  if (typeof window !== "undefined") {
    raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }
  const parts = (raw || fallback).replace(/%/g, "").split(/\s+/).map(Number);
  const [h, s, l] = parts.length >= 3 ? parts : fallback.replace(/%/g, "").split(/\s+/).map(Number);
  return new Color().setHSL(h / 360, s / 100, l / 100, SRGBColorSpace);
}

export const palette = {
  sage: () => cssHsl("--sage", "140 20% 45%"),
  primary: () => cssHsl("--primary", "140 25% 40%"),
  primaryDark: () => cssHsl("--primary-dark", "140 30% 28%"),
  slate: () => cssHsl("--slate", "220 15% 20%"),
  cream: () => cssHsl("--cream", "40 20% 97%"),
  softBlue: () => cssHsl("--soft-blue", "210 25% 70%"),
  gold: () => cssHsl("--gold", "45 40% 65%"),
  sky: () => cssHsl("--hero-banner", "195 60% 78%"),
  taupe: () => cssHsl("--taupe", "30 12% 65%"),
};
