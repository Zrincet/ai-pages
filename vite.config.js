import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载 .env 文件
  const env = loadEnv(mode, process.cwd(), '')
  
  // 如果 process.env 中有 VITE_RC4_KEY，使用它覆盖
  const viteRc4Key = process.env.VITE_RC4_KEY || env.VITE_RC4_KEY
  
  return {
    plugins: [vue()],
    define: {
      // 注入环境变量
      'import.meta.env.VITE_RC4_KEY': JSON.stringify(viteRc4Key),
      'import.meta.env.VITE_ESA_DOMAIN': JSON.stringify(env.VITE_ESA_DOMAIN),
    },
  }
})
