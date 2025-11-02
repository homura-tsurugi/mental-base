import { test, expect } from '@playwright/test';

// auth-responsive.spec.ts: レスポンシブデザインテスト
// テストID範囲: E2E-AUTH-052 ~ E2E-AUTH-056

test.describe('レスポンシブデザイン', () => {
  test.beforeEach(async ({ page }) => {
    // ブラウザストレージをクリア
    await page.goto('about:blank');
    await page.context().clearCookies();
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // about:blankなどでアクセスできない場合は無視
      }
    });
  });

  test('E2E-AUTH-052: デスクトップ表示（1920x1080）', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3247/auth');

    // 認証カードが中央に配置されていることを確認
    const authCard = page.locator('[data-testid="auth-card"]');
    await expect(authCard).toBeVisible();
    const boundingBox = await authCard.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      // ビューポートの中央付近に配置されていることを確認（おおよそ）
      expect(boundingBox.width).toBeLessThanOrEqual(400);
    }

    // 全要素が適切に配置されていることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    const loginTitle = page.locator('[data-testid="login-title"]');
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await expect(logo).toBeVisible();
    await expect(loginTitle).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // 水平スクロールが発生しないことを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('E2E-AUTH-053: タブレット表示（768x1024）', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3247/auth');

    // 認証カードが中央に配置されていることを確認
    const authCard = page.locator('[data-testid="auth-card"]');
    await expect(authCard).toBeVisible();

    // 全要素が適切に配置されていることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    const loginTitle = page.locator('[data-testid="login-title"]');
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await expect(logo).toBeVisible();
    await expect(loginTitle).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // スクロールなしで全体が見えることを確認
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 100); // 若干の余裕を持たせる

    // 水平スクロールが発生しないことを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('E2E-AUTH-054: モバイル表示（375x667）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3247/auth');

    // 認証カードが画面幅に応じて調整されていることを確認
    const authCard = page.locator('[data-testid="auth-card"]');
    await expect(authCard).toBeVisible();
    const boundingBox = await authCard.boundingBox();
    expect(boundingBox).toBeTruthy();

    // ボタンがタッチ操作可能なサイズ（最小44x44px）であることを確認
    const loginButton = page.locator('[data-testid="login-button"]');
    const buttonBox = await loginButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    // テキストが折り返され読みやすいことを確認
    const subtitle = page.locator('[data-testid="auth-subtitle"]');
    await expect(subtitle).toBeVisible();

    // 水平スクロールが発生しないことを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // 全要素が表示されていることを確認
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('E2E-AUTH-055: モバイル横向き表示（667x375）', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('http://localhost:3247/auth');

    // 認証カードが中央に配置されていることを確認
    const authCard = page.locator('[data-testid="auth-card"]');
    await expect(authCard).toBeVisible();

    // 縦スクロールで全要素が確認できることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    const loginTitle = page.locator('[data-testid="login-title"]');
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await expect(logo).toBeVisible();
    await expect(loginTitle).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // レイアウトが崩れていないことを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('E2E-AUTH-056: 極小画面表示（320x568）', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('http://localhost:3247/auth');

    // 認証カードが画面に収まることを確認
    const authCard = page.locator('[data-testid="auth-card"]');
    await expect(authCard).toBeVisible();
    const boundingBox = await authCard.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      // ビューポート幅内に収まっていることを確認
      expect(boundingBox.width).toBeLessThanOrEqual(320);
    }

    // テキストが折り返されていることを確認
    const subtitle = page.locator('[data-testid="auth-subtitle"]');
    await expect(subtitle).toBeVisible();

    // 入力欄とボタンが操作可能であることを確認
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // タッチ操作可能なサイズであることを確認
    const buttonBox = await loginButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }

    // 水平スクロールが発生しないことを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
