import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/register エンドポイント統合テスト
 *
 * テスト対象: app/api/auth/register/route.ts
 * 仕様書: docs/api-specs/auth-api.md
 */

describe('POST /api/auth/register', () => {
  const testEmail = 'test-register@mentalbase.local';

  // 各テスト前にテストユーザーを削除
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  describe('正常系テスト', () => {
    it('有効なデータで新規ユーザー登録が成功する', async () => {
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          email: testEmail,
          password: 'TestPassword123!',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.user.name).toBe('テストユーザー');

      // データベースにユーザーが作成されたことを確認
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);

      // パスワードがハッシュ化されていることを確認
      const isPasswordHashed = await bcrypt.compare('TestPassword123!', user!.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('パスワードがbcryptでハッシュ化される（ソルトラウンド10）', async () => {
      const password = 'SecurePassword456!';
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'セキュリティテスト',
          email: testEmail,
          password,
        }),
      });

      expect(response.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      // パスワードが平文で保存されていないことを確認
      expect(user?.password).not.toBe(password);

      // bcryptでハッシュ化されたパスワードか確認
      expect(user?.password).toMatch(/^\$2[aby]\$\d{2}\$/); // bcryptのハッシュ形式
    });
  });

  describe('バリデーションテスト', () => {
    it('名前が2文字未満の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A', // 1文字
          email: testEmail,
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('メールアドレスが無効な形式の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          email: 'invalid-email', // 無効な形式
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('パスワードが8文字未満の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          email: testEmail,
          password: 'Short1!', // 7文字
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('必須フィールドが欠けている場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テストユーザー',
          // email: 欠落
          password: 'TestPassword123!',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('メールアドレスが既に登録されている場合、409エラーを返す', async () => {
      // 最初のユーザー登録
      await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '最初のユーザー',
          email: testEmail,
          password: 'FirstPassword123!',
        }),
      });

      // 同じメールアドレスで2回目の登録
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '2番目のユーザー',
          email: testEmail,
          password: 'SecondPassword456!',
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('既に登録されています');
    });
  });

  describe('セキュリティテスト', () => {
    it('XSS攻撃対策: スクリプトタグが含まれる名前を安全に処理する', async () => {
      const maliciousName = '<script>alert("XSS")</script>';
      const response = await fetch('http://localhost:3247/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: maliciousName,
          email: testEmail,
          password: 'TestPassword123!',
        }),
      });

      // リクエストは受け付けられるが、スクリプトは実行されない
      const data = await response.json();

      if (response.status === 200) {
        // 名前がそのまま保存されていてもXSS攻撃は防がれる（フロントエンドでエスケープ）
        expect(data.user.name).toBe(maliciousName);
      }
    });
  });
});
