# Satisfaction patient CDL — Baromètre Vague 1

Questionnaire patient (une question par écran, aiguillage Consultation / Séjour) et espace d'analyse pour le Service Expérience Patient & Hospitalité.

- `/` : questionnaire patient. Le canal de diffusion est passé dans l'URL : `/?canal=accueil`, `salle-attente`, `caisse`, `sortie`, `sms`.
- `/admin` : tableau de bord réservé (indicateurs séparés par parcours, croisement des priorités, verbatims à classer, volontaires Vague 2, QR codes, export CSV).

## 1. Base Supabase

1. Supabase > SQL Editor : exécuter `supabase/schema.sql`.
2. Authentication > Users > Add user : créer le compte de chaque analyste (e-mail + mot de passe).
3. Déclarer chaque compte administrateur :
   ```sql
   insert into public.admins (user_id, nom)
   select id, 'Service Expérience Patient & Hospitalité'
   from auth.users where email = 'prenom.nom@centre-diagnostic.com';
   ```
4. Authentication > Providers > Email : désactiver « Allow new users to sign up » (seuls les comptes créés à la main doivent exister).

Sécurité : le public peut uniquement déposer une réponse (RLS + droits par colonne). Seuls les comptes de la table `admins` lisent les réponses et les numéros de téléphone.

## 2. Netlify

1. Pousser le dossier sur GitHub, puis Netlify > Add new site > Import from Git.
2. Build : `npm run build`, dossier publié : `dist` (déjà dans `netlify.toml`).
3. Site configuration > Environment variables :
   - `VITE_SUPABASE_URL` = `https://tsbbtzhmzfufdnyyozit.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable__JUBMBfl-6kX9bnNSeKUcA_t0MUDGmK`
4. Une fois en ligne : `/admin` > « Liens et QR codes » pour télécharger les QR codes (ils utilisent l'adresse du site déployé).

## 3. Développement local

```bash
npm install
cp .env.example .env
npm run dev
```

## Réglages

- `src/lib/questionnaire.js`
  - `INCLURE_C6` : active la question facturation (point encore ouvert).
  - `MESSAGE_FIN` : remplacer par le texte de fin actuel si besoin.
- Règle d'or : ne pas modifier la formulation des questions entre la Vague 1 et la Vague 2.

## Indicateurs (toujours séparés Consultation / Séjour)

| Indicateur | Calcul | Questions |
| --- | --- | --- |
| Satisfaction globale | % de notes 4 et 5 | F1 |
| NPS | % de 9-10 moins % de 0 à 6 | F2 |
| Satisfaction par étape | % de 4 et 5, « Non concerné » exclu | C1, C3–C5 ; S2–S6 |
| Attente | % reçus en moins de 30 min | C2 |
| Priorités | % de citations par thème | F3 |
| Verbatims | classés par thème dans l'onglet Verbatims | F4 |

En base, une note `0` signifie « Non concerné » (ou « Pas d'examen » pour C4). Sous 30 réponses par parcours, le tableau de bord affiche les chiffres comme des signaux.
