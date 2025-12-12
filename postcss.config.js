// postcss.config.js
// Production-ready PostCSS config for a Vite + TailwindCSS React project.
// Place this file in the project root (same folder as package.json).
// It runs Tailwind and Autoprefixer. For aggressive production minification,
// uncomment cssnano and install it (npm i -D cssnano).

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Optional: enable cssnano in production for extra minification
    // 'cssnano': process.env.NODE_ENV === 'production' ? { preset: 'default' } : false,
  },
};
