FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm install --filter @tracker/api... --no-frozen-lockfile

RUN pnpm --filter @tracker/db prisma:generate
RUN pnpm --filter @tracker/db build
RUN pnpm --filter @tracker/api build

FROM node:20-alpine AS runner

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/types/package.json packages/types/package.json

RUN pnpm install --prod --filter @tracker/api... --no-frozen-lockfile

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder /app/packages/db/dist ./apps/api/node_modules/@tracker/db/dist
COPY --from=builder /app/packages/db/node_modules ./apps/api/node_modules/@tracker/db/node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN node -e "const fs=require('fs'); for (const path of ['/app/packages/db/package.json', '/app/apps/api/node_modules/@tracker/db/package.json']) { const pkg=JSON.parse(fs.readFileSync(path,'utf8')); pkg.main='dist/src/index.js'; pkg.types='dist/src/index.d.ts'; fs.writeFileSync(path, JSON.stringify(pkg, null, 2)); }"
RUN chmod +x /app/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["/app/docker-entrypoint.sh"]
