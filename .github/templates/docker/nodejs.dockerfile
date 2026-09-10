# # #

FROM node:lts-slim AS base


# # #
# MODULE CONFIGURATION

ARG ENVIRONMENT
ARG MODULE
ARG APP

ENV ENVIRONMENT=${ENVIRONMENT}
ENV MODULE=${MODULE}
ENV APP=${APP}


# # #
# GLOBAL DEPENDENCIES

RUN npm install -g turbo@^2


# # #
# PRUNER STAGE
# Copy all files and run turbo prune to create a minimal monorepo
# with only the necessary files for building the specified module/app.

FROM base AS pruner

WORKDIR /app

COPY . .

RUN turbo prune --docker @tmlmobilidade/go-${MODULE}-${APP}


# # #
# BUILDER STAGE
# Build the app in the pruned monorepo.
# First install dependencies, as they change less often.

FROM base AS builder

WORKDIR /app

RUN apt-get update
RUN apt-get install -y python3 build-essential
RUN rm -rf /var/lib/apt/lists/*

COPY --from=pruner /app/out/json/ .
COPY .github/templates/docker/scripts /app/.docker/scripts

RUN npm ci --foreground-scripts --verbose

COPY --from=pruner /app/out/full/ .

RUN npx @tmlmobilidade/repo-version --output=/app/modules/${MODULE}/apps/${APP}/package.json

RUN turbo run build --filter=@tmlmobilidade/go-${MODULE}-${APP}

RUN npm prune

RUN node /app/.docker/scripts/trim-node-modules.js /app/node_modules
RUN node /app/.docker/scripts/trim-workspaces.js /app/packages /app/modules /app/packages-new

# SQL files under `modules/<module>/sql` are plain assets, not workspace packages,
# so `turbo prune` never includes them and `trim-workspaces.js` never sees them.
# Copy this module's SQL from the pruner stage, which still holds the full source
# tree. Apps that read another module's SQL must extend this copy, otherwise
# `sqlPath()` throws at startup with the list of paths it searched.
RUN --mount=type=bind,from=pruner,source=/app,target=/ctx \
    if [ -d "/ctx/modules/${MODULE}/sql" ]; then \
      mkdir -p "/app/modules/${MODULE}"; \
      cp -a "/ctx/modules/${MODULE}/sql" "/app/modules/${MODULE}/"; \
    else \
      echo "No SQL directory for module ${MODULE}, skipping."; \
    fi


# # #
# RUNNER STAGE
# Copy only what's needed for runtime: node_modules, workspace
# packages (trimmed to package.json + dist), and the app's dist.

FROM gcr.io/distroless/nodejs24-debian13 AS runner

WORKDIR /app

ARG ENVIRONMENT
ARG MODULE
ARG APP

ENV ENVIRONMENT=${ENVIRONMENT}
ENV MODULE=${MODULE}
ENV APP=${APP}
ENV NODE_ENV=production

COPY --from=builder /app/modules/${MODULE}/apps/${APP}/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/packages-new ./packages-new
COPY --from=builder /app/modules ./modules
COPY --from=builder /app/modules/${MODULE}/apps/${APP}/dist ./dist

CMD ["./dist/index.js"]