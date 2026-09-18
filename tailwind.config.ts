import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "var(--s16-space-8)",
      screens: { "2xl": "var(--s16-container)" },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        s16: {
          bg: "var(--s16-color-canvas)",
          "bg-warm": "var(--s16-color-sand)",
          "bg-surface": "var(--s16-color-surface)",
          text: "var(--s16-color-text)",
          "text-muted": "var(--s16-color-text-muted)",
          accent: "var(--s16-color-accent)",
          "accent-dark": "var(--s16-color-accent-text)",
          border: "var(--s16-color-border)",
          "border-light": "var(--s16-color-border-subtle)",
        },
      },
      fontFamily: {
        display: ["var(--s16-font-display)"],
        ui: ["var(--s16-font-label)"],
        body: ["var(--s16-font-body)"],
      },
      borderRadius: {
        lg: "var(--s16-radius-md)",
        md: "var(--s16-radius-sm)",
        sm: "var(--s16-radius-sm)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down var(--s16-duration) var(--s16-ease)",
        "accordion-up": "accordion-up var(--s16-duration) var(--s16-ease)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
