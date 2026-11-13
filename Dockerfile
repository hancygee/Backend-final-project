# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./

RUN DATABASE_URL="mysql://user:password@localhost:3306/hotel_booking" npm ci

COPY backend/nest-cli.json ./
COPY backend/tsconfig*.json ./
COPY backend/src ./src
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /usr/src/app

COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN DATABASE_URL="mysql://user:password@localhost:3306/hotel_booking" npm ci

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]