# Builds the app and runs it with our own server (Next.js + WebSocket).

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build loads the database module but never connects; it only needs the variable to exist.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
RUN npm run build

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
# The server writes its cache into .next, so the node user must own it.
COPY --from=build --chown=node:node /app/.next ./.next
COPY package.json tsconfig.json next.config.ts server.ts ./
COPY public ./public
COPY src ./src
COPY scripts ./scripts
COPY drizzle ./drizzle
USER node
EXPOSE 3000
# Apply new database migrations, then start.
CMD ["sh", "-c", "npm run db:migrate && npm start"]
