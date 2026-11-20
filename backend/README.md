# Hotel Booking API

NestJS REST API for hotel room browsing and management, user authentication, bookings, and notifications. It uses Prisma and MySQL.

## Requirements

- Node.js 22 or later and npm
- Docker Desktop (or Docker Engine with Docker Compose) for the local MySQL database

Check that these commands are available:

```bash
node --version
npm --version
docker --version
docker compose version
```

## Run locally

Run the commands from the indicated directories. In PowerShell, use `Copy-Item` to create the environment files.

### 1. Configure the backend

From `backend/`, create the environment file:

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The template is configured for the local Compose database at `localhost:3307`. Change `JWT_SECRET` to a private random value for your own environment. Do not commit `.env`.

### 2. Start MySQL

From the repository root (the directory containing `docker-compose.yml`), start the database and wait until it is healthy:

```bash
docker compose up -d --wait mysql
```

### 3. Install dependencies and prepare the database

From `backend/`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

`npm install` also generates Prisma Client through the configured postinstall script; running `npx prisma generate` explicitly is safe and ensures it is available.

### 4. (Optional) Add demo accounts and sample rooms

From `backend/`, run:

```bash
npx prisma db seed
```

This creates `admin@hotel.com` and `user@hotel.com` (both use `Password123!`) and three sample rooms. **The seed deletes existing notifications, bookings, rooms, and users first. Run it only against a disposable or intended local database—never against production.**

### 5. Start and open the API

From `backend/`:

```bash
npm run start:dev
```

- API base URL: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/api/docs>
- Health check: <http://localhost:3000/health>

Keep the terminal running while you use the API. Press `Ctrl+C` to stop the development server.

## Run the full stack with Docker

From the repository root:

```bash
docker compose up --build -d app mysql
```

This starts MySQL and the API. The API container applies database migrations on startup. Open <http://localhost:3000/api/docs> to use Swagger. To add demo accounts and rooms to this local Docker database, run:

```bash
docker compose exec app npx prisma db seed
```

Remember that seeding clears existing users, rooms, bookings, and notifications in that database.

Stop the app and development database from the repository root:

```bash
docker compose down
```

## Demo API

The deployed Swagger UI is at <https://backend-final-project-production-ed7dc795.up.railway.app/api/docs>. The deployed database is seeded with these shared demonstration accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@hotel.com` | `Password123!` |
| User | `user@hotel.com` | `Password123!` |

In Swagger, use `POST /auth/login` with either account to get an access token. Click **Authorize** and enter the token to try protected endpoints. Room listing and search are public.

`GET /rooms` returns the seeded rooms:

| Room | Capacity | Price per night |
| --- | ---: | ---: |
| Deluxe Ocean Suite | 2 | 250.00 |
| Standard Twin Room | 2 | 120.00 |
| Executive Penthouse | 4 | 500.00 |

These public demo credentials are for testing only; do not use them for sensitive information or other environments.

## Tests and build

From `backend/`, run unit tests:

```bash
npm test -- --runInBand
```

The end-to-end test uses its own `hotel_booking_test` database. From the repository root, start it:

```bash
docker compose --profile test up -d --wait mysql-test
```

Then from `backend/`, create the test environment file:

macOS/Linux:

```bash
cp .env.test.example .env.test
```

Windows PowerShell:

```powershell
Copy-Item .env.test.example .env.test
```

Run the end-to-end test from `backend/`:

```bash
npm run test:e2e -- --runInBand
```

The test applies migrations and cleans up its test records. It refuses to run against any database other than `hotel_booking_test`.

To build the API from `backend/`:

```bash
npm run build
```
## IF cant find the DB, try to copy DB to MySQL Workbench
```bash
DROP DATABASE IF EXISTS hotel_booking;
CREATE DATABASE IF NOT EXISTS hotel_booking
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_general_ci;
   
USE hotel_booking;
-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `capacity` INTEGER NOT NULL,
    `pricePerNight` DECIMAL(10, 2) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roomId` INTEGER NOT NULL,
    `checkIn` DATETIME(3) NOT NULL,
    `checkOut` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'CANCELLED', 'PAID') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Booking_userId_idx`(`userId`),
    INDEX `Booking_roomId_checkIn_checkOut_idx`(`roomId`, `checkIn`, `checkOut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bookingId` INTEGER NOT NULL,
    `type` ENUM('BOOKING_CREATED', 'BOOKING_CANCELLED') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `Notification_bookingId_idx`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKeyuser
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```
## Useful commands

| Task | Command | Run from |
| --- | --- | --- |
| Start development server | `npm run start:dev` | `backend/` |
| Run unit tests | `npm test -- --runInBand` | `backend/` |
| Run end-to-end tests | `npm run test:e2e -- --runInBand` | `backend/` |
| Build for production | `npm run build` | `backend/` |
| Stop Docker services | `docker compose down` | Repository root |
