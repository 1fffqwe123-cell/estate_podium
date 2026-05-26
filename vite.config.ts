import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const WORKERS_API = 'https://estate-api.iraq-estate.workers.dev';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: WORKERS_API,
          changeOrigin: true,
          secure: true,
        },
        '/uploads': {
          target: WORKERS_API,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
