import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        portfolio: {
          orange: "hsl(var(--portfolio-orange))",
          "orange-light": "hsl(var(--portfolio-orange-light))",
          cream: "hsl(var(--portfolio-cream))",
          gray: "hsl(var(--portfolio-gray))",
          dark: "hsl(var(--portfolio-dark))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "pokemon-green-500": "hsl(140 60% 45%)",
        "pokemon-green-700": "hsl(140 60% 30%)",
        "pokemon-gold-400": "hsl(46 95% 55%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
		"flight-distance": {
			"0%":   { offsetDistance: "0%" },
			"100%": { offsetDistance: "100%" },
		},
		"wing-flap": {
			"0%, 100%": { transform: "translateY(0) rotate(0deg) scale(1)" },
			"25%":      { transform: "translateY(-1px) rotate(1deg) scale(1.02)" },
			"50%":      { transform: "translateY(0) rotate(0deg) scale(1)" },
			"75%":      { transform: "translateY(1px) rotate(-1deg) scale(0.98)" },
		},
		"bird-across": {
			"0%":   { transform: "translate3d(-15vw, 45vh, 0) rotate(6deg)" },
			"10%":  { transform: "translate3d(-5vw, 43vh, 0) rotate(3deg)" },
			"20%":  { transform: "translate3d(8vw, 42vh, 0) rotate(0deg)" },
			"30%":  { transform: "translate3d(22vw, 46vh, 0) rotate(5deg)" },
			"40%":  { transform: "translate3d(36vw, 52vh, 0) rotate(8deg)" },
			"50%":  { transform: "translate3d(50vw, 59vh, 0) rotate(10deg)" },
			"60%":  { transform: "translate3d(65vw, 66vh, 0) rotate(8deg)" },
			"70%":  { transform: "translate3d(80vw, 73vh, 0) rotate(6deg)" },
			"80%":  { transform: "translate3d(95vw, 80vh, 0) rotate(4deg)" },
			"90%":  { transform: "translate3d(108vw, 84vh, 0) rotate(2deg)" },
			"100%": { transform: "translate3d(115vw, 88vh, 0) rotate(0deg)" },
		},
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
		"fly-horizontal": "fly-horizontal 10s cubic-bezier(0.77, 0, 0.175, 1) infinite",
		"bird-flight": "flight-distance 12s linear infinite",
    	"wing-flap": "wing-flap 0.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
      },
      backgroundImage: {
        "gradient-warm": "var(--gradient-warm)",
        "gradient-orange": "var(--gradient-orange)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
      },
      transitionTimingFunction: {
        smooth: "var(--transition-smooth)",
        spring: "var(--transition-spring)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
