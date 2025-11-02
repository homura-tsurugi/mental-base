import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * POST /api/users/password エンドポイント統合テスト
 *
 * テスト対象: app/api/users/password/route.ts
 * 仕様書: docs/api-specs/settings-api.md
 */

describe('POST /api/users/password', () => {
  const testEmail = 'test-password@mentalbase.local';
  const testPassword = 'OldPassword123!';
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
        name: 'パスワードテストユーザー',
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

  describe('正常系テスト', () => {
    it('有効なデータでパスワードを変更できる', async () => {
      const newPassword = 'NewPassword456!';

      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('パスワードを変更しました');

      // データベースで新しいパスワードが正しくハッシュ化されていることを確認
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      const isNewPasswordValid = await bcrypt.compare(newPassword, user!.password);
      expect(isNewPasswordValid).toBe(true);

      // 古いパスワードでログインできないことを確認
      const isOldPasswordValid = await bcrypt.compare(testPassword, user!.password);
      expect(isOldPasswordValid).toBe(false);
    });

    it('パスワードがbcryptでハッシュ化される（ソルトラウンド10）', async () => {
      const newPassword = 'SecureNewPassword789!';

      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        }),
      });

      expect(response.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      // パスワードが平文で保存されていないことを確認
      expect(user?.password).not.toBe(newPassword);

      // bcryptでハッシュ化されたパスワードか確認
      expect(user?.password).toMatch(/^\$2[aby]\$\d{2}\$/);
    });
  });

  describe('バリデーションテスト', () => {
    it('新しいパスワードが8文字未満の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: 'Short1!', // 7文字
          confirmPassword: 'Short1!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('新しいパスワードと確認用パスワードが一致しない場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword456!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('一致しません');
    });

    it('必須フィールドが欠けている場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: 'NewPassword123!',
          // confirmPassword missing
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('現在のパスワードが間違っている場合、401エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('正しくありません');
    });
  });

  describe('認証エラーテスト', () => {
    it('認証なしでアクセスすると401エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('セキュリティテスト', () => {
    it('パスワード変更後、古いパスワードではログインできない', async () => {
      const newPassword = 'BrandNewPassword999!';

      // パスワード変更
      await fetch('http://localhost:3247/api/users/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        }),
      });

      // 古いパスワードでログイン試行
      const loginResponse = await fetch('http://localhost:3247/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword, // 古いパスワード
        }),
      });

      // ログインに失敗することを確認
      expect(loginResponse.status).not.toBe(200);

      // 新しいパスワードでログイン試行
      const newLoginResponse = await fetch('http://localhost:3247/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: newPassword, // 新しいパスワード
        }),
      });

      // ログインに成功することを確認
      expect(newLoginResponse.status).toBe(200);
    });
  });
});
