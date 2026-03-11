FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Copy app package.json
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install

# Copy source code
COPY apps/web ./apps/web

# Build the application
WORKDIR /app/apps/web
RUN pnpm run build

FROM node:20-alpine AS main
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for production
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/pnpm-lock.yaml* ./
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.ts ./

# Install production dependencies only
RUN pnpm install --prod

EXPOSE 3000
CMD ["pnpm", "start"]