FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (devDeps needed for tsc + prisma CLI for migrations)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build config
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

EXPOSE 3000

# Run pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
