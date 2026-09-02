FROM node:22-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Install ALL deps (dev included) for building ───────────────────────────
FROM base AS build-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Build with Node.js adapter ─────────────────────────────────────────────
FROM build-deps AS build
COPY . .
ENV DOCKER_BUILD=true
RUN pnpm run build

# ─── Install production deps only ───────────────────────────────────────────
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ─── Final runtime image ─────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copy prod deps + built output
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4321

# Astro Node standalone server
CMD ["node", "./dist/server/entry.mjs"]
