import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Default Admin Account
  const admin = await prisma.user.create({
    data: {
      email: 'admin@hotel.com',
      password: hashedPassword,
      role: 'ADMIN', // Adjust role enum/string based on your schema
    },
  });

  // 2. Create Default Test User Account
  const user = await prisma.user.create({
    data: {
      email: 'user@hotel.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  // 3. Create Sample Rooms for Swagger Testing
  await prisma.room.createMany({
    data: [
      {
        name: 'Deluxe Ocean Suite',
        description: 'Spacious room with a king-sized bed and ocean view.',
        price: 250.0,
        capacity: 2,
        isAvailable: true,
      },
      {
        name: 'Standard Twin Room',
        description: 'Cozy room equipped with two single beds.',
        price: 120.0,
        capacity: 2,
        isAvailable: true,
      },
      {
        name: 'Executive Penthouse',
        description: 'Luxury top-floor suite with private balcony and Jacuzzi.',
        price: 500.0,
        capacity: 4,
        isAvailable: true,
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