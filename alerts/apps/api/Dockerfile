# # #
# DEFINE THE BASE IMAGE

FROM node:alpine AS base

ENV SCOPE=alerts
ENV PROJECT=api

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

WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
RUN pnpm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@tmlmobilidade/sae-${SCOPE}-${PROJECT}


# # #
# RUNNER STAGE

FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

CMD node apps/$PROJECT/dist/index.js