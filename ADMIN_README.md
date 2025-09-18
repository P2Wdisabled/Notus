# Backoffice Administrateur - Notus

## Vue d'ensemble

Le backoffice administrateur de Notus permet de gérer les utilisateurs et l'application depuis une interface dédiée. Il est accessible uniquement aux utilisateurs ayant les droits administrateur.

## Fonctionnalités

### US 29 - Gestion des comptes

- ✅ Accès via un backoffice à la liste des comptes utilisateurs
- ✅ Menu intégré permettant de bannir un utilisateur
- ✅ Promotion/rétrogradation d'utilisateurs en administrateurs
- ✅ Visualisation des statuts des utilisateurs (actif, banni, en attente de vérification)

### Fonctionnalités supplémentaires

- ✅ **Bouton backoffice** dans la navigation (visible uniquement aux admins)
- ✅ **Auto-promotion** via bouton dans le footer
- ✅ **Vérification automatique** du statut admin
- ✅ **Interface responsive** avec design moderne
- ✅ **Système de bannissement** : empêche la connexion des utilisateurs bannis
- ✅ **Sécurité** : protection contre l'auto-bannissement

## Accès au backoffice

### URL

- **Backoffice principal**: `/admin`
- **Gestion des utilisateurs**: `/admin/users`

### Prérequis

1. Être connecté à l'application
2. Avoir les droits administrateur (`is_admin = true` dans la base de données)

### Comment devenir administrateur

#### Méthode 1 : Bouton dans le footer (recommandé)

1. Connectez-vous à l'application
2. Faites défiler vers le bas de la page
3. Cliquez sur le bouton "Devenir Admin" dans le footer
4. Confirmez la promotion
5. Rechargez la page pour voir le bouton "Backoffice" dans la navigation

#### Méthode 2 : Script de promotion

```bash
node scripts/promote-admin.js user@example.com
```

#### Méthode 3 : Promotion via l'interface admin

1. Demandez à un administrateur existant de vous promouvoir
2. Allez dans `/admin/users`
3. Cliquez sur "Promouvoir" à côté de votre nom

## Configuration initiale

### Promouvoir un utilisateur en administrateur

Pour promouvoir un utilisateur existant en administrateur, utilisez le script fourni :

```bash
node scripts/promote-admin.js user@example.com
```

### Structure de la base de données

Les colonnes suivantes ont été ajoutées à la table `users` :

- `is_admin` (BOOLEAN) : Indique si l'utilisateur est administrateur
- `is_banned` (BOOLEAN) : Indique si l'utilisateur est banni
- `terms_accepted_at` (TIMESTAMP) : Date et heure d'acceptation des conditions d'utilisation

## Interface utilisateur

### Navigation

- **Tableau de bord** (`/admin`) : Vue d'ensemble avec statistiques
- **Utilisateurs** (`/admin/users`) : Gestion des comptes utilisateurs
- **Documents** (`/admin/documents`) : Gestion des documents (à venir)
- **Paramètres** (`/admin/settings`) : Configuration de l'application (à venir)

### Gestion des utilisateurs

#### Actions disponibles

- **Bannir/Débannir** : Empêche ou autorise l'accès à l'application
- **Promouvoir** : Donne les droits administrateur à un utilisateur
- **Rétrograder** : Retire les droits administrateur d'un utilisateur

#### Informations affichées

- Nom complet et nom d'utilisateur
- Adresse email
- Statut (Actif, Banni, En attente de vérification)
- Rôle (Administrateur, Utilisateur)
- Date d'inscription
- Date d'acceptation des conditions d'utilisation
- Fournisseur d'authentification (Google, etc.)

## Système de consentement aux conditions d'utilisation

### Fonctionnement

- **Obligatoire à l'inscription** : Les utilisateurs doivent accepter les conditions pour s'inscrire
- **Case à cocher** : Interface claire avec liens vers les documents légaux
- **Enregistrement de la date** : Horodatage précis de l'acceptation
- **Validation côté serveur** : Vérification obligatoire avant création du compte
- **OAuth inclus** : Les utilisateurs Google acceptent automatiquement les conditions

