FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies (faster than ci for development)
RUN npm install --ignore-engines

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start:dev"]