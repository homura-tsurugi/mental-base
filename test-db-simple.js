// Simple database test without raw queries
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDB() {
  try {
    console.log('Testing user creation...');

    // Test user creation
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7);
    const email = 'test-simple-' + uniqueId + '@mentalbase.local';

    console.log('Creating user with email:', email);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email,
        password: '$2b$10$abcdefghijklmnopqrstuv', // Dummy bcrypt hash
      },
    });

    console.log('User created successfully:', JSON.stringify(user, null, 2));

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Test user deleted');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
