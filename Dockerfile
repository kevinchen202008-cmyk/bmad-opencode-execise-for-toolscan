FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for bun support or install bun
RUN npm install -g bun

# Dependency stage
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create the data directory for SQLite persistence
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data

# Copy the standalone Next.js build and required assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy drizzle configurations and schema for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/db ./src/db
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts/run-prod.sh ./

# Set the execute permission for the script
RUN chmod +x ./run-prod.sh

USER nextjs

EXPOSE 3000

CMD ["./run-prod.sh"]
