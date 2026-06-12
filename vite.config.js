import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom plugin to treat .js files as JSX in Vite 8 / Rolldown
const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    const normalizedId = id.replace(/\\/g, '/');
    if (!normalizedId.endsWith('.js') || !normalizedId.includes('/src/')) {
      return null;
    }
    
    return await transformWithOxc(code, id, {
      lang: 'jsx',
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    transformJsxInJs(),
    react(),
    tailwindcss(),
  ],
})
