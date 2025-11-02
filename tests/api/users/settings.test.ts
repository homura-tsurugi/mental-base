import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * GET /api/users/settings エンドポイント統合テスト
 * PUT /api/users/settings エンドポイント統合テスト
 *
 * テスト対象: app/api/users/settings/route.ts
 * 仕様書: docs/api-specs/settings-api.md
 */

describe('User Settings API Tests', () => {
  const testEmail = 'test-settings@mentalbase.local';
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
        name: '設定テストユーザー',
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

  describe('GET /api/users/settings', () => {
    describe('正常系テスト', () => {
      it('デフォルト設定が自動作成されて取得できる', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'GET',
          headers: {
            Cookie: authCookie,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.userId).toBe(testUserId);
        expect(data.data.emailNotifications).toBe(true); // デフォルト値
        expect(data.data.theme).toBe('professional'); // デフォルト値
        expect(data.data.updatedAt).toBeDefined();
      });

      it('既存の設定がある場合は設定を取得できる', async () => {
        // 事前に設定を作成
        await prisma.userSettings.create({
          data: {
            userId: testUserId,
            emailNotifications: false,
            reminderTime: '10:30',
            theme: 'warm',
          },
        });

        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'GET',
          headers: {
            Cookie: authCookie,
          },
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.emailNotifications).toBe(false);
        expect(data.data.reminderTime).toBe('10:30');
        expect(data.data.theme).toBe('warm');
      });
    });

    describe('認証エラーテスト', () => {
      it('認証なしでアクセスすると401エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'GET',
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });
    });
  });

  describe('PUT /api/users/settings', () => {
    describe('正常系テスト', () => {
      it('有効なデータで通知設定を更新できる', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: false,
            reminderTime: '09:00',
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.emailNotifications).toBe(false);
        expect(data.data.reminderTime).toBe('09:00');

        // データベースで更新を確認
        const settings = await prisma.userSettings.findUnique({
          where: { userId: testUserId },
        });
        expect(settings?.emailNotifications).toBe(false);
        expect(settings?.reminderTime).toBe('09:00');
      });

      it('reminderTimeなしで設定を更新できる', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.emailNotifications).toBe(true);
        expect(data.data.reminderTime).toBeNull();
      });

      it('設定が存在しない場合は新規作成される（upsert）', async () => {
        // 設定が存在しないことを確認
        await prisma.userSettings.deleteMany({
          where: { userId: testUserId },
        });

        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
            reminderTime: '18:00',
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // データベースで作成を確認
        const settings = await prisma.userSettings.findUnique({
          where: { userId: testUserId },
        });
        expect(settings).toBeDefined();
        expect(settings?.emailNotifications).toBe(true);
        expect(settings?.reminderTime).toBe('18:00');
      });
    });

    describe('バリデーションテスト', () => {
      it('emailNotificationsが未定義の場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            reminderTime: '09:00',
            // emailNotifications missing
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });

      it('reminderTimeが無効な形式の場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
            reminderTime: '25:99', // 無効な時刻
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('HH:mm');
      });

      it('reminderTimeがHH:mm形式でない場合、400エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
            reminderTime: '9:00', // 先頭0なし
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe('認証エラーテスト', () => {
      it('認証なしでアクセスすると401エラーを返す', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailNotifications: false,
            reminderTime: '09:00',
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
      });
    });

    describe('エッジケーステスト', () => {
      it('有効な時刻範囲の境界値（00:00）を受け入れる', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
            reminderTime: '00:00',
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.reminderTime).toBe('00:00');
      });

      it('有効な時刻範囲の境界値（23:59）を受け入れる', async () => {
        const response = await fetch('http://localhost:3247/api/users/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            emailNotifications: true,
            reminderTime: '23:59',
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.reminderTime).toBe('23:59');
      });
    });
  });
});
