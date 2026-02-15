FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# install build deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# copy source & build
COPY . .

RUN npx prisma generate
RUN npm run build

# production image
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production

# copy runtime files
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3107

# default: start API
CMD ["node", "dist/src/main.js"]