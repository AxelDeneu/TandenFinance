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
RUN pnpm build

# production
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
