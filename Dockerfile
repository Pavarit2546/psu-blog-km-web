FROM node:24.22.3-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat
FROM base AS deps
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
FROM deps AS builder
COPY . .
ARG API_ORIGIN=http://api:3000
ENV API_ORIGIN=$API_ORIGIN
RUN pnpm build
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node","server.js"]
