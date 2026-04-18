FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate
WORKDIR /app

# install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NUXT_HUB_MIGRATE=false
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

# production
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
COPY --from=build /app/server/db/migrations/postgresql ./migrations
COPY scripts/migrate.mjs ./migrate.mjs
COPY start.sh ./start.sh
RUN chmod +x ./start.sh \
 && npm install --omit=dev --no-save --no-package-lock postgres@3.4.8 drizzle-orm@0.45.1
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV MIGRATIONS_DIR=/app/migrations
EXPOSE 3000
CMD ["./start.sh"]
