# Configuration Google OAuth pour Notus

## Étapes de configuration

### 1. Configuration Google Cloud Console

1. **Créer un projet Google Cloud :**

   - Aller sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créer un nouveau projet ou sélectionner un projet existant

2. **Activer l'API Google+ :**

   - Dans le tableau de bord, cliquer sur "Activer les API et les services"
   - Rechercher "Google+ API" et l'activer

3. **Créer des identifiants OAuth 2.0 :**
   - Aller dans "Identifiants" > "Créer des identifiants" > "ID client OAuth"
   - Configurer l'écran de consentement avec les informations requises
   - Type d'application : "Application Web"
   - Origines JavaScript autorisées : `http://localhost:3000`
   - URI de redirection autorisés : `http://localhost:3000/api/auth/callback/google`

### 2. Configuration des variables d'environnement

Créer un fichier `.env.local` à la racine du projet avec :

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/notus"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Environment
NODE_ENV="development"
```

### 3. Installation des dépendances

```bash
npm install @next-auth/prisma-adapter
```

### 4. Initialisation de la base de données

```bash
npm run init-db
```

### 5. Génération du client Prisma

```bash
npx prisma generate
```

## Fonctionnalités implémentées

- ✅ Connexion OAuth avec Google
- ✅ Gestion des sessions avec NextAuth.js
- ✅ Intégration avec la base de données PostgreSQL
- ✅ Pages de callback et de gestion des erreurs
- ✅ Middleware de protection des routes
- ✅ Composants UI pour la connexion
- ✅ Test de la configuration OAuth

## URLs importantes

- **Connexion Google :** `/api/auth/signin/google`
- **Callback Google :** `/api/auth/callback/google`
- **Page d'erreur :** `/auth/error`
- **Page de connexion :** `/login`

## Test de la configuration

Utiliser le bouton "Tester Google OAuth" sur la page de connexion pour vérifier que la configuration fonctionne correctement.
