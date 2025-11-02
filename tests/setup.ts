import '@testing-library/jest-dom';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';
import { prisma } from '@/lib/prisma';

// .env.localを明示的に読み込む（テスト環境で必須）
config({ path: '.env.local' });

// テスト前のセットアップ
beforeAll(async () => {
  // テスト環境の確認
  console.log('🧪 Test environment setup...');
  console.log('📊 DATABASE_URL configured:', process.env.DATABASE_URL ? 'YES' : 'NO');
});

// 各テストスイート前の処理
// Prisma Clientは lib/prisma.ts で statement_cache_size=0 を設定済み
beforeEach(async () => {
  // テストデータのセットアップは各テストファイルで実施
});

// 各テスト後のクリーンアップ
afterEach(async () => {
  // テストデータのクリーンアップ（必要に応じて）
});

// 全テスト終了後のクリーンアップ
afterAll(async () => {
  await prisma.$disconnect();
  console.log('🧪 Test environment teardown complete.');
});
