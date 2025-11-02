// SQLマイグレーションを実行
const { PrismaClient } = require('./lib/generated/prisma');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  });

  try {
    console.log('Reading migration SQL file...');
    const sqlFile = path.join(__dirname, 'migrate-phase2.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executing migration...');

    // 全体を1つのトランザクションとして実行
    // PgBouncerでは複数ステートメントを含むクエリが実行できないため、
    // 1行ずつ実行する必要がある

    // コメント行を除外
    const lines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('--');
    });

    // セミコロンで終わるまでを1つのステートメントとして扱う
    let currentStatement = '';
    const statements = [];

    for (const line of lines) {
      currentStatement += line + '\n';
      if (line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    for (const statement of statements) {
      try {
        if (statement.includes('SELECT')) {
          const result = await prisma.$queryRawUnsafe(statement);
          console.log('✅ Migration completed:', result);
        } else {
          await prisma.$executeRawUnsafe(statement);
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log('✅ Executed:', preview + '...');
        }
      } catch (error) {
        console.error(`❌ Failed to execute: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log('\n✅ All migrations executed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
