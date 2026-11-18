import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Default Admin Account
  const admin = await prisma.user.create({
    data: {
      name: 'Hotel Administrator',
      email: 'admin@hotel.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Default Test User Account
  const user = await prisma.user.create({
    data: {
      name: 'Hotel Test User',
      email: 'user@hotel.com',
      passwordHash: hashedPassword,
      role: 'USER',
    },
  });

  // 3. Create Sample Rooms for Swagger Testing
  await prisma.room.createMany({
    data: [
      {
        name: 'Deluxe Ocean Suite',
        description: 'Spacious room with a king-sized bed and ocean view.',
        pricePerNight: 250.0,
        capacity: 2,
      },
      {
        name: 'Standard Twin Room',
        description: 'Cozy room equipped with two single beds.',
        pricePerNight: 120.0,
        capacity: 2,
      },
      {
        name: 'Executive Penthouse',
        description: 'Luxury top-floor suite with private balcony and Jacuzzi.',
        pricePerNight: 500.0,
        capacity: 4,
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log({ admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });