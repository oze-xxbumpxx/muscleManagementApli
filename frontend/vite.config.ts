import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * GraphQL はバックエンドのルート `/` 。
 * ブラウザは `/graphql` のみ使用し、プロキシで `/` にリライトする（FRONTEND_ARCHITECTURE Q1）。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graphql/, '') || '/',
      },
    },
  },
});
