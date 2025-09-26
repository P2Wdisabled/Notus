FROM node:22

WORKDIR /app

# Copier les fichiers de configuration (sans .env)
COPY package*.json ./
COPY next.config.mjs ./
COPY postcss.config.mjs ./
COPY auth.config.ts ./
COPY auth.ts ./
COPY middleware.ts ./

# Installer les dépendances 
RUN npm install

# Copier le reste de l'application (sans .env)
COPY . .
# Exclure .env avec .dockerignore

# Générer le client Prisma si nécessaire
RUN npx prisma generate || true

# Build conditionnel - seulement pour production
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ] ; then npm run build ; fi

EXPOSE 3000

# Commande par défaut (peut être overridée par docker-compose)
CMD ["npm", "start"]