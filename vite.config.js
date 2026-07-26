import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Les notifications push ne sont activées QUE si Firebase est configuré.
// Sans google-services.json (Android) / GoogleService-Info.plist (iOS), appeler
// PushNotifications.register() plante l'app au niveau natif :
//   « Default FirebaseApp is not initialized in this process »
// Ce drapeau est calculé au build : dès que tu déposes le fichier Firebase et
// relances `npm run build:mobile`, les push s'activent toutes seules.
const PUSH_READY =
  fs.existsSync(path.resolve(__dirname, 'android/app/google-services.json')) ||
  fs.existsSync(path.resolve(__dirname, 'ios/App/App/GoogleService-Info.plist'))

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
  define: {
    __PUSH_READY__: JSON.stringify(PUSH_READY),
  },
}))
