/**
 * Mental-Base データベースシードスクリプト
 * E2Eテスト用のモックユーザーを作成
 */

import { PrismaClient } from '../lib/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // E2Eテスト用モックユーザー
  const mockUserId = 'test-user-id';
  const mockEmail = 'test@mentalbase.local';
  const mockPassword = 'MentalBase2025!Dev';

  // 既存のモックユーザーを確認
  const existingUser = await prisma.user.findUnique({
    where: { id: mockUserId },
  });

  if (existingUser) {
    console.log(`✅ Mock user already exists: ${mockEmail} (${mockUserId})`);
    return;
  }

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(mockPassword, 10);

  // モックユーザーを作成
  const mockUser = await prisma.user.create({
    data: {
      id: mockUserId,
      email: mockEmail,
      name: 'Test User',
      password: hashedPassword,
      role: 'client',
      isMentor: false,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created mock user: ${mockUser.email} (${mockUser.id})`);

  // UserSettings も作成
  const userSettings = await prisma.userSettings.create({
    data: {
      userId: mockUser.id,
      emailNotifications: true,
      theme: 'professional',
    },
  });

  console.log(`✅ Created user settings for: ${mockUser.email}`);
  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
