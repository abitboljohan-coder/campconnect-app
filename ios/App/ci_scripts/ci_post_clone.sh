#!/bin/sh

# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — script exécuté juste après le clone du dépôt.
#
# Pourquoi il est indispensable : Xcode Cloud clone le repo puis lance
# xcodebuild directement. Or `dist/` et `ios/App/App/public/` sont gitignorés —
# le bundle web n'existe donc pas dans le clone. Sans ce script, le build
# réussit et produit une app qui s'ouvre sur un écran blanc.
#
# On reconstitue ici ce que fait `npm run build:mobile` en local :
#   npm ci → vite build → cap sync ios
#
# Variables d'environnement à déclarer dans le workflow Xcode Cloud
# (App Store Connect → Xcode Cloud → Workflow → Environment) :
#   VITE_SUPABASE_URL       ex. https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY  clé « anon public » (publique, pas un secret)
# Sans elles, l'app se lance sur « Configuration manquante ».
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "──▶ Racine du dépôt : $CI_PRIMARY_REPOSITORY_PATH"
cd "$CI_PRIMARY_REPOSITORY_PATH"

# ── 1. Node ──────────────────────────────────────────────────────────────────
# Les images Xcode Cloud n'embarquent pas Node. Homebrew, lui, est préinstallé.
if ! command -v node > /dev/null 2>&1; then
  echo "──▶ Installation de Node via Homebrew"
  export HOMEBREW_NO_AUTO_UPDATE=1
  export HOMEBREW_NO_INSTALL_CLEANUP=1
  brew install node
else
  echo "──▶ Node déjà présent"
fi
echo "──▶ node $(node -v) / npm $(npm -v)"

# ── 2. Variables d'environnement Vite ────────────────────────────────────────
# Vite lit les variables VITE_* depuis process.env, mais on écrit quand même le
# fichier .env : c'est déterministe et ça rend le build reproductible en local.
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "✗ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquante."
  echo "  Déclare-les dans les réglages du workflow Xcode Cloud."
  exit 1
fi

cat > .env <<EOF
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
EOF
echo "──▶ .env écrit"

# ── 3. Dépendances ───────────────────────────────────────────────────────────
echo "──▶ npm ci"
npm ci

# ── 4. Build web + synchronisation iOS ───────────────────────────────────────
# `cap sync ios` plutôt que `cap sync` : inutile de toucher à la plateforme
# Android sur un runner qui n'a pas le SDK Android.
echo "──▶ vite build"
npx vite build

echo "──▶ cap sync ios"
npx cap sync ios

# ── 5. Vérification ──────────────────────────────────────────────────────────
# Le garde-fou qui aurait évité l'écran blanc silencieux.
if [ ! -f "ios/App/App/public/index.html" ]; then
  echo "✗ ios/App/App/public/index.html absent : la copie Capacitor a échoué."
  exit 1
fi
echo "──▶ Bundle web en place ($(find ios/App/App/public -type f | wc -l | tr -d ' ') fichiers)"

# Rappel : GoogleService-Info.plist est gitignoré, donc absent du clone.
# __PUSH_READY__ vaut false et l'enregistrement push est désactivé — c'est
# volontaire tant que la voie APNs iOS n'est pas implémentée.

echo "──▶ ci_post_clone terminé"
