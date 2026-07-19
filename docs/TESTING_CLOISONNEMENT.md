# Validation du Cloisonnement Vacanciers par Camping

## Résumé

CampConnect isole les données de chaque camping grâce à:
1. **Auth anonyme** : chaque navigateur = un `user_id` unique dans Supabase Auth
2. **RLS (Row Level Security)** : chaque requête est filtrée serveur par `camping_id`
3. **Frontend** : les requêtes incluent `.eq('camping_id', campingData.id)`

Résultat : camping B ne peut jamais voir les vacanciers de camping A, même en forçant l'API.

---

## 1. Tester le Cloisonnement en Direct

### Prérequis
- 2 campings **différents** dans Supabase (slugs différents)
- 2 navigateurs/profils différents (ou fenêtres privées)

### Étapes

**Camping A — Navigateur 1 (Chrome Normal)**

1. Ouvrir https://app.campconnect.fr/join/camping-a
2. Remplir le formulaire onboarding :
   - Pseudo : `Alice`
   - Camping : `camping-a` (choisi)
3. Cliquer "Rejoindre"
4. Une fois connectée, ouvrir la console DevTools (`F12` → `Console`)
5. Exécuter :
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('User ID (Alice):', session.user.id)
   ```
   → Copier le user_id résultant (ex: `1234-abcd-5678-efgh`)

6. Vérifier les vacanciers visibles :
   ```javascript
   const { data } = await supabase.from('vacanciers').select('*')
   console.log('Vacanciers visibles pour Alice:', data)
   ```
   → Doit afficher UNIQUEMENT Alice (camping_id = camping-a)

**Camping B — Navigateur 2 (Fenêtre Privée)**

1. Ouvrir https://app.campconnect.fr/join/camping-b en mode incognito
2. Remplir le formulaire onboarding :
   - Pseudo : `Bob`
   - Camping : `camping-b` (choisi)
3. Console DevTools :
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   console.log('User ID (Bob):', session.user.id)
   ```
   → Bob a un user_id DIFFÉRENT d'Alice ✓

4. Vérifier l'isolation :
   ```javascript
   const { data } = await supabase.from('vacanciers').select('*')
   console.log('Vacanciers visibles pour Bob:', data)
   ```
   → Doit afficher UNIQUEMENT Bob (camping_id = camping-b) ✓

### Résultat Attendu ✅

| Navigateur | Pseudo | camping_id  | Vacanciers vus | RLS Impact |
|-----------|--------|-------------|----------------|-----------|
| 1 (Alice) | Alice  | camping-a   | Alice seulement | Alice ne voit pas Bob |
| 2 (Bob)   | Bob    | camping-b   | Bob seulement   | Bob ne voit pas Alice |

Si Bob voit Alice → **RLS ne fonctionne pas** → vérifier `cloisonnement_rls.sql`.

---

## 2. Test Avancé : Tentative de Contournement API

**Bob essaie de tricher** (depuis sa console, camping-b) :

```javascript
// Tenter de lire les vacanciers de camping-a EN DIRECT
const campingAId = '12345678-1234-1234-1234-123456789012' // UUID de camping-a
const { data, error } = await supabase
  .from('vacanciers')
  .select('*')
  .eq('camping_id', campingAId)  // ← Essayer de forcer camping-a

console.log('Data:', data)
console.log('Error:', error?.message)
```

**Résultat attendu** : 
- `data` = `[]` (vide)
- **PAS d'erreur** — Supabase retourne silencieusement `[]` grâce à la RLS
- Bob ne sait même pas que camping-a existe

Si Bob voit les vacanciers de camping-a → **FAILLE CRITIQUE** ⚠️

---

## 3. Vérifier les JWT et Cloisonnement

Supabase stocke l'info du camping dans le **JWT token** (optionnel, mais recommandé).

### Dans la console (Alice, camping-a) :

```javascript
const { data: { session } } = await supabase.auth.getSession()
const token = session.access_token
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('JWT payload:', payload)
```

Chercher `camping_id` dans le payload. Idéal : `{ camping_id: "uuid-de-camping-a", ... }`

Si absent → pas grave, la RLS s'enforce côté DB quand même.

---

## 4. Inspecter les Politiques RLS

**Via SQL Supabase (dashboard → SQL Editor)** :

```sql
SELECT policyname, tablename, qual
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('vacanciers', 'groupes', 'messages')
  ORDER BY tablename, policyname;
```

Doit afficher des policies contenant `camping_id = my_camping_id()`.

**Vérifier qu'une policy spécifique fonctionne** :

```sql
SELECT * FROM pg_policies WHERE policyname LIKE 'vac_select%';
```

Chercher: `USING (user_id = (SELECT auth.uid()) OR camping_id = my_camping_id() OR is_gerant(camping_id))`

---

## 5. Reset des Données Vacanciers (Préservation Gérants)

### Cas d'usage
- ✅ Tester avec des données de démo
- ✅ Nettoyer après des tests manuels
- ❌ **Ne pas utiliser en production** (supprime les vrais vacanciers)

### Script SQL

Exécuter dans **Supabase SQL Editor** (avec soin ⚠️) :

