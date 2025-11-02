import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/password-reset エンドポイント統合テスト
 *
 * テスト対象: app/api/auth/password-reset/route.ts
 * 仕様書: docs/api-specs/auth-api.md
 */

describe('POST /api/auth/password-reset', () => {
  const testEmail = 'test-reset@mentalbase.local';

  // テスト用ユーザーを事前に作成
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    await prisma.user.create({
      data: {
        email: testEmail,
        name: 'リセットテストユーザー',
        password: '$2b$10$dummyhashedpassword', // ダミーのハッシュ化パスワード
      },
    });
  });

  describe('正常系テスト', () => {
    it('有効なメールアドレスでパスワードリセットリクエストが成功する', async () => {
      const response = await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();

      // リセットトークンがデータベースに作成されたことを確認
      const token = await prisma.passwordResetToken.findFirst({
        where: {
          user: { email: testEmail },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(token).toBeDefined();
      expect(token?.token).toBeDefined();
      expect(token?.expires).toBeDefined();

      // トークンの有効期限が1時間後に設定されていることを確認
      const now = new Date();
      const expiryTime = new Date(token!.expires);
      const diffInMinutes = (expiryTime.getTime() - now.getTime()) / (1000 * 60);
      expect(diffInMinutes).toBeGreaterThan(55); // 約1時間（55分以上）
      expect(diffInMinutes).toBeLessThan(65); // 約1時間（65分以内）
    });

    it('セキュアなトークンが生成される（32バイトhex）', async () => {
      const response = await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      expect(response.status).toBe(200);

      const token = await prisma.passwordResetToken.findFirst({
        where: {
          user: { email: testEmail },
        },
        orderBy: { createdAt: 'desc' },
      });

      // トークンが64文字のhex文字列であることを確認（32バイト = 64文字hex）
      expect(token?.token).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('バリデーションテスト', () => {
    it('メールアドレスが無効な形式の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('メールアドレスが空の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('セキュリティテスト', () => {
    it('存在しないメールアドレスでも成功レスポンスを返す（情報漏洩防止）', async () => {
      const response = await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      });

      const data = await response.json();

      // ユーザーの存在有無を漏らさないため、成功レスポンスを返す
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // しかし、実際にはトークンは作成されていない
      const token = await prisma.passwordResetToken.findFirst({
        where: {
          user: { email: 'nonexistent@example.com' },
        },
      });
      expect(token).toBeNull();
    });

    it('既存のリセットトークンが削除され、新しいトークンが作成される', async () => {
      // 最初のリセットリクエスト
      await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const firstToken = await prisma.passwordResetToken.findFirst({
        where: {
          user: { email: testEmail },
        },
      });

      // 2回目のリセットリクエスト
      await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機
      await fetch('http://localhost:3247/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
        }),
      });

      const secondToken = await prisma.passwordResetToken.findFirst({
        where: {
          user: { email: testEmail },
        },
      });

      // トークンが更新されていることを確認
      expect(firstToken?.token).not.toBe(secondToken?.token);
    });
  });
});
