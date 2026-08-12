FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

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

COPY --chown=node:node package.json ./

RUN corepack enable && \
    pnpm --version && \
    chown -R node:node /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node .infisical.json ./

USER node

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

CMD ["infisical", "run", "--", "node", "dist/server.js"]