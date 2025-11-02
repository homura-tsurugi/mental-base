// ユーザー一覧取得
const { PrismaClient } = require('./lib/generated/prisma');

async function listUsers() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  });

  try {
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    console.log('Recent users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role} - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
