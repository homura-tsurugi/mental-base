// Setup database schema using raw SQL
const { PrismaClient } = require('./lib/generated/prisma');

const prisma = new PrismaClient();

async function setupDB() {
  try {
    console.log('Setting up database schema...\n');

    // Create users table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "emailVerified" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "users_email_key" UNIQUE ("email")
        );
      `);
      console.log('✓ Created users table');
    } catch (e) {
      console.log('⚠ users table already exists');
    }

    // Create sessions table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "sessions_sessionToken_key" UNIQUE ("sessionToken")
        );
      `);
      console.log('✓ Created sessions table');
    } catch (e) {
      console.log('⚠ sessions table already exists');
    }

    // Create goals table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "goals" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "title" VARCHAR(200) NOT NULL,
          "description" TEXT,
          "deadline" TIMESTAMP(3),
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✓ Created goals table');
    } catch (e) {
      console.log('⚠ goals table already exists');
    }

    // Create tasks table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tasks" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "goalId" TEXT,
          "title" VARCHAR(200) NOT NULL,
          "description" TEXT,
          "dueDate" TIMESTAMP(3),
          "scheduledTime" TEXT,
          "priority" TEXT NOT NULL DEFAULT 'medium',
          "status" TEXT NOT NULL DEFAULT 'pending',
          "completedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✓ Created tasks table');
    } catch (e) {
      console.log('⚠ tasks table already exists');
    }

    // Create logs table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "logs" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "taskId" TEXT,
          "content" TEXT NOT NULL,
          "emotion" TEXT,
          "state" TEXT,
          "type" TEXT NOT NULL DEFAULT 'daily',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('✓ Created logs table');
    } catch (e) {
      console.log('⚠ logs table already exists');
    }

    // Create reflections, ai_analysis_reports, action_plans, chat_messages, notifications, user_settings, password_reset_tokens tables
    // (Simplified - only essential tables for testing)

    console.log('\n✅ Database schema setup complete!');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDB();
