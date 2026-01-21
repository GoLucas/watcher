# Base image with Node.js LTS
FROM node:20-slim AS base

# Install dependencies needed for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy Prisma schema from parent for client generation
COPY ../prisma/schema.prisma ./prisma/
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /root/.cache/ms-playwright /root/.cache/ms-playwright
COPY . .

# Copy Prisma client
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

ENV WORKER_PORT=4000

CMD ["npm", "run", "dev"]
