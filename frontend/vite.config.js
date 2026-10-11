import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:4000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // The rules for new borrowers and lenders, shared with the API.
        '@assess': fileURLToPath(new URL('../backend/src/assess.js', import.meta.url)),
        // The dataset lives with the API; the frontend bundles a copy as an
        // offline fallback.
        '@dataset': fileURLToPath(
          new URL('../backend/data/borrower_listings.json', import.meta.url),
        ),
      },
    },
    server: {
      host: true,
      fs: { allow: ['..'] },
      // In development, /api goes to the Express server in ../backend.
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
  };
});
