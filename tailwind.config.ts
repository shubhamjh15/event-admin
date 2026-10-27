import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial "Pink City" palette — flat colour blocks, no gradients.
        paper: { DEFAULT: "#FAF6EF", 2: "#F2EADC", 3: "#E9DEC9" },
        ink: { DEFAULT: "#16130F", soft: "#3D362D", mute: "#766B5D" },
        rani: { DEFAULT: "#D61F69", deep: "#A8134F" },
        marigold: { DEFAULT: "#F3AE00", deep: "#D99A00" },
        peacock: { DEFAULT: "#0C5A5C", deep: "#08403F" },
        vermilion: "#E04E2A",
        // Legacy names used by the admin panel, mapped onto the new palette.
        ivory: { DEFAULT: "#FAF6EF", deep: "#F2EADC" },
        gold: { DEFAULT: "#B8893B", light: "#E5C98F", dark: "#8C6726" },
        rose: { DEFAULT: "#D61F69", light: "#F27BAA" },
        saffron: { DEFAULT: "#F3AE00", light: "#FFD466" },
        violet: { DEFAULT: "#5B3E8C", light: "#A58BD1" },
        teal: { DEFAULT: "#0C5A5C", light: "#6FB7B4" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        lit: "linear-gradient(#D61F69,#D61F69)",
        "lit-cool": "linear-gradient(#0C5A5C,#0C5A5C)",
      },
      boxShadow: {
        lux: "0 1px 0 rgba(22,19,15,.04), 0 24px 48px -32px rgba(22,19,15,.35)",
        glow: "none",
      },
      letterSpacing: { label: "0.22em" },
      keyframes: {
        "slow-zoom": { "0%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        scrollcue: { "0%": { transform: "scaleY(0)", transformOrigin: "top" }, "50%": { transform: "scaleY(1)", transformOrigin: "top" }, "51%": { transformOrigin: "bottom" }, "100%": { transform: "scaleY(0)", transformOrigin: "bottom" } },
      },
      animation: {
        "slow-zoom": "slow-zoom 9s cubic-bezier(.2,.6,.2,1) forwards",
        float: "float 4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        scrollcue: "scrollcue 2.4s cubic-bezier(.6,0,.2,1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
