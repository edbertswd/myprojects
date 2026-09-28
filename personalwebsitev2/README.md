# Edbert Suwandi — Portfolio (v2)

Personal portfolio built with **React 19**, **TypeScript**, **Vite 7**, **Tailwind CSS 4** and **Three.js** via
**React Three Fiber**. Real-time 3D scenes are woven into a light, glass-and-sage design system.

## Highlights

- **Hero** — a procedural Pixar-style lamp hops in, flickers its spotlight on and reveals a 3D scan of me
  (`me.glb`, meshopt-compressed), then backflips into the "T" of *EDBERT*. Lamp and avatar follow the cursor.
- **Journey** — a scroll-driven 3D road trip: wheel (or swipe on mobile) drives a low-poly car past
  clickable milestone signs. Instanced skyline, trees and clouds with parallax.
- **Experience** — timeline of work + projects with a floating 3D "toolbox" cloud of every skill.
- **Testimonials / Hobbies** — glass cards; Hobbies pulls live Spotify and Pokémon TCG data from the backend.
- Graceful fallbacks: no WebGL → static imagery; `prefers-reduced-motion` → intro skipped; scenes pause off-screen.

## Stack

| Area | Tech |
|---|---|
| UI | React 19, TypeScript, Vite 7, Tailwind CSS 4 (`@tailwindcss/vite`), shadcn/ui (Radix), lucide-react |
| Motion | `motion` (Motion One / Framer Motion successor) for DOM, custom rAF tweens + `maath` for 3D |
| 3D | three, `@react-three/fiber` 9, `@react-three/drei` 10 |
| Data | TanStack Query, jotai |
| Routing | react-router 7 |
| Backend | Express (`server/`) proxying Spotify + Pokémon TCG APIs |

## Project layout

```
src/
  components/      page sections (Hero, Journey, Experience, Testimonials, Hobbies, Footer, Navigation)
  components/ui/   shadcn primitives + SectionHeader, GlassCard
  data/            journey checkpoints, experience, testimonials
  hooks/           useMediaQuery, useScrollHijack
  three/           SceneCanvas (shared Canvas wrapper), hooks, lib, hero/, journey/, experience/
  index.css        design tokens + Tailwind theme + custom utilities (glass, grain, display type)
3d/                source scan (not served) + compression command
public/models/     web-ready me.glb (~0.8 MB)
server/            Express API
```

## Running locally

Requires **Node 22.12+**.

```bash
npm install
npm run dev          # http://localhost:8080  (proxies /api → http://localhost:3001)
npm run typecheck
npm run lint
npm run build && npm run preview
```

### Backend (optional — powers the Hobbies section)

```bash
cd server && npm install
# create server/.env — see server/.env.example
npm run dev          # http://localhost:3001
```

Without the backend the Hobbies section shows an "offline" state.

## Model pipeline

The avatar is generated from `3d/me.glb` with gltf-transform (meshopt + simplification + WebP textures).
See `3d/README.md` for the exact command.

## Design notes

- Colour tokens live in `src/index.css` as HSL triplets (`--sage`, `--cream`, …) and are mirrored into the
  Tailwind theme (`bg-sage`, `text-slate`, …) and into 3D materials via `src/three/lib/palette.ts`.
- Each 3D section owns its own `<Canvas>` through `SceneCanvas`, which handles WebGL detection,
  error boundaries, reduced motion and pausing when off-screen.
