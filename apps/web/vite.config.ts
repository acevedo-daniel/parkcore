import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), 'VITE_');

  if (mode === 'production' && !environment.VITE_API_URL?.trim()) {
    throw new Error('VITE_API_URL is required for production builds.');
  }

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      sourcemap: false,
    },
    plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
  };
});
