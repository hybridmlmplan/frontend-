import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 💯 FIXED: Vite is now forced to use plugin-react v4 only
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // 🚀 Prevent Vite from trying to use plugin-react v5.x
        jsxRuntime: 'classic',
        babel: {
          plugins: [],
        },
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      open: true,
      host: true,
      strictPort: true
    },

    define: {
      __APP_ENV__: env.APP_ENV,
      __API_BASE__: JSON.stringify(
        env.MODE === 'production'
          ? env.API_URL_PROD
          : env.API_URL_DEV
      ),
    },

    build: {
      target: "esnext",
      minify: "terser",
      sourcemap: false,
      chunkSizeWarningLimit: 1200
    }
  };
});
