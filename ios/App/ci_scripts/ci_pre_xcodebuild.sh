#!/bin/sh

# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — exécuté juste avant xcodebuild, donc avant l'archivage.
#
# Aligne le numéro de build sur celui d'Xcode Cloud.
#
# Pourquoi : App Store Connect refuse un binaire dont le couple
# (version, build) existe déjà — « The provided entity includes an attribute
# with a value that has already been used ». Le projet est figé sur
# CURRENT_PROJECT_VERSION = 1 ; sans ce script, seul le tout premier envoi
# aboutit et les suivants échouent après plusieurs minutes de traitement,
# avec un message qui ne pointe pas vers la cause.
#
# $CI_BUILD_NUMBER est fourni par Xcode Cloud et s'incrémente à chaque build,
# ce qui garantit l'unicité sans intervention.
#
# La version affichée aux utilisateurs (MARKETING_VERSION) n'est pas touchée :
# elle se décide à la main, au moment d'une vraie livraison.
# ─────────────────────────────────────────────────────────────────────────────

set -e

if [ -z "$CI_BUILD_NUMBER" ]; then
  echo "──▶ CI_BUILD_NUMBER absent, numéro de build laissé tel quel."
  exit 0
fi

PBXPROJ="$CI_PRIMARY_REPOSITORY_PATH/ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PBXPROJ" ]; then
  echo "✗ project.pbxproj introuvable : $PBXPROJ"
  exit 1
fi

sed -i '' "s/CURRENT_PROJECT_VERSION = .*;/CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER;/g" "$PBXPROJ"

echo "──▶ Numéro de build fixé à $CI_BUILD_NUMBER"
grep -m 2 'CURRENT_PROJECT_VERSION' "$PBXPROJ"
