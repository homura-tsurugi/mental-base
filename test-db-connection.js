// データベース接続テスト
const { PrismaClient } = require('./lib/generated/prisma');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info', 'query'],
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  });

  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    // 簡単なクエリを実行
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);

    // Userテーブルの件数を確認
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);

    // Goalテーブルの件数を確認
    const goalCount = await prisma.goal.count();
    console.log(`✅ Goal count: ${goalCount}`);

    // Taskテーブルの件数を確認
    const taskCount = await prisma.task.count();
    console.log(`✅ Task count: ${taskCount}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