### Interface d'inscription

- **Case à cocher obligatoire** : "Je confirme avoir lu et accepté les conditions..."
- **Liens vers les documents** : CGU et RGPD accessibles en clic
- **Validation en temps réel** : Impossible de s'inscrire sans cocher
- **Message d'erreur** : "Vous devez accepter les conditions d'utilisation..."

### Gestion des utilisateurs existants

- **Migration automatique** : Script pour ajouter une date d'acceptation fictive
- **Date de création** : Les utilisateurs existants ont leur date de création comme date d'acceptation
- **Rétrocompatibilité** : Aucun impact sur les utilisateurs existants

### Affichage dans le backoffice

- **Colonne dédiée** : "Conditions acceptées" dans le tableau des utilisateurs
- **Statut visuel** : ✓ Acceptées / ✗ Non acceptées
- **Date et heure** : Affichage précis de l'acceptation
- **Couleurs** : Vert pour accepté, rouge pour non accepté

## Système de bannissement

### Fonctionnement

- **Bannissement** : Empêche complètement l'accès à l'application
- **Vérification à la connexion** : Les utilisateurs bannis ne peuvent pas se connecter
- **Vérification des sessions** : Les sessions existantes sont vérifiées à chaque requête
- **Redirection automatique** : Les utilisateurs bannis sont redirigés vers `/banned`
- **Notification par email** : Un email est automatiquement envoyé lors du bannissement ET du débannissement

### Email de notification

#### Email de bannissement

- **Sujet** : "Votre compte Notus a été suspendu"
- **Informations** : Nom de l'utilisateur, raison du bannissement (si fournie)
- **Actions** : Lien pour contacter le support, instructions pour les prochaines étapes
- **Design** : Template HTML professionnel avec couleurs d'alerte (rouge)

#### Email de débannissement

- **Sujet** : "Votre compte Notus a été réactivé"
- **Informations** : Nom de l'utilisateur, confirmation de réactivation
- **Actions** : Lien de connexion, conseils pour éviter de futures suspensions
- **Design** : Template HTML professionnel avec couleurs positives (vert)

#### Configuration

- **Expéditeur** : `EMAIL_FROM` (par défaut : "Notus <noreply@notus.com>")
- **Support** : `ADMIN_EMAIL` (par défaut : "admin@notus.com")
- **Service** : Resend (si `RESEND_API_KEY` configuré) ou simulation en développement

#### Interface de bannissement

- **Modal de confirmation** : Demande confirmation avant le bannissement
- **Champ raison** : Optionnel, permet d'expliquer le motif du bannissement
- **Feedback utilisateur** : Confirmation que l'email a été envoyé
- **Débannissement direct** : Pas de modal pour le débannissement (action immédiate)
- **Emails automatiques** : Envoi automatique d'emails pour bannissement ET débannissement

### Page de compte banni

- **URL** : `/banned`
- **Contenu** : Message d'information et bouton de retour
- **Accès** : Automatique pour les utilisateurs bannis

### Types de connexion bloqués

- ✅ **Connexion par email/mot de passe** : Vérification dans `getUser()`
- ✅ **Connexion OAuth (Google)** : Vérification dans `createOrUpdateOAuthUser()`
- ✅ **Sessions existantes** : Vérification dans le middleware

## Sécurité

### Vérifications d'autorisation

- Vérification de la session utilisateur
- Vérification des droits administrateur
- Protection contre l'auto-bannissement
- Protection contre l'auto-rétrogradation
- Vérification du statut banni à chaque requête

### API Endpoints

#### Bannir/Débannir un utilisateur

```
PATCH /api/admin/users/[id]/ban
Body: {
  "isBanned": boolean,
  "reason": string (optionnel)
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Utilisateur banni avec succès",
  "user": { ... },
  "emailSent": true
}
```

#### Promouvoir/Rétrograder un utilisateur

```
PATCH /api/admin/users/[id]/admin
Body: { "isAdmin": boolean }
```

