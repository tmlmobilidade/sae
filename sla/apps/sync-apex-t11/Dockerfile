# # #
# DEFINE THE BASE IMAGE

FROM node:alpine AS base

ENV SCOPE=sla
ENV PROJECT=sync-apex-t11

RUN npm install -g turbo@^2


# # #
# BUILDER STAGE

FROM base AS pruner

WORKDIR /app

COPY . .

RUN turbo prune --scope=@tmlmobilidade/sae-${SCOPE}-${PROJECT} --docker


# # #
# INSTALLER STAGE

FROM base AS builder

WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=pruner /app/out/json/ .
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@tmlmobilidade/sae-${SCOPE}-${PROJECT}


# # #
# RUNNER STAGE

FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

CMD node apps/$PROJECT/dist/index.js