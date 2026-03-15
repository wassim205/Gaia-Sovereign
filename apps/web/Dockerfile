FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Configure npm for better reliability
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-maxattempts 5

# Copy workspace files from parent directory
COPY ../package.json ../pnpm-lock.yaml ../pnpm-workspace.yaml* ./

# Copy app package.json
COPY package.json ./

# Install dependencies with retry logic
RUN pnpm install --network-timeout 600000 || \
    (echo "First attempt failed, retrying..." && \
     pnpm install --network-timeout 600000 --prefer-offline) || \
    (echo "Second attempt failed, final retry..." && \
     pnpm install --network-timeout 600000 --prefer-offline --no-frozen-lockfile)

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

FROM node:20-alpine AS main
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

# Install production dependencies only with retry logic
RUN pnpm install --prod --network-timeout 300000 || \
    (echo "Production install failed, retrying..." && \
     pnpm install --prod --network-timeout 300000 --prefer-offline)

EXPOSE 3000
CMD ["pnpm", "start"]