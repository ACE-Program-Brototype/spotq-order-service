FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Dummy environment variables so build-time validation passes
ENV NODE_ENV=production \
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dummy" \
    REDIS_URL="redis://localhost:6379"

RUN pnpm exec prisma generate --schema=prisma/schema.prisma && \
    pnpm build && \
    pnpm prune --prod --ignore-scripts

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002 \
    INFISICAL_DISABLE_UPDATE_CHECK=true

RUN apk add --no-cache bash curl && \
    curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | bash && \
    apk add --no-cache infisical

# 1. Copy package.json early so Corepack knows exactly which pnpm version to get
COPY --chown=node:node package.json ./

# 2. Enable corepack, force the download by running pnpm --version, then fix folder ownership
RUN corepack enable && \
    pnpm --version && \
    chown -R node:node /app

# 3. Copy the rest of the build artifacts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node .infisical.json ./

USER node

EXPOSE 3002

CMD ["infisical", "run", "--", "node", "dist/server.js"]