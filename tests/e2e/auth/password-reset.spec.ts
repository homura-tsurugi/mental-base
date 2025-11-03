// パスワードリセット機能のE2Eテスト
// 完全なフロー検証: リクエスト → トークン取得 → パスワード更新 → ログイン

import { test, expect } from '@playwright/test';
import { prisma } from '../../../lib/prisma';

test.describe('パスワードリセット機能', () => {
  const testEmail = 'test@mentalbase.local';
  const oldPassword = 'MentalBase2025!Dev';
  const newPassword = 'NewPassword2025!';

  test.beforeEach(async ({ page, context }) => {
    // ブラウザストレージとCookieをクリア
    await context.clearCookies();
    await context.clearPermissions();

    // 認証ページに移動
    await page.goto('http://localhost:3247/auth');

    // ページのローカルストレージとセッションストレージをクリア
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // ページをリロードして完全にクリーンな状態にする
    await page.reload();

    await expect(page.locator('[data-testid="auth-card"]')).toBeVisible();
  });

  test.afterEach(async () => {
    // テスト後、パスワードを元に戻す
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(oldPassword, 10);

    await prisma.user.update({
      where: { email: testEmail },
      data: { password: hashedPassword },
    });

    // 全てのリセットトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: {
        user: { email: testEmail },
      },
    });
  });

  test('TEST-1: パスワードリセットリクエスト成功', async ({ page }) => {
    // 「パスワードを忘れた場合」をクリック
    await page.locator('[data-testid="forgot-password-link"]').click();

    // パスワードリセットビューが表示される
    await expect(page.locator('text=パスワードリセット')).toBeVisible();

    // メールアドレスを入力
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(testEmail);

    // ダイアログリスナーを設定してからボタンをクリック
    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('button:has-text("送信")').click();

    // ダイアログを処理
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('パスワードリセットリンクを送信しました');
    await dialog.accept();

    // ログイン画面に戻る
    await expect(page.locator('[data-testid="mentor-option"]')).toBeVisible();
  });

  test('TEST-2: 完全なパスワードリセットフロー（トークン → パスワード更新 → ログイン）', async ({ page }) => {
    // ステップ1: パスワードリセットリクエスト
    await page.locator('[data-testid="forgot-password-link"]').click();
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(testEmail);

    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('button:has-text("送信")').click();
    const dialog = await dialogPromise;
    await dialog.accept();

    // ステップ2: データベースからトークンを取得（実際のメール送信の代わり）
    await page.waitForTimeout(500); // トークン作成を待つ

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        user: { email: testEmail },
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(resetToken).toBeTruthy();

    // ステップ3: パスワードリセットページへ移動
    await page.goto(`http://localhost:3247/auth/reset-password?token=${resetToken!.token}`);

    // ステップ4: 新しいパスワードを入力
    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    // ステップ5: パスワード更新
    await page.locator('[data-testid="reset-password-button"]').click();

    // ステップ6: 成功画面が表示される
    await expect(page.locator('text=パスワードを更新しました')).toBeVisible({ timeout: 10000 });

    // ステップ7: 新しいパスワードでログインできることを確認
    await page.goto('http://localhost:3247/auth');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    await page.locator('[data-testid="mentor-option"]').click();
    await page.locator('[data-testid="login-email-input"]').fill(testEmail);
    await page.locator('[data-testid="login-password-input"]').fill(newPassword);
    await page.locator('[data-testid="login-button"]').click();

    // ログイン成功 - /admin にリダイレクト
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('TEST-3: パスワード不一致エラー', async ({ page }) => {
    // トークンを生成
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.findUnique({ where: { email: testEmail } });

    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // パスワードリセットページへ移動
    await page.goto(`http://localhost:3247/auth/reset-password?token=${token}`);

    // 異なるパスワードを入力
    await page.locator('[data-testid="new-password-input"]').fill('Password123!');
    await page.locator('[data-testid="confirm-password-input"]').fill('DifferentPass123!');

    await page.locator('[data-testid="reset-password-button"]').click();

    // エラーメッセージが表示される
    await expect(page.locator('text=パスワードが一致しません')).toBeVisible();
  });

  test('TEST-4: パスワードの長さ不足エラー', async ({ page }) => {
    // トークンを生成
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.findUnique({ where: { email: testEmail } });

    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // パスワードリセットページへ移動
    await page.goto(`http://localhost:3247/auth/reset-password?token=${token}`);

    // 短いパスワードを入力
    await page.locator('[data-testid="new-password-input"]').fill('Short1!');
    await page.locator('[data-testid="confirm-password-input"]').fill('Short1!');

    await page.locator('[data-testid="reset-password-button"]').click();

    // エラーメッセージが表示される
    await expect(page.locator('text=パスワードは8文字以上である必要があります')).toBeVisible();
  });

  test('TEST-5: 無効なトークンでエラー', async ({ page }) => {
    // 無効なトークンでパスワードリセットページへ移動
    await page.goto('http://localhost:3247/auth/reset-password?token=invalid-token-12345');

    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    await page.locator('[data-testid="reset-password-button"]').click();

    // エラーメッセージが表示される
    await expect(page.locator('text=無効なトークンです')).toBeVisible({ timeout: 5000 });
  });

  test('TEST-6: 有効期限切れトークンでエラー', async ({ page }) => {
    // 有効期限切れトークンを生成
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.findUnique({ where: { email: testEmail } });

    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        token,
        expires: new Date(Date.now() - 1000), // 1秒前に有効期限切れ
      },
    });

    // パスワードリセットページへ移動
    await page.goto(`http://localhost:3247/auth/reset-password?token=${token}`);

    await page.locator('[data-testid="new-password-input"]').fill(newPassword);
    await page.locator('[data-testid="confirm-password-input"]').fill(newPassword);

    await page.locator('[data-testid="reset-password-button"]').click();

    // エラーメッセージが表示される
    await expect(page.locator('text=トークンの有効期限が切れています')).toBeVisible({ timeout: 5000 });
  });

  test('TEST-7: 存在しないメールアドレスでもリクエスト成功（セキュリティ）', async ({ page }) => {
    await page.locator('[data-testid="forgot-password-link"]').click();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('nonexistent@example.com');

    // ダイアログリスナーを設定してからボタンをクリック
    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('button:has-text("送信")').click();

    // ダイアログを処理
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('パスワードリセットリンクを送信しました');
    await dialog.accept();

    // ログイン画面に戻る
    await expect(page.locator('[data-testid="mentor-option"]')).toBeVisible();

    // トークンが作成されていないことを確認
    const tokenCount = await prisma.passwordResetToken.count({
      where: {
        user: { email: 'nonexistent@example.com' },
      },
    });

    expect(tokenCount).toBe(0);
  });
});
