# Notus - Application Next.js avec Authentification

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Copiez le fichier `env.template` vers `.env` et configurez vos identifiants :

```bash
cp env.template .env
```

### 3. Configuration de la base de données (Optionnel)

#### Option A : Mode simulation (sans base de données)

L'application fonctionne en mode simulation sans base de données. Les formulaires sont validés mais les données ne sont pas persistées.

#### Option B : Avec PostgreSQL

1. **Installer PostgreSQL** et créer une base de données :

```sql
CREATE DATABASE notus_db;
```

2. **Configurer le fichier `.env`** avec votre URL de base de données :

```env
DATABASE_URL=postgresql://username:password@host:port/database
AUTH_SECRET=votre-clé-secrète
```

3. **Initialiser les tables** :

```bash
npm run init-db
```

### 4. Configuration Google OAuth (Optionnel)

Pour activer l'authentification Google OAuth :

1. **Suivez le guide** dans `GOOGLE_OAUTH_SETUP.md`
2. **Ajoutez les variables** à votre fichier `.env` :

```env
# URL de base (OBLIGATOIRE pour NextAuth.js)
NEXTAUTH_URL=http://localhost:3000

# Clés Google OAuth
AUTH_GOOGLE_ID=votre_client_id_google
AUTH_GOOGLE_SECRET=votre_client_secret_google
```

⚠️ **Important** : `NEXTAUTH_URL` est **obligatoire** pour que Google OAuth fonctionne correctement.

### 5. Démarrer l'application

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## 📁 Structure du projet

```
notus/
├── src/
│   ├── app/
│   │   ├── login/          # Page de connexion
│   │   ├── register/       # Page d'inscription
│   │   ├── logout/         # Page de déconnexion
│   │   └── page.js         # Page d'accueil
│   ├── components/
│   │   └── GoogleSignInButton.js  # Bouton Google OAuth
│   └── lib/
│       ├── actions.ts      # Actions serveur
│       ├── database.js     # Connexion PostgreSQL
│       └── validation.js   # Validation des données
├── auth.ts                 # Configuration NextAuth.js
├── auth.config.ts          # Configuration des pages
├── middleware.ts           # Protection des routes
├── env.template            # Template de configuration
└── GOOGLE_OAUTH_SETUP.md   # Guide configuration Google OAuth
```

## 🔐 Fonctionnalités

- ✅ **Inscription** avec validation complète
- ✅ **Connexion** sécurisée avec NextAuth.js
- ✅ **Authentification Google OAuth** (inscription et connexion)
- ✅ **Validation** côté client et serveur
- ✅ **Protection des routes** via middleware
- ✅ **Mode simulation** sans base de données
- ✅ **Interface responsive** avec Tailwind CSS

## 🛠️ Technologies

- **Next.js 15** avec App Router
- **NextAuth.js** pour l'authentification
- **PostgreSQL** pour la base de données
- **Tailwind CSS** pour le styling
- **bcryptjs** pour le hachage des mots de passe
- **Zod** pour la validation

## 📝 Notes

- En mode simulation, les données ne sont pas persistées
- Pour la production, configurez PostgreSQL et générez une clé AUTH_SECRET sécurisée
- L'application utilise des cookies sécurisés pour les sessions
