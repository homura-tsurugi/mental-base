// ロールベース認証のE2Eテスト
// メンター/クライアント選択とロール判定の動作確認

import { test, expect } from '@playwright/test';

test.describe('ロールベース認証', () => {
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

  test('TEST-1: メンター専用アカウントでメンターログイン成功', async ({ page }) => {
    // メンターを選択
    await page.locator('[data-testid="mentor-option"]').click();

    // メンター選択が反映されていることを確認
    await expect(page.locator('[data-testid="mentor-option"]')).toHaveClass(/border-\[var\(--primary\)\]/);

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('test@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // /admin にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    // メンターダッシュボードが表示されることを確認
    await expect(page.locator('[data-testid="page-title"]')).toContainText('メンターダッシュボード');
  });

  test('TEST-2: メンター専用アカウントでクライアントログイン失敗', async ({ page }) => {
    // クライアントを選択
    await page.locator('[data-testid="client-option"]').click();

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('test@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=クライアント権限がありません')).toBeVisible({ timeout: 5000 });

    // 認証ページに留まることを確認
    await expect(page).toHaveURL(/\/auth/);
  });

  test('TEST-3: クライアント専用アカウントでクライアントログイン成功', async ({ page }) => {
    // クライアントを選択
    await page.locator('[data-testid="client-option"]').click();

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('client-test@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // /client にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/client/, { timeout: 10000 });
  });

  test('TEST-4: クライアント専用アカウントでメンターログイン失敗', async ({ page }) => {
    // メンターを選択
    await page.locator('[data-testid="mentor-option"]').click();

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('client-test@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=メンター権限がありません')).toBeVisible({ timeout: 5000 });

    // 認証ページに留まることを確認
    await expect(page).toHaveURL(/\/auth/);
  });

  test('TEST-5: 両方の権限を持つアカウントでメンターログイン成功', async ({ page }) => {
    // メンターを選択
    await page.locator('[data-testid="mentor-option"]').click();

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('dual@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // /admin にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('TEST-6: 両方の権限を持つアカウントでクライアントログイン成功', async ({ page }) => {
    // クライアントを選択
    await page.locator('[data-testid="client-option"]').click();

    // ログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('dual@mentalbase.local');
    await page.locator('[data-testid="login-password-input"]').fill('MentalBase2025!Dev');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // /client にリダイレクトされることを確認
    await expect(page).toHaveURL(/\/client/, { timeout: 10000 });
  });

  test('TEST-7: 無効な認証情報でログイン失敗', async ({ page }) => {
    // メンターを選択
    await page.locator('[data-testid="mentor-option"]').click();

    // 無効なログイン情報入力
    await page.locator('[data-testid="login-email-input"]').fill('invalid@test.com');
    await page.locator('[data-testid="login-password-input"]').fill('wrongpassword');

    // ログインボタンをクリック
    await page.locator('[data-testid="login-button"]').click();

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible({ timeout: 5000 });

    // 認証ページに留まることを確認
    await expect(page).toHaveURL(/\/auth/);
  });
});
