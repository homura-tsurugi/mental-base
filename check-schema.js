// Check actual database schema
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('Checking users table structure...\n');

    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('Users table columns:');
    console.table(result);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
