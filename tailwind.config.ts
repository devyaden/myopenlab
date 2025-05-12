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
        quicksand: ["var(--font-quicksand)"],
        rubik: ["var(--font-rubik)"],
        lato: ["Lato", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // add background: #6B6B6B;

        dark_background: "#8f8f8f",
        light_background: "hsla(0, 0%, 0%, 0.25);",

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
          DEFAULT: "#E8E8E8",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        yadn: {
          pink: "#E91E63",
          "pink-light": "#FFE6EF",
          "pink-dark": "#C2185B",
          "gradient-pink-from": "#D92AA5",
          "gardient-pink-to": "#FA6CD0",
          "dark-background": "#252525",
          "button-blue": "#3C41C2",
          "primary-text": "#344054",
          "primary-green": "#34C759",
          "primary-red": "#FF3B30",
          "primary-gray": "#F3F3F3",
          "secondary-gray": "#F9FAFB",
          "dark-gray": "#98A2B3",
          "accent-green": "#09BC8A",
          "accent-blue": "#5DA9E9",
          "accent-dark-blue": "#003F91",
          "accent-pink": "#F7B2AD",
          "accent-yellow": "#FFF0EA",
          "accent-dark-orange": "#FF4A1C",

          background: "rgb( 0, 10, 31)",
          foreground: "rgb(243, 243, 243)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
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
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
