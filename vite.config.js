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
// Firebase n'est requis que sur Android : c'est là que l'absence de
// google-services.json fait planter l'application au premier register(). Sur
// iOS, le greffon parle directement à APNs et n'a jamais besoin de Firebase.
const FIREBASE_ANDROID_PRET =
  fs.existsSync(path.resolve(__dirname, 'android/app/google-services.json'))

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
  // Les tests portent sur la logique métier — modération, lisibilité de la
  // carte — qui touche au stockage du navigateur. jsdom fournit localStorage
  // sans qu'il faille le simuler à la main dans chaque fichier.
  test: { environment: 'jsdom' },
  define: {
    __FIREBASE_ANDROID_PRET__: JSON.stringify(FIREBASE_ANDROID_PRET),
  },
}))
