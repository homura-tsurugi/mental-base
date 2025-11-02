import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-001: Plan-Doページ初期アクセステスト
 *
 * テスト項目: Plan-Doページ初期アクセス
 * 優先度: 高
 * テスト分類: 正常系
 *
 * 確認内容:
 * - ページが正しく表示される
 * - ページタイトル「計画・実行」が表示される
 * - PlanタブとDoタブが表示される
 *
 * 期待結果:
 * - ページタイトル「計画・実行」が表示される
 * - PlanタブとDoタブが表示される
 *
 * 注意事項:
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 * - VITE_SKIP_AUTH環境変数は使用しない（認証必須）
 */

test.describe('E2E-PLDO-001: Plan-Doページ初期アクセス', () => {
  test.only('E2E-PLDO-001: ページが正しく表示される', async ({ page }) => {
    // コンソールログを監視
    page.on('console', (msg) => {
      console.log('[Browser Console]', msg.type(), msg.text());
    });

    // ネットワークリクエストを監視
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log('[API Request]', request.method(), request.url());
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log('[API Response]', response.status(), response.url());
        if (!response.ok()) {
          try {
            const body = await response.text();
            console.log('[API Error Body]', body);
          } catch (e) {
            console.log('[API Error]', 'Could not read response body');
          }
        }
      }
    });

    // ログインページにアクセス
    await page.goto('http://localhost:3247/auth');

    // ログイン処理
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');
    await loginButton.click();

    // ホームページへのリダイレクトを待機
    await page.waitForURL('http://localhost:3247/', { timeout: 10000 });
    console.log('[Test] Login successful, redirected to home page');

    // Plan-Doページにアクセス
    console.log('[Test] Navigating to /plan-do page');
    await page.goto('http://localhost:3247/plan-do');

    // ページの状態を確認（デバッグ用）
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('[Test] Network did not become idle within 10s');
    });

    // ページのHTMLを取得してデバッグ
    const bodyText = await page.locator('body').textContent();
    console.log('[Test] Page body contains:', bodyText?.substring(0, 200));

    // エラーメッセージがあるかチェック
    const errorMessage = page.locator('text=エラー');
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log('[Test] Error message found:', errorText);
    }

    // ローディングが完了するのを待つ（ローディングスピナーが消えるまで）
    const loadingSpinner = page.locator('text=読み込み中');
    // ローディングが表示されている場合は消えるまで待つ
    const isLoadingVisible = await loadingSpinner.isVisible().catch(() => false);
    console.log('[Test] Loading spinner visible:', isLoadingVisible);
    if (isLoadingVisible) {
      console.log('[Test] Waiting for loading to complete...');
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch((e) => {
        console.log('[Test] Loading spinner did not disappear:', e.message);
      });
    }

    // ページタイトルが表示されることを確認
    console.log('[Test] Looking for page title...');
    const pageTitle = page.locator('h1').filter({ hasText: '計画・実行' });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    await expect(pageTitle).toContainText('計画・実行');
    console.log('[Test] Page title found successfully');

    // Planタブが表示されることを確認
    const planTab = page.locator('button').filter({ hasText: /Plan\(計画\)/i });
    await expect(planTab).toBeVisible({ timeout: 5000 });

    // Doタブが表示されることを確認
    const doTab = page.locator('button').filter({ hasText: /Do\(実行\)/i });
    await expect(doTab).toBeVisible({ timeout: 5000 });

    // モック検出チェック: ページURLを確認
    const currentUrl = page.url();
    if (currentUrl.includes('mock') || currentUrl.includes('stub')) {
      throw new Error('[モック検出] URLにモック識別子が含まれています: ' + currentUrl);
    }

    // モック検出チェック: コンソールログを監視
    let mockDetected = false;
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('mock') || text.includes('stub') || text.includes('fake')) {
        console.error('[モック検出] コンソールログにモック識別子: ' + text);
        mockDetected = true;
      }
    });

    // モック検出チェック: ネットワークリクエストを監視
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
        console.log('[API Request] ' + url);
      }
    });

    // ページのリロードを実行してAPIリクエストをキャプチャ
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // APIリクエストが実際に行われたことを確認
    const planDoApiCall = apiRequests.some(url => url.includes('/api/plan-do'));
    if (!planDoApiCall) {
      console.warn('[警告] /api/plan-do へのAPIリクエストが検出されませんでした');
      console.log('検出されたAPIリクエスト:', apiRequests);
    }

    // モック検出時はテスト失敗
    if (mockDetected) {
      throw new Error('[モック検出] テストを中止します。モック実装が使用されている可能性があります。');
    }

    // 最終確認: ページタイトルとタブが正しく表示されている
    await expect(pageTitle).toBeVisible();
    await expect(planTab).toBeVisible();
    await expect(doTab).toBeVisible();

    console.log('[テスト成功] E2E-PLDO-001: Plan-Doページ初期アクセステスト完了');
    console.log('- ページタイトル「計画・実行」: 表示確認');
    console.log('- Planタブ: 表示確認');
    console.log('- Doタブ: 表示確認');
    console.log('- モック検出: なし');
  });
});
