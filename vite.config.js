import { defineConfig } from 'vite';

export default defineConfig(() => ({
    base: "https://axeljaeger.github.io/interactive-canvas/",
    build: {
      target: "ES2022"
    },
  })
);