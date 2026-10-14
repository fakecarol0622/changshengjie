import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 长生劫 · 单文件构建配置：dist/index.html 双击即玩
export default defineConfig({
  plugins: [vue(), tailwindcss(), viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true }
    }
  }
})
