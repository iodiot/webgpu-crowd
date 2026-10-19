import { defineConfig } from 'vite';

// GitHub Pages serves the project at https://<user>.github.io/webgpu-crowd/
export default defineConfig({
  base: '/webgpu-crowd/',
  build: { target: 'es2022' },
});
