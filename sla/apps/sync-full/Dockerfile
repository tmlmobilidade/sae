# # #

# Stage 1: Build the application

FROM node:alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npx @helperkits/bumper bump

RUN npm run build

# # #

# Stage 2: Create the final image

FROM node:alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

CMD ["node", "dist/index.js"]