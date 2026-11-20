# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

WORKDIR /app

RUN corepack enable

# 1. Install all dependencies (ignore-scripts prevents premature postinstall prisma generate)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# 2. Generate Prisma Client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN pnpm exec prisma generate

# 3. Copy source and compile ESM bundle
COPY tsconfig.json tsup.config.ts ./
COPY src ./src/
RUN pnpm build

# 4. Prune dev dependencies for production
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm prune --prod --ignore-scripts

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:22-alpine AS runner

ENV NODE_ENV="production" \
    PORT=3002 \
    TZ="UTC" \
    INFISICAL_DISABLE_UPDATE_CHECK=true

WORKDIR /app

# Copy Infisical binary directly from official image (fast, reproducible, no wget/apk scripts)
COPY --from=infisical/cli:latest /bin/infisical /usr/local/bin/infisical

# Copy only production dependencies & compiled bundle with non-root ownership
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node .infisical.json ./

USER node

EXPOSE 3002

HEALTHCHECK \
  --interval=30s \
  --timeout=5s \
  --start-period=10s \
  --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["infisical", "run", "--", "node", "dist/server.js"]