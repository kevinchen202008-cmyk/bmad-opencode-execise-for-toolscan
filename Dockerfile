FROM oven/bun:alpine AS base

WORKDIR /app

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

# Note: Bun alpine image uses different user setup, we'll run as root for simplicity in this demo to avoid permission issues with sqlite
# Create the data directory for SQLite persistence
RUN mkdir -p /app/data

# Copy the standalone Next.js build and required assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy drizzle configurations and schema for runtime migrations
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/scripts/run-prod.sh ./

# Set the execute permission for the script
RUN chmod +x ./run-prod.sh

EXPOSE 3000

CMD ["./run-prod.sh"]
