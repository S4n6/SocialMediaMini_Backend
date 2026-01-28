# Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate && npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Production stage
FROM node:20-alpine AS runner

# Install essential tools and create user FIRST
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    rm -rf /var/cache/apk/*

# Set workdir and environment
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy files with correct ownership from the start (avoids chown layer duplication)
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /usr/src/app/prisma ./prisma

# Switch to non-root user
USER nestjs

EXPOSE 3107
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]