# Configuration des variables d'environnement

## Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-replace-with-real-secret"

# Google OAuth (remplacez par vos vraies valeurs)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/notus"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Environment
NODE_ENV="development"
```

## Obtenir les clés Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+
4. Créez des identifiants OAuth 2.0
5. Configurez l'écran de consentement
6. Ajoutez l'URI de redirection : `http://localhost:3000/api/auth/callback/google`
7. Copiez le Client ID et Client Secret dans votre fichier .env.local

## Générer une clé secrète NextAuth

Vous pouvez générer une clé secrète avec :

```bash
openssl rand -base64 32
```

Ou utilisez n'importe quelle chaîne de caractères aléatoire de 32 caractères minimum.
