import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Version statique (mise en ligne sans serveur) : chemins relatifs + routeur par ancre (#/app).
const relativeAssets: Plugin = {
  name: 'nxt-relative-assets',
  enforce: 'pre',
  transform(code, id) {
    if (!/\/src\/.*\.(t|j)sx?$/.test(id.replaceAll('\\', '/'))) return
    return code.replace(/(["'`])\/(img|research)\//g, '$1./$2/')
  },
}

export default defineConfig(({ mode }) => {
  const STATIC = mode === 'static'
  return {
  base: STATIC ? './' : '/',
  plugins: [react(), ...(STATIC ? [relativeAssets] : [])],
  build: STATIC ? { outDir: 'dist-static' } : undefined,
  server: { fs: { allow: ['..'] }, proxy: { '/api': { target: 'http://127.0.0.1:5318', changeOrigin: true } } },
  preview: { proxy: { '/api': { target: 'http://127.0.0.1:5318', changeOrigin: true } } },
  }
})
