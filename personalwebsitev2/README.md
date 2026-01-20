# Vite + React + TypeScript + TailwindCSS + shadcn/ui Starter

A modern frontend boilerplate built with **Vite**, **React**, **TypeScript**, and **TailwindCSS**, styled using [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives + TailwindCSS).  
Includes form handling, validation, data fetching, charts, and other common UI utilities.

---

## Tech Stack

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

## Backend – Spotify & Pokémon TCG

This starter includes a backend that:
- Proxies the **Pokémon TCG API** (cards by ID, search, sets) using your `POKEMON_TCG_API_KEY`.
- Implements **Spotify OAuth 2.0 (Authorization Code)** for login, token refresh, and a sample `/me` profile fetch.
- Uses a **service layer** (`services/pokemonService`) that performs upstream calls with **Axios**.
- Provides simple **response caching** for common endpoints.

---

## How to Run

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

### Backend Setup (Optional)

The backend is required if you want to use Spotify or Pokemon TCG features.

1. Navigate to the server directory:
```bash
cd server
```

2. Install backend dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:8080

# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3001/api/spotify/callback
SPOTIFY_ACCESS_TOKEN=your_access_token
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Pokemon TCG API
POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key
```

4. Start the backend server:
```bash
node server/server.js
```

### Getting API Credentials

#### Spotify API
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Copy your Client ID and Client Secret
4. Add redirect URI to your app settings
5. Use the `/api/spotify/auth` endpoint to get your access and refresh tokens

#### Pokemon TCG API
1. Go to [Pokemon TCG Developer Portal](https://dev.pokemontcg.io/)
2. Sign up for a free API key
3. Add the key to your `.env` file

---