```sql
-- ════════════════════════════════════════════════════════════════════
-- RESET VACANCIERS (préserve gérants + campings + animations + groupes)
-- ════════════════════════════════════════════════════════════════════

-- Option 1 : Supprimer TOUS les vacanciers (utile après tests)
BEGIN;

  -- Cascades automatiques (ON DELETE CASCADE) suppriment aussi:
  -- - inscriptions
  -- - membres_groupes
  -- - messages (via groupe → vacancier)
  -- - statuts
  -- - positions
  DELETE FROM vacanciers;

  -- Vérification
  SELECT COUNT(*) as vacanciers_restants FROM vacanciers;
  SELECT COUNT(*) as gerants_preserves FROM gerants;  -- doit être > 0

COMMIT;
```

### Option 2 : Reset Sélectif (Camping Spécifique)

```sql
-- Supprimer vacanciers d'UN camping uniquement (ex: camping-a)
BEGIN;

  DELETE FROM vacanciers 
    WHERE camping_id = (
      SELECT id FROM campings WHERE slug = 'camping-a'
    );

  -- Verif
  SELECT COUNT(*) FROM vacanciers WHERE camping_id = (
    SELECT id FROM campings WHERE slug = 'camping-a'
  );

COMMIT;
```

### Option 3 : Reset par Date (ex: Données d'aujourd'hui)

```sql
-- Utile si vous générés des données de test avec dates similaires
BEGIN;

  DELETE FROM vacanciers
    WHERE created_at >= NOW()::date
      AND created_at < (NOW()::date + interval '1 day');

  SELECT COUNT(*) FROM vacanciers WHERE created_at >= NOW()::date;

COMMIT;
```

### Vérification Post-Reset

```sql
-- 1. Vacanciers = 0
SELECT COUNT(*) as vacanciers FROM vacanciers;

-- 2. Gérants intacts
SELECT COUNT(*) as gerants, camping_id FROM gerants GROUP BY camping_id;

-- 3. Campings intacts
SELECT COUNT(*) as campings FROM campings;

-- 4. Animations intacts (pour le gérant à tester)
SELECT COUNT(*) as animations FROM animations;

-- 5. Groupes intacts
SELECT COUNT(*) as groupes FROM groupes;
```

---

## 6. Workflow Complet : Test + Reset

### 1️⃣ Avant Test
```sql
-- Enregistrer état initial
SELECT COUNT(*) as vacanciers_avant FROM vacanciers;
SELECT COUNT(*) as gerants FROM gerants;
```

### 2️⃣ Tester (sections 1-4 ci-dessus)
- Créer Alice (camping-a)
- Créer Bob (camping-b)
- Vérifier isolation
- Essayer contournement API

### 3️⃣ Après Test
```sql
-- Nettoyer
DELETE FROM vacanciers;

-- Vérifier
SELECT COUNT(*) FROM vacanciers;  -- 0
SELECT COUNT(*) FROM gerants;      -- > 0
```

---

## 7. Checklist d'Audit RLS

- [ ] Anonymous sign-ins activés (Supabase Auth → Providers)
- [ ] `cloisonnement_rls.sql` appliqué (Supabase SQL Editor)
- [ ] Fonction `my_camping_id()` existe et retourne le bon camping
- [ ] Policies présentes : `vac_select`, `grp_select`, `msg_select`, etc.
- [ ] 2 tests validés : Alice ne voit pas Bob, Bob ne voit pas Alice
- [ ] Tentative contournement échoue (retour `[]` vide)
- [ ] JWT optionnel mais vérifiable

---

## 8. Troubleshooting

### Problème : Alice voit Bob
```
❌ RLS ne fonctionne pas
→ Vérifier: 
   1. cloisonnement_rls.sql exécuté?
   2. RLS activée sur les tables? 
      SELECT COUNT(*) FROM pg_tables 
        WHERE schemaname='public' 
          AND rowsecurity=true;
   3. Fonction my_camping_id() fonctionne?
      SELECT my_camping_id() -- doit retourner UUID du camping d'Alice
```

### Problème : Erreur permission denied
```
❌ Trop restrictif
→ Vérifier:
   1. Role 'authenticated' a SELECT, INSERT, UPDATE, DELETE?
      SELECT * FROM information_schema.role_table_grants 
        WHERE grantee='authenticated' AND table_name='vacanciers';
   2. Politique trop stricte?
      Voir ROLLBACK section dans cloisonnement_rls.sql
```

### Problème : Fonction `my_camping_id()` retourne NULL
```
❌ Vacancier pas trouvé par user_id
→ Vérifier:
   1. user_id enregistré dans vacanciers?
      SELECT id, user_id FROM vacanciers LIMIT 1;
   2. Auth user_id == vacancier.user_id?
      SELECT (SELECT auth.uid()) as auth_uid, 
             (SELECT user_id FROM vacanciers LIMIT 1) as vac_uid;
```

---

## Conclusion

✅ **Cloisonnement actif** = camping B ne peut jamais lire camping A, peu importe ce qu'il essaie.

💡 **N'oublie pas** :
- Tester AVANT de lancer en prod
- Reset après chaque cycle de test
- Garder ≥1 gérant pour chaque camping (pour admin)

