// Direct database test
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDB() {
  try {
    console.log('Testing database connection...');

    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);

    // Test user creation
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7);
    const email = 'test-db-' + uniqueId + '@mentalbase.local';

    console.log('\nTesting user creation with email:', email);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email,
        password: '$2b$10$abcdefghijklmnopqrstuv', // Dummy bcrypt hash
      },
    });

    console.log('User created successfully:', user);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user deleted');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
