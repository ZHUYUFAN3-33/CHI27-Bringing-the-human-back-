# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-slim AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS=--enable-source-maps
WORKDIR /app

# dumb-init reaps the child correctly so Fly's SIGTERM reaches Node and the
# drain hook in src/server.js actually runs during a deploy.
RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init \
 && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src    ./src
COPY shared ./shared
COPY public ./public
COPY private ./private
COPY db     ./db

RUN chown -R node:node /app
USER node

EXPOSE 8080
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
