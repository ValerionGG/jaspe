# Jaspe en production (Dokploy) : application + API + comptes réels, une base SQLite par agence.
# Construit depuis la racine du dépôt : docker build -f deploy/dokploy/Dockerfile .

FROM node:22.21.1-bookworm-slim AS app
WORKDIR /src/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
COPY server/ /src/server/
RUN npm run build

FROM node:22.21.1-bookworm-slim AS server
WORKDIR /src/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22.21.1-bookworm-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=5318 \
    JASPE_AUTH=1
WORKDIR /app
COPY --from=server /src/server/node_modules ./server/node_modules
COPY server/ ./server/
COPY --from=app /src/app/dist ./app/dist
# Bases des agences, comptes et fichiers déposés : à monter sur un volume persistant.
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data
VOLUME ["/app/server/data"]
USER node
EXPOSE 5318
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:5318/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--no-warnings", "server/index.js"]
