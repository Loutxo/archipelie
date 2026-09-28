# Archipelie — Guide de déploiement

Application web permettant à chaque lecteur de réaliser les 4 étapes de la méthode de l'Épilogue.

## Stack

- **Frontend + API** : Next.js 14 (App Router, TypeScript)
- **Base de données + Auth** : Supabase (PostgreSQL + PostGIS)
- **Cartographie** : Leaflet + OpenStreetMap (gratuit, sans clé API)
- **Déploiement recommandé** : Vercel + Supabase (les deux ont un free tier généreux)

---

## Étape 1 — Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte / projet
2. Dans le SQL Editor, colle et exécute le contenu de `supabase/schema.sql`
3. Récupère tes clés dans **Settings > API** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role — à garder secret)

---

## Étape 2 — Configuration locale

```bash
# Clone ou copie le projet
cd archipelie

# Installe les dépendances
npm install

# Crée ton fichier .env.local
cp .env.example .env.local
# → Édite .env.local avec tes clés Supabase
```

Contenu de `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Étape 3 — Lancer en local

```bash
npm run dev
# → http://localhost:3000
```

---

## Étape 4 — Déployer sur Vercel

1. Push le projet sur GitHub
2. Va sur [vercel.com](https://vercel.com), importe le repo
3. Dans les variables d'environnement Vercel, ajoute les 4 variables du `.env.local`
   (en remplaçant `NEXT_PUBLIC_SITE_URL` par ton domaine Vercel)
4. Déploie — c'est tout.

---

## Configuration Supabase Auth

Dans ton projet Supabase > **Authentication > URL Configuration** :
- **Site URL** : ton domaine de prod (ex : `https://archipelie.vercel.app`)
- **Redirect URLs** : ajoute `https://archipelie.vercel.app/**`

---

## Architecture du projet

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Layout global
│   ├── auth/
│   │   ├── login/page.tsx          # Connexion
│   │   └── signup/page.tsx         # Inscription
│   ├── parcours/
│   │   ├── page.tsx                # Introduction au parcours
│   │   ├── 1-maille/page.tsx       # Carte interactive (Leaflet)
│   │   ├── 2-manques/page.tsx      # Sélection des manques
│   │   ├── 3-competences/page.tsx  # Types de tisseurs
│   │   └── 4-compagnons/page.tsx   # Compagnons + opt-in matching
│   ├── synthese/page.tsx           # Synthèse + conseil + matching
│   └── api/
│       ├── profile/route.ts        # CRUD profil
│       └── matches/route.ts        # Géo-matching (PostGIS)
├── components/
│   ├── MapPicker.tsx               # Carte interactive (Leaflet, client only)
│   └── SyntheseMap.tsx             # Carte lecture seule
├── lib/
│   ├── supabase.ts                 # Clients Supabase (browser + server)
│   └── constants.ts                # Manques, compétences, conseils
├── types/
│   └── index.ts                    # Types TypeScript
└── supabase/
    └── schema.sql                  # Schéma BDD complet
```

---

## Prochaines étapes possibles

- **Page profil** : permettre à l'utilisateur d'éditer ses infos et de voir son historique
- **Notifications** : alerter quand une personne avec des manques similaires s'inscrit dans ta maille
- **Fil d'initiative** : une page listant les initiatives publiques par géographie
- **Messagerie simple** : permettre aux matchs de se contacter (via email)
- **Personnalisation des conseils** : enrichir la bibliothèque de textes avec plus de cas
- **Export PDF** : générer un beau PDF de la synthèse (voir skill `pdf` de Cowork)
