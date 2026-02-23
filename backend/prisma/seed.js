import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';

const SALT_ROUNDS = 12;

async function main() {
  const adminEmail = 'admin@gmail.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin user already exists.');
    return;
  }
  const hashedPassword = await bcrypt.hash('admin@123', SALT_ROUNDS);
  await prisma.user.create({
    data: {
      fullName: 'Admin',
      email: adminEmail,
      mobileNumber: '9999999999',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created: admin@gmail.com / admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
