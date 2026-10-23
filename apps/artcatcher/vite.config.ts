import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/games/artcatcher/',
    plugins: [react(), tailwindcss()],
    build: {
      outDir: '../../public/games/artcatcher',
      emptyOutDir: true,
      // Three.js ships as one large ESM module; its production chunk is ~141 kB gzip.
      chunkSizeWarningLimit: 600,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'three-vendor',
                test: /node_modules[\\/]three/,
                priority: 20,
              },
              {
                name: 'figurines',
                test: /src[\\/](game[\\/]figurineBuilder|utils[\\/]artTextures)\.ts$/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
