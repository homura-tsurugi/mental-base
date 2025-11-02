// Execute schema SQL using Prisma
const { PrismaClient } = require('./lib/generated/prisma');
const fs = require('fs');

const prisma = new PrismaClient();

async function executeSchema() {
  try {
    console.log('Reading setup-schema.sql...');
    const sql = fs.readFileSync('setup-schema.sql', 'utf-8');

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('[dotenv'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
          console.log(statement.substring(0, 100) + '...');

          await prisma.$executeRawUnsafe(statement + ';');
          console.log('✓ Success');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.code === '42P07') {
            console.log('⚠ Already exists, skipping');
          } else {
            console.error('✗ Error:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Schema setup complete!');
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeSchema();
