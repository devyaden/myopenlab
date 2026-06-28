import type { Config } from "tailwindcss";

const config = {
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
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        // Atlas faces
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        arabic: ["var(--font-arabic)", "var(--font-body)", "sans-serif"],
        // Back-compat aliases (legacy classes now adopt the Atlas faces)
        quicksand: ["var(--font-body)", "system-ui", "sans-serif"],
        rubik: ["var(--font-arabic)", "sans-serif"],
        lato: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        dark_background: "#8f8f8f",
        light_background: "hsla(0, 0%, 0%, 0.25)",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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

        // ── Atlas semantic colors ──
        signal: {
          DEFAULT: "hsl(var(--signal))",
          hover: "hsl(var(--signal-hover))",
          bright: "hsl(var(--signal-bright))",
          tint: "hsl(var(--signal-tint))",
          foreground: "hsl(var(--primary-foreground))",
        },
        attention: {
          DEFAULT: "hsl(var(--attention))",
          text: "hsl(var(--attention-text))",
          tint: "hsl(var(--attention-tint))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          tint: "hsl(var(--danger-tint))",
        },
        info: "hsl(var(--info))",
        ink: "hsl(var(--ink))",
        "muted-ink": "hsl(var(--muted-ink))",
        "faint-ink": "hsl(var(--faint-ink))",
        hairline: "hsl(var(--hairline))",
        paper: "hsl(var(--paper))",
        surface: "hsl(var(--surface))",
        code: {
          bg: "hsl(var(--code-bg))",
          text: "hsl(var(--code-text))",
        },

        // ── Legacy YADN palette, remapped onto Atlas (keys kept for back-compat) ──
        yadn: {
          // marketing accents (revisited in Step 6) — kept as-is for now
          pink: "#E91E63",
          "pink-light": "#FFE6EF",
          "pink-dark": "#C2185B",
          "gradient-pink-from": "#D92AA5",
          "gardient-pink-to": "#FA6CD0",
          "dark-background": "#252525",
          "accent-blue": "#5DA9E9",
          "accent-dark-blue": "#003F91",
          "accent-pink": "#F7B2AD",
          "accent-yellow": "#FFF0EA",
          "accent-dark-orange": "#FF4A1C",
          background: "rgb(0, 10, 31)",
          foreground: "rgb(243, 243, 243)",
          // workspace colors → Atlas tokens
          "button-blue": "hsl(var(--signal))",
          "primary-text": "hsl(var(--ink))",
          "primary-green": "hsl(var(--signal))",
          "primary-red": "hsl(var(--danger))",
          "primary-gray": "hsl(var(--secondary))",
          "secondary-gray": "hsl(var(--muted))",
          "dark-gray": "hsl(var(--muted-ink))",
          // Primary-action teal: must carry white text at AA (5.1:1) in BOTH themes,
          // so it uses --signal-solid (deep teal, theme-invariant), NOT the brighter
          // --signal/--signal-bright which are for accents/"live" marks.
          "accent-green": "hsl(var(--signal-solid))",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
      },
      boxShadow: {
        "atlas-sm": "var(--shadow-sm)",
        "atlas-md": "var(--shadow-md)",
        "atlas-lg": "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        menu: "var(--duration-menu)",
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
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        progress: {
          "0%": { width: "0%" },
          "40%": { width: "40%" },
          "60%": { width: "60%" },
          "80%": { width: "80%" },
          "100%": { width: "0%" },
        },
        pulse: {
          "0%": { opacity: "0.4", transform: "translateX(-100%)" },
          "50%": { opacity: "0.6", transform: "translateX(0)" },
          "100%": { opacity: "0.4", transform: "translateX(100%)" },
        },
        shine: {
          "100%": { left: "125%", transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        progress: "progress 2s ease-in-out infinite",
        pulse: "pulse 4s ease-in-out infinite",
        shine: "shine 1.5s ease-in-out",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-in-out",
        "slide-down": "slideDown 0.5s ease-in-out",
        "slide-left": "slideLeft 0.5s ease-in-out",
        "slide-right": "slideRight 0.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
