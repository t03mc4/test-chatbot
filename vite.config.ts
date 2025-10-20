import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/widget.ts', import.meta.url)),
      name: 'TutkuAIChatbot',
      fileName: 'tutku-chatbot-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        assetFileNames: 'tutku-chatbot-widget.[ext]',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: true,
  },
})
