# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
# prisma schema wird für postinstall (prisma generate) benötigt
COPY prisma ./prisma
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Sicherstellen dass public/ existiert (wird von Next.js build benötigt)
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache chromium openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Prisma Client + Engine in den Standalone-Build kopieren
# Next.js Standalone kopiert node_modules nicht vollständig – Prisma muss manuell nachgezogen werden
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

RUN mkdir -p public/reports && chown -R nextjs:nodejs public/reports node_modules/.prisma node_modules/@prisma node_modules/bcryptjs

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]