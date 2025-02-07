# # #
# DEFINE THE BASE IMAGE

FROM node:alpine AS base

ENV SCOPE=alerts
ENV PROJECT=frontend

# setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm install -g turbo@^2


# # #
# PRUNER STAGE

FROM base AS pruner

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

COPY package.json ./
COPY . .

RUN turbo prune --scope=@tmlmobilidade/sae-${SCOPE}-${PROJECT} --docker


# # #
# BUILDER STAGE

FROM base AS builder

RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@tmlmobilidade/sae-${SCOPE}-${PROJECT}


# # #
# RUNNER STAGE

FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/$PROJECT/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/$PROJECT/.next/static ./apps/$PROJECT/.next/static
# COPY --from=builder --chown=nextjs:nodejs /app/apps/$PROJECT/public ./apps/$PROJECT/public

CMD node apps/$PROJECT/server.js
