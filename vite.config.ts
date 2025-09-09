import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        const extension = format === 'es' ? 'mjs' : 'js';
        return `index.${extension}`;
      },
    },
    rollupOptions: {
      external: ['axios', 'cheerio'],
    },
    sourcemap: false,
    minify: false,
    target: 'node16',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});