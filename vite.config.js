import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 🚀 Complete & Optimized Vite Config for Hybrid-MLM Frontend
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    server: {
      port: 5173,
      open: true,
      host: true,
      strictPort: true,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },

    // 🌍 Auto API Switching
    define: {
      __APP_ENV__: env.APP_ENV,
      __API_BASE__: JSON.stringify(
        env.MODE === 'production'
          ? env.API_URL_PROD // Example: https://mlm-api.com
          : env.API_URL_DEV  // Example: http://localhost:4000
      ),
    },

    css: {
      devSourcemap: true,
    },

    // ⚡ Production Build Optimized for Large MLM Network Apps
    build: {
      target: "esnext",
      minify: "terser",
      sourcemap: false,
      chunkSizeWarningLimit: 1200,

      rollupOptions: {
        output: {
          // 📌 Auto Split Major Panels into separate bundles
          manualChunks: {
            dashboard: ["@pages/Dashboard", "@components/dashboard"],
            auth: ["@pages/Login", "@pages/Signup"],
            admin: ["@pages/admin", "@components/admin"],
            franchise: ["@pages/franchise", "@components/franchise"],
            binary: ["@pages/BinaryTree", "@components/binary"],
            wallet: ["@pages/wallet", "@components/wallet"],
          },

          entryFileNames: `assets/js/[name]-[hash].js`,
          chunkFileNames: `assets/js/[name]-[hash].js`,
          assetFileNames: `assets/[ext]/[name]-[hash].[ext]`,
        },
      },
    },
  };
});
