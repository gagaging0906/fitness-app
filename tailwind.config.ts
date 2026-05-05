import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // 背景层级
        base:     "#07090C",
        elevated: "#0E1116",
        overlay:  "#161A21",
        hover:    "#1C2129",
        // 强调色
        accent: {
          DEFAULT: "#00E5FF",
          glow:    "rgba(0,229,255,0.35)",
          soft:    "rgba(0,229,255,0.10)",
        },
        // 语义色
        success: "#4ADE80",
        warning: "#FBBF24",
        danger:  "#F87171",
        info:    "#60A5FA",
        // shadcn tokens
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      fontSize: {
        // 数据英雄字阶
        "data-hero": ["72px", { lineHeight: "1",    letterSpacing: "-0.04em", fontWeight: "800" }],
        "data-xl":   ["48px", { lineHeight: "1",    letterSpacing: "-0.03em", fontWeight: "700" }],
        "data-lg":   ["32px", { lineHeight: "1.1",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "data-md":   ["20px", { lineHeight: "1.2",  letterSpacing: "-0.01em", fontWeight: "600" }],
        // 正文字阶
        "title":     ["22px", { lineHeight: "1.3",  letterSpacing: "-0.02em", fontWeight: "600" }],
        "section":   ["15px", { lineHeight: "1.3",  letterSpacing: "0",       fontWeight: "600" }],
        "body":      ["14px", { lineHeight: "1.5",  letterSpacing: "0",       fontWeight: "400" }],
        "caption":   ["12px", { lineHeight: "1.4",  letterSpacing: "0.02em",  fontWeight: "500" }],
        "micro":     ["11px", { lineHeight: "1.3",  letterSpacing: "0.06em",  fontWeight: "500" }],
      },
      borderRadius: {
        "2xl": "16px",
        xl:    "12px",
        lg:    "var(--radius)",  // 10px
        md:    "8px",
        sm:    "6px",
      },
      boxShadow: {
        "card":       "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 1px 0 0 rgba(0,0,0,0.4)",
        "glow-accent":"0 0 24px -4px rgba(0,229,255,0.4), 0 0 0 1px rgba(0,229,255,0.3)",
        "ring-subtle":"inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #00E5FF 0%, #0EA5E9 100%)",
        "gradient-glow":   "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.12), transparent 60%)",
        "shimmer":         "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both",
        "shimmer":    "shimmer 1.6s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
