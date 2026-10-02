# Chef Mealan, production image: build the app and the server, run the server.
FROM node:22-slim AS build
WORKDIR /app
# quiet npm in the build log: no "new version available" notice, no audit or funding lines; the installed packages are pinned by the lockfile
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY package*.json ./
RUN npm ci
COPY . .
# Firebase web config is public by design; it is passed at build time, not stored in the repo.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_DB_ID
ARG VITE_COMMIT=dev
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID VITE_FIREBASE_DB_ID=$VITE_FIREBASE_DB_ID VITE_COMMIT=$VITE_COMMIT
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
EXPOSE 8080
CMD ["node", "dist/server.cjs"]
