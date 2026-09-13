import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ToastHost } from './components/Toast.jsx'
import { getAppMode, initNative } from './native.js'

initNative()

const isAdmin = getAppMode() === 'gerant'

/**
 * Les deux applications sont chargées à la demande, et jamais ensemble.
 *
 * Elles étaient toutes deux importées statiquement : chaque vacancier
 * téléchargeait et analysait la console du gérant — ses neuf écrans, l'éditeur
 * de carte, l'éditeur de périmètre — pour ne jamais l'ouvrir. Sur le réseau
 * d'un camping, cela se paie en secondes d'attente devant l'écran de
 * démarrage.
 *
 * Le mode est connu dès le premier instant, avant tout rendu : on ne charge
 * donc que la moitié qui sert. L'attente du fragment reste couverte par
 * l'écran de démarrage du document, que `retirerSplash` efface une fois
 * l'application prête — d'où le repli à `null`, qui ne fait rien clignoter.
 */
// Point d'entrée de l'application, jamais rechargé à chaud comme un module de
// composant : la règle Fast Refresh n'a pas d'objet ici.
// eslint-disable-next-line react-refresh/only-export-components
const Application = lazy(() => (isAdmin
  ? import('./admin/AdminApp.jsx')
  : import('./App.jsx')))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Application />
      </Suspense>
      <ToastHost />
    </ErrorBoundary>
  </StrictMode>,
)
