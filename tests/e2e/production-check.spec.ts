import { test, expect } from '@playwright/test';

// production-check.spec.ts: 本番環境アクセス確認（複数URLチェック）

const PRODUCTION_URLS = [
  'https://mental-base-mvp.vercel.app',
  'https://mental-base-1mcsyss6p-homura-tsurugis-projects.vercel.app',
  'https://mental-base-d2hmz2ed4-homura-tsurugis-projects.vercel.app',
  'https://mental-base-eo0iwk30p-homura-tsurugis-projects.vercel.app',
];

const TEST_USER_EMAIL = 'test@mentalbase.local';
const TEST_USER_PASSWORD = 'MentalBase2025!Dev';

test.describe('本番環境アクセス確認', () => {
  for (const url of PRODUCTION_URLS) {
    test(`${url} - アクセステスト`, async ({ page }) => {
      console.log(`Testing URL: ${url}`);

      try {
        await page.goto(url, { timeout: 10000 });

        // ページタイトルを取得
        const title = await page.title();
        console.log(`Page title: ${title}`);

        // スクリーンショット撮影
        const urlSlug = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-');
        await page.screenshot({ path: `tests/screenshots/prod-${urlSlug}.png` });

        // Vercelログインページでないことを確認
        const isVercelLogin = title.includes('Login – Vercel');
        if (isVercelLogin) {
          console.log(`❌ Vercel protection detected on ${url}`);
        } else {
          console.log(`✅ App accessible on ${url}`);
        }

        expect(isVercelLogin).toBe(false);
      } catch (error) {
        console.error(`Failed to access ${url}:`, error);
        throw error;
      }
    });
  }

  test('ログイン成功テスト（アクセス可能なURLで）', async ({ page }) => {
    // まず.vercel.appのメインドメインを試す
    const mainUrl = 'https://mental-base-mvp.vercel.app';

    try {
      await page.goto(`${mainUrl}/auth`, { timeout: 10000 });

      const title = await page.title();
      console.log(`Auth page title: ${title}`);

      // Vercelログインページの場合はスキップ
      if (title.includes('Login – Vercel')) {
        console.log('⚠️ Vercel protection enabled, skipping login test');
        test.skip();
        return;
      }

      // ログイン画面が表示されることを確認
      const loginTitle = page.locator('[data-testid="login-title"]');
      await expect(loginTitle).toBeVisible({ timeout: 5000 });

      // メールアドレスとパスワードを入力
      const emailInput = page.locator('[data-testid="login-email-input"]');
      const passwordInput = page.locator('[data-testid="login-password-input"]');
      const loginButton = page.locator('[data-testid="login-button"]');

      await emailInput.fill(TEST_USER_EMAIL);
      await passwordInput.fill(TEST_USER_PASSWORD);

      // ログインボタンをクリック
      await loginButton.click();

      // ホームページにリダイレクトされることを確認
      await page.waitForURL(`${mainUrl}/`, { timeout: 10000 });

      // スクリーンショット撮影
      await page.screenshot({ path: 'tests/screenshots/production-login-success.png' });

      console.log('✅ 本番環境でのログイン成功！');
      expect(page.url()).toBe(`${mainUrl}/`);
    } catch (error) {
      console.error('Login test failed:', error);
      await page.screenshot({ path: 'tests/screenshots/production-login-failed.png' });
      throw error;
    }
  });
});
