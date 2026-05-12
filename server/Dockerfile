FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps. Dev dependencies are intentionally kept because Fly's
# release_command runs `npx prisma migrate deploy` inside this image.
RUN npm ci

# Generate Prisma client before copying prisma.config.ts. Fly secrets are only
# available at runtime, and prisma.config.ts requires DATABASE_URL/DIRECT_URL.
RUN npx prisma generate

# Copy runtime Prisma config and application source
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
