# Vite + React + TypeScript + TailwindCSS + shadcn/ui Starter

A modern frontend boilerplate built with **Vite**, **React**, **TypeScript**, and **TailwindCSS**, styled using [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives + TailwindCSS).  
Includes form handling, validation, data fetching, charts, and other common UI utilities.

---

## 🚀 Tech Stack

### Core
- **[Vite](https://vitejs.dev/)** – Fast dev server & build tool
- **[React](https://react.dev/)** – Component-based UI library
- **[TypeScript](https://www.typescriptlang.org/)** – Strongly typed JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** – Prebuilt UI components using Radix UI + Tailwind

### UI & Components
- **[Radix UI](https://www.radix-ui.com/)** – Accessible UI primitives (`@radix-ui/react-*`)
- **[lucide-react](https://lucide.dev/)** – Icon set
- **[embla-carousel-react](https://www.embla-carousel.com/)** – Carousel/slider
- **[react-day-picker](https://react-day-picker.js.org/)** – Date picker
- **[react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)** – Resizable split panels
- **[cmdk](https://cmdk.paco.me/)** – Command palette UI
- **[recharts](https://recharts.org/)** – Charting library
- **[sonner](https://sonner.emilkowal.ski/)** – Toast notifications
- **[vaul](https://vaul.emilkowal.ski/)** – Drawer/sheet component
- **[tailwindcss-animate](https://tailwindcss-animate.vercel.app/)** – Animation utilities for Tailwind

### Forms & Validation
- **[react-hook-form](https://react-hook-form.com/)** – Form state management
- **[zod](https://zod.dev/)** – Schema validation
- **[@hookform/resolvers](https://react-hook-form.com/api/useform/resolvers)** – Integrates Zod with react-hook-form
- **[input-otp](https://input-otp.dev/)** – OTP input field

### Data Fetching & State
- **[@tanstack/react-query](https://tanstack.com/query/latest)** – Server state management
- **[date-fns](https://date-fns.org/)** – Date utilities

### Theming
- **[next-themes](https://github.com/pacocoursey/next-themes)** – Theme toggling (dark/light/system)

---

## 🛠 Development Tools

- **[TypeScript ESLint](https://typescript-eslint.io/)** – Linting for TypeScript
- **[ESLint](https://eslint.org/)** + plugins (`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
- **[PostCSS](https://postcss.org/)** + **Autoprefixer**
- **[@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)** – Prose styling
- **[tailwind-merge](https://tailwind-merge.vercel.app/)** – Class merging utility
- **clsx** – Conditional class names
- **class-variance-authority** – Variants for component styles

---

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
