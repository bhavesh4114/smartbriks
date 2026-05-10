const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_USER = {
  fullName: 'Admin',
  email: 'admin@gmail.com',
  mobileNumber: '9999999999',
  password: 'admin@123',
  role: 'ADMIN',
};

async function createDefaultAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_USER.email },
  });

  if (existingAdmin) {
    return 'Admin already exists';
  }

  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);

  await prisma.user.create({
    data: {
      fullName: ADMIN_USER.fullName,
      email: ADMIN_USER.email,
      mobileNumber: ADMIN_USER.mobileNumber,
      password: hashedPassword,
      role: ADMIN_USER.role,
    },
  });

  return 'Admin user created successfully';
}

createDefaultAdmin()
  .then((message) => {
    console.log(message);
  })
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = createDefaultAdmin;
