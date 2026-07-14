# Scripts SQL — CampConnect

## `full_migration.sql`
Migration complète pour un nouveau projet Supabase. À jouer une seule fois.

**Ordre à suivre si tu recrées un projet :**

1. Nouveau projet sur [supabase.com](https://supabase.com/dashboard) → note l'URL et l'`anon key`
2. **SQL Editor** → copie-colle `full_migration.sql` → **Run**
3. **Authentication → Users → Add user** :
   - Email : `gerant@les-pins-verts.fr`
   - Password : `PinsVerts2026!`
4. **SQL Editor** → joue le bloc INSERT gérant commenté en bas du script
5. Mettre à jour les env vars :
   - `.env.local` (dev) → `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
   - Vercel Dashboard → Settings → Environment Variables → mêmes clés
6. `git push` (ou redéployer sur Vercel) → l'app pointe sur le nouveau projet

## Autres fichiers (historiques)
- `seed_demo.sql` — vieux seed « Camping Les Pins Dorés » (remplacé par le seed du migration)
- `setup_device.sql` — ajout colonne `device_id` (déjà inclus dans migration)
- `setup_map_utf8.sql` — ajout colonne `carte_config` (déjà inclus, ce fichier est corrompu de toute façon)

Une fois `full_migration.sql` joué avec succès, ces trois fichiers peuvent être supprimés.
