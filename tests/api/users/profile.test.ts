import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * GET /api/users/profile エンドポイント統合テスト
 * PUT /api/users/profile エンドポイント統合テスト
 *
 * テスト対象: app/api/users/profile/route.ts
 * 仕様書: docs/api-specs/settings-api.md
 */

describe('User Profile API Tests', () => {
  const testEmail = 'test-profile@mentalbase.local';
  const testPassword = 'TestPassword123!';
  let testUserId: string;
  let authCookie: string;

  // 各テスト前にテストユーザーを作成してログイン
  beforeEach(async () => {
    // 既存のテストユーザーを削除
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // テストユーザー作成
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'テストユーザー',
        email: testEmail,
        password: hashedPassword,
      },
    });
    testUserId = user.id;

    // ログインしてセッションクッキーを取得
    authCookie = await getAuthCookie(testEmail, testPassword);
  });

  // テスト終了後にクリーンアップ
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users/profile', () => {
    describe('正常系テスト', () => {
      it('認証済みユーザーのプロフィール情報を取得できる', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'GET',
          headers: {
            Cookie: authCookie,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.id).toBe(testUserId);
        expect(data.data.email).toBe(testEmail);
        expect(data.data.name).toBe('テストユーザー');
        expect(data.data.createdAt).toBeDefined();
        expect(data.data.updatedAt).toBeDefined();
      });
    });

    describe('認証エラーテスト', () => {
      it('認証なしでアクセスすると401エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'GET',
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });
    });
  });

  describe('PUT /api/users/profile', () => {
    describe('正常系テスト', () => {
      it('有効なデータでプロフィール情報を更新できる', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: '更新されたユーザー',
            email: testEmail,
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('更新されたユーザー');
        expect(data.data.email).toBe(testEmail);

        // データベースで更新を確認
        const user = await prisma.user.findUnique({
          where: { id: testUserId },
        });
        expect(user?.name).toBe('更新されたユーザー');
      });

      it('メールアドレスを変更できる（重複なし）', async () => {
        const newEmail = 'new-email@mentalbase.local';

        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: 'テストユーザー',
            email: newEmail,
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.email).toBe(newEmail);

        // クリーンアップ
        await prisma.user.delete({ where: { email: newEmail } });
      });
    });

    describe('バリデーションテスト', () => {
      it('名前が空の場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: '',
            email: testEmail,
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      it('無効なメールアドレス形式の場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: 'テストユーザー',
            email: 'invalid-email',
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });

      it('必須フィールドが欠けている場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: 'テストユーザー',
            // email missing
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe('エラーハンドリングテスト', () => {
      it('メールアドレスが既に使用されている場合、409エラーを返す', async () => {
        // 別のユーザーを作成
        const otherEmail = 'other-user@mentalbase.local';
        await prisma.user.create({
          data: {
            name: '別のユーザー',
            email: otherEmail,
            password: await bcrypt.hash('password123', 10),
          },
        });

        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            name: 'テストユーザー',
            email: otherEmail,
          }),
        });

        expect(response.status).toBe(409);
        const data = await response.json();
        expect(data.success).toBe(false);

        // クリーンアップ
        await prisma.user.delete({ where: { email: otherEmail } });
      });
    });

    describe('認証エラーテスト', () => {
      it('認証なしでアクセスすると401エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'テストユーザー',
            email: testEmail,
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });
  });
});
