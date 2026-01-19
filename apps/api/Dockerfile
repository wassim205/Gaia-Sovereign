FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

FROM node:alpine AS main


RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
# Copy built application from base stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
EXPOSE 4000
CMD ["pnpm", "run", "start:dev"]