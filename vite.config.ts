import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:demo` gera um único HTML (demo/index.html) que abre direto no navegador, sem servidor.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  base: './',
  build: mode === 'demo' ? { outDir: 'demo', emptyOutDir: true } : { outDir: 'dist' },
}));
