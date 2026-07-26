# Recevoir un email à chaque candidature pilote

## Comment ça marche

```
Formulaire du site → table candidatures → déclencheur SQL
   → Edge Function notify-candidature → Resend → ta boîte mail
```

Tout est **déjà déployé et testé** sur le projet Supabase `tswpintevokeasteyjno` :

| Élément | État |
|---|---|
| Formulaire du site → base | ✅ vérifié |
| Déclencheur `trg_notifier_candidature` | ✅ posé |
| Edge Function `notify-candidature` | ✅ déployée, répond HTTP 200 |
| Clé Resend | ⬜ **à renseigner (5 min)** |

Sans la clé, la fonction répond `{"ok":false,"raison":"secrets manquants"}` :
la candidature est bien enregistrée, seul l'email ne part pas.

## Les 2 étapes qu'il reste

### 1. Créer un compte Resend (gratuit)

1. [resend.com](https://resend.com) → inscription **avec l'adresse où tu veux
   recevoir les alertes** (ex. `abitboljohan@gmail.com`)
2. **API Keys** → *Create API Key* → copier la clé (`re_...`)

> Gratuit : 100 emails/jour, 3 000/mois — largement suffisant.

### 2. Renseigner les secrets dans Supabase

Dashboard Supabase → **Edge Functions → Secrets** → *Add new secret* :

| Nom | Valeur |
|---|---|
| `RESEND_API_KEY` | la clé `re_...` copiée |
| `NOTIFY_TO` | ton adresse (ex. `abitboljohan@gmail.com`) |

C'est tout — l'email part dès la candidature suivante.

> ℹ️ L'expéditeur par défaut est `onboarding@resend.dev`, qui fonctionne
> **sans vérifier de domaine**. Contrepartie : Resend n'autorise l'envoi
> qu'à l'adresse du compte — ce qui convient parfaitement ici, puisque tu
> t'envoies les alertes à toi-même.

## Envoyer depuis ta propre adresse (optionnel, plus tard)

Pour recevoir depuis `contact@campconnect.fr` :
1. Resend → **Domains** → ajouter `campconnect.fr` → renseigner les
   enregistrements DNS indiqués
2. Ajouter un 3ᵉ secret : `NOTIFY_FROM` = `CampConnect <contact@campconnect.fr>`

## Tester

Après avoir posé les secrets, remplis le formulaire sur le site — ou en SQL :

```sql
INSERT INTO candidatures (nom, email, camping, emplacements, message)
VALUES ('Test', 'test@exemple.fr', 'Camping test', 'Moins de 50', 'Essai');
```

Vérifier le résultat de l'appel :

```sql
SELECT status_code, content FROM net._http_response ORDER BY id DESC LIMIT 1;
```

- `{"ok":true}` → email parti ✅
- `{"ok":false,"raison":"secrets manquants"}` → secrets non pris en compte
- `{"ok":false,"status":403,...}` → clé Resend invalide, ou destinataire
  différent de l'adresse du compte Resend (voir la note sur `onboarding@resend.dev`)

Puis nettoyer : `DELETE FROM candidatures WHERE email = 'test@exemple.fr';`

## En attendant : voir les candidatures

Elles sont toutes en base, rien n'est perdu :

**Dashboard Supabase → Table Editor → `candidatures`**

ou en SQL :
```sql
SELECT nom, email, camping, emplacements, message, created_at
FROM candidatures ORDER BY created_at DESC;
```

## Notes

- Le déclencheur est **non bloquant** : si l'email échoue, la candidature est
  quand même enregistrée. Un prospect n'est jamais perdu à cause de la
  notification.
- Le formulaire du site propose en plus un **repli par email pré-rempli** si
  l'enregistrement lui-même échoue (serveur injoignable).
- `api/notify.js` (Vercel) est l'ancienne approche : **jamais déployée**, aucun
  projet Vercel n'existe. Cette Edge Function la remplace.
