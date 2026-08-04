# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

ARG VITE_ENVIRONMENT_MODE
ARG VITE_API_BASE_URL
ARG VITE_AUTH_STRATEGY
ARG VITE_BEARER_TOKEN_STORAGE
ARG VITE_AUTH_ME_PATH
ARG VITE_AUTH_LOGOUT_PATH
ARG VITE_SITE_URL

ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

ENV VITE_ENVIRONMENT_MODE=$VITE_ENVIRONMENT_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH_STRATEGY=$VITE_AUTH_STRATEGY
ENV VITE_BEARER_TOKEN_STORAGE=$VITE_BEARER_TOKEN_STORAGE
ENV VITE_AUTH_ME_PATH=$VITE_AUTH_ME_PATH
ENV VITE_AUTH_LOGOUT_PATH=$VITE_AUTH_LOGOUT_PATH
ENV VITE_SITE_URL=$VITE_SITE_URL

ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild lightningcss @tailwindcss/oxide

COPY . .
RUN npm run build

# ─── Stage 2: Node SSR server ────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Laravel origin for robots.txt / sitemap.xml / SEO proxy (no trailing slash).
# Set per Coolify environment (runtime env overrides this ARG default):
#   Demo:       SPA_SHELL_API_ORIGIN=https://api.gidira.cloud
#   Production: SPA_SHELL_API_ORIGIN=https://api.gidira.tech
ARG SPA_SHELL_API_ORIGIN=
ENV SPA_SHELL_API_ORIGIN=$SPA_SHELL_API_ORIGIN

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY server ./server

EXPOSE 3000

# Coolify often injects PORT=80; healthcheck must follow $PORT (not a fixed 3000).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

CMD ["node", "server/index.mjs"]