## Développement

### Structure des fichiers

```
src/app/admin/
├── layout.js              # Layout avec vérification admin
├── page.js                # Tableau de bord principal
└── users/
    └── page.js            # Page de gestion des utilisateurs

src/components/
├── AdminNavigation.js     # Navigation du backoffice
└── UsersTable.js          # Tableau des utilisateurs

src/app/api/admin/users/[id]/
├── ban/route.js           # API bannissement
└── admin/route.js         # API promotion admin
```

### Fonctions de base de données

- `getAllUsers()` : Récupère tous les utilisateurs
- `toggleUserBan()` : Bannit/débannit un utilisateur
- `toggleUserAdmin()` : Promouvoit/rétrograde un utilisateur
- `isUserAdmin()` : Vérifie les droits administrateur

## Utilisation

1. **Accéder au backoffice** : Connectez-vous et naviguez vers `/admin`
2. **Gérer les utilisateurs** : Allez dans "Utilisateurs" pour voir la liste
3. **Bannir un utilisateur** :
   - Cliquez sur "Bannir" dans la colonne Actions
   - Remplissez la raison (optionnel) dans la modal
   - Confirmez le bannissement
   - Un email de bannissement sera automatiquement envoyé à l'utilisateur
4. **Débannir un utilisateur** :
   - Cliquez sur "Débannir" dans la colonne Actions
   - L'action est immédiate (pas de modal)
   - Un email de débannissement sera automatiquement envoyé à l'utilisateur
5. **Promouvoir un utilisateur** : Cliquez sur "Promouvoir" pour donner les droits admin

## Tests

### Scripts de test disponibles

```bash
# Test du système de bannissement complet
node scripts/test-ban-system.js

# Test des messages d'erreur de bannissement
node scripts/test-ban-fix.js

# Test des emails de bannissement et débannissement
node scripts/test-ban-email.js

# Initialisation de la base de données (ajoute toutes les colonnes)
node scripts/init-database.js

# Fix des dates d'acceptation pour les utilisateurs existants
node scripts/fix-accept-date.js

# Migration des utilisateurs existants pour les conditions d'utilisation
node scripts/migrate-terms-acceptance.js

# Test des fonctionnalités admin
node scripts/test-admin-features.js
```

## Dépannage

### Erreur "ECONNREFUSED" - PostgreSQL non accessible

Cette erreur indique que PostgreSQL n'est pas démarré ou n'est pas accessible.

**Solutions :**

1. **Tester la connexion :**

   ```bash
   node scripts/test-connection.js
   ```

2. **Configurer la base de données :**

   ```bash
   node scripts/setup-database.js
   ```

3. **Démarrer PostgreSQL :**

   ```bash
   # Windows
   net start postgresql-x64-14

   # Linux
   sudo systemctl start postgresql

   # Mac
   brew services start postgresql
   ```

4. **Vérifier la configuration .env :**
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/notus_db
   ```

### Erreur "column 'terms_accepted_at' does not exist"

Cette erreur indique que la colonne n'a pas encore été ajoutée à la base de données.

**Solution :**

```bash
# 1. Initialiser la base de données (ajoute toutes les colonnes)
node scripts/init-database.js

# 2. Fixer les dates d'acceptation pour les utilisateurs existants
node scripts/fix-accept-date.js
```

### Migration des utilisateurs existants

Si vous avez des utilisateurs existants sans date d'acceptation :

```bash
# Script automatique qui ajoute la colonne et migre les données
node scripts/fix-accept-date.js
```

## Notes importantes

- Les utilisateurs bannis ne peuvent plus se connecter à l'application
- Les administrateurs ne peuvent pas se bannir ou se rétrograder eux-mêmes
- Tous les nouveaux utilisateurs doivent accepter les conditions d'utilisation
- Les utilisateurs OAuth (Google) acceptent automatiquement les conditions
- Toutes les actions sont loggées et peuvent être auditées
- L'interface est responsive et fonctionne sur mobile et desktop
