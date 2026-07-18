import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// En mode "demo", on remplace le client Supabase par un mock à données réalistes
// pour capturer les vrais composants de l'app sans backend (screenshots du site).
function mockSupabasePlugin() {
  const mock = path.resolve(__dirname, 'src/demo/mockSupabase.js')
  return {
    name: 'mock-supabase',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || importer.includes('/demo/')) return null
      if (source.endsWith('/supabase') || source.endsWith('/supabase.js')) return mock
      return null
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'demo' ? [mockSupabasePlugin()] : [])],
}))
