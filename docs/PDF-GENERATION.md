# 📄 CampConnect — PDF Prospection

PDF marketing 2 pages pour envoyer aux directeurs de campings.

## Génération

```bash
npm run generate:pdf
```

Le PDF est généré dans `docs/campconnect-prospection.pdf`.

**Taille :** ~207 KB (optimal pour email)

## Customization

### Modifier le contenu
- Éditer `scripts/pdf-template.html` (titre, description, contact, etc.)
- Relancer `npm run generate:pdf`

### Modifier les couleurs
Changer les couleurs dans le `<style>` du template :
- `#0d1f0d` → Vert foncé principal
- `#639922` → Vert principal
- `#97C459` → Vert clair

### Ajouter une image/logo
Remplacer le texte `<div class="logo">Camp<span>Connect</span></div>` par une vraie image SVG ou PNG.

## Utilisation

1. Télécharger le PDF depuis `docs/campconnect-prospection.pdf`
2. Joindre à l'email de prospection
3. Insérer un lien tracked si besoin (Calendly, Pipedrive, etc.)

## Notes

- Le PDF est optimisé pour l'impression ET l'email
- Format A4, 2 pages
- Pas de dépendance externe (puppeteer inclus en devDep)
