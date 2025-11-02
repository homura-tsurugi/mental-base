// テストユーザー取得
const { PrismaClient } = require('./lib/generated/prisma');

async function getTestUser() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  });

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'test@mentalbase.local'
      }
    });

    if (user) {
      console.log('Test user found:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
    } else {
      console.log('Test user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTestUser();
