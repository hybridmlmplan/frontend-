/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // 🔥 Binary Red/Green Pair Logic
        pairRed: "#ff4d4d",
        pairGreen: "#2ecc71",

        // 🌟 Rank Colors (All Silver/Gold/Ruby Rank Levels)
        rank: {
          star: "#ffd700",
          silverStar: "#c0c0c0",
          goldStar: "#ffcc00",
          rubyStar: "#e0115f",
          emeraldStar: "#50c878",
          diamondStar: "#b9f2ff",
          crownStar: "#8a2be2",
          ambassadorStar: "#ff7f50",
          companyStar: "#1abc9c",
        },

        // 💰 Wallet + Income Indicators
        income: {
          binary: "#00c851",
          royalty: "#9733ee",
          level: "#4285f4",
          fund: "#ff8800",
        },

        // 🧩 Franchise theme
        franchise: {
          primary: "#0066ff",
          secondary: "#00ccff",
          highlight: "#0047b3",
        },

        // 🟦 Package Cards
        package: {
          silver: "#c0c0c0",
          gold: "#ffd700",
          ruby: "#9b111e",
        },
      },

      // ⚡ Animations (Binary Node Pulse + Rank Glow)
      keyframes: {
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 10px #ff4d4d" },
          "50%": { boxShadow: "0 0 20px #ff1a1a" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 10px #2ecc71" },
          "50%": { boxShadow: "0 0 20px #00cc44" },
        },
        glowRank: {
          "0%": { opacity: "0.8" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.8" },
        },
      },

      animation: {
        pulseRed: "pulseRed 1.5s infinite",
        pulseGreen: "pulseGreen 1.5s infinite",
        glowRank: "glowRank 2s infinite",
      },

      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.08)",
        strong: "0 4px 20px rgba(0,0,0,0.15)",
      },

      fontFamily: {
        primary: ["Inter", "sans-serif"],
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
