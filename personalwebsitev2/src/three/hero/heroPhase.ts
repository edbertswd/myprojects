import { atom } from "jotai";

/**
 * dark     – black canvas, nothing visible but a faint lamp silhouette
 * hopping  – lamp hops in from the right and lands beside the headline
 * lit      – the lamp's spotlight flickers on
 * revealed – scene + headline fade in, avatar drops in
 * flipping – lamp backflips into the "T" of EDBERT
 * settled  – idle: lamp + avatar follow the cursor
 */
export type HeroPhase = "dark" | "hopping" | "lit" | "revealed" | "flipping" | "settled";

export const heroPhaseAtom = atom<HeroPhase>("dark");

export const isLit = (p: HeroPhase) => p !== "dark" && p !== "hopping";
export const isRevealed = (p: HeroPhase) => p === "revealed" || p === "flipping" || p === "settled";

/** Whether the DOM "T" glyph is shown (hidden once the 3D letter takes over). */
export const domTVisibleAtom = atom(true);
/** Pointer is over the T — the letter morphs back into the lamp. */
export const lampHoverAtom = atom(false);
