import { test, expect } from '@playwright/test';

// production-login.spec.ts: 本番環境ログイン検証テスト
// 本番デプロイ後の動作確認用

const PRODUCTION_URL = 'https://mental-base-1mcsyss6p-homura-tsurugis-projects.vercel.app';
const TEST_USER_EMAIL = 'test@mentalbase.local';
const TEST_USER_PASSWORD = 'MentalBase2025!Dev';

test.describe('本番環境ログイン検証', () => {
  test('PROD-001: 本番環境へのアクセス確認', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // ページタイトルが表示されることを確認
    await expect(page).toHaveTitle(/COM:PASS/);

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/production-home.png' });
  });

  test('PROD-002: 本番環境でのログイン成功', async ({ page }) => {
    // 認証ページに遷移
    await page.goto(`${PRODUCTION_URL}/auth`);

    // ログイン画面が表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();

    // メールアドレスとパスワードを入力
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill(TEST_USER_EMAIL);
    await passwordInput.fill(TEST_USER_PASSWORD);

    // ログイン前のスクリーンショット
    await page.screenshot({ path: 'tests/screenshots/production-login-before.png' });

    // ログインボタンをクリック
    await loginButton.click();

    // ローディング状態を確認
    await expect(loginButton).toContainText('ログイン中...');
    await expect(loginButton).toBeDisabled();

    // ホームページにリダイレクトされることを確認
    await page.waitForURL(`${PRODUCTION_URL}/`, { timeout: 10000 });

    // ログイン成功のスクリーンショット
    await page.screenshot({ path: 'tests/screenshots/production-login-success.png' });

    // URLが正しいことを確認
    expect(page.url()).toBe(`${PRODUCTION_URL}/`);

    console.log('✅ 本番環境でのログイン成功！');
  });

  test('PROD-003: 本番環境のAPIエンドポイント確認', async ({ request }) => {
    // ダッシュボードAPIが存在することを確認
    const response = await request.get(`${PRODUCTION_URL}/api/dashboard`);

    // 401 Unauthorized（認証が必要）または 200 OK（認証済み）であることを確認
    expect([200, 401]).toContain(response.status());

    console.log(`API レスポンスステータス: ${response.status()}`);
  });
});
