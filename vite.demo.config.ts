import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fixedPhysicsControlPlugin } from './scripts/fixedPhysicsControlPlugin.mjs';
export default defineConfig({
  root: 'demo', base: './', plugins: [react(), tailwindcss(), fixedPhysicsControlPlugin()],
  optimizeDeps: { exclude: ['mujoco-react'] },
  resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'] },
  build: { outDir: '../.site/demo1', emptyOutDir: true },
});
