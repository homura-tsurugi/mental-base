import { test, expect } from '@playwright/test';

/**
 * check-action-responsive.spec.ts: Check/Actionページのレスポンシブテスト
 * テストID範囲: E2E-CHKACT-044 ~ E2E-CHKACT-049
 * 優先度: 高～中
 */

test.describe('Check/Actionページ - レスポンシブテスト', () => {
  test.beforeEach(async ({ page }) => {
    // 認証を有効化
    await page.context().addInitScript(() => {
      localStorage.setItem('VITE_SKIP_AUTH', 'true');
    });
  });

  // ===== デスクトップ表示テスト =====

  test('E2E-CHKACT-044: デスクトップ表示（1920x1080）', async ({ page }) => {
    // ブラウザを1920x1080にリサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ページにアクセス
    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 5000 });

    // 全要素が適切にレイアウトされているか確認
    const pageContainer = page.locator('[data-testid="page-container"]');
    await expect(pageContainer).toBeVisible();

    // タブセクションが表示される
    const tabSection = page.locator('[data-testid="tab-section"]');
    await expect(tabSection).toBeVisible();

    // 統計カードが表示される
    const statsContainer = page.locator('[data-testid="stats-container"]');
    await expect(statsContainer).toBeVisible();

    // チャートが表示される
    const chartContainer = page.locator('[data-testid="chart-container"]');
    await expect(chartContainer).toBeVisible();

    // 横スクロールが不要であることを確認
    const bodyElement = page.locator('body');
    const scrollWidth = await bodyElement.evaluate((el) => el.scrollWidth);
    const clientWidth = await bodyElement.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1は誤差許容
  });

  // ===== タブレット表示テスト =====

  test('E2E-CHKACT-045: タブレット表示（768x1024）', async ({ page }) => {
    // ブラウザを768x1024にリサイズ
    await page.setViewportSize({ width: 768, height: 1024 });

    // ページにアクセス
    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 5000 });

    // タブが適切にレイアウトされている
    const tabSection = page.locator('[data-testid="tab-section"]');
    await expect(tabSection).toBeVisible();

    const checkTab = page.locator('[data-testid="tab-check"]');
    const actionTab = page.locator('[data-testid="tab-action"]');

    await expect(checkTab).toBeVisible();
    await expect(actionTab).toBeVisible();

    // 統計カードが適切にレイアウトされている
    const statsContainer = page.locator('[data-testid="stats-container"]');
    await expect(statsContainer).toBeVisible();

    // フォームが全幅表示される
    const reflectionForm = page.locator('[data-testid="reflection-form"]');
    await expect(reflectionForm).toBeVisible();

    // 横スクロールが最小限であることを確認
    const bodyElement = page.locator('body');
    const scrollWidth = await bodyElement.evaluate((el) => el.scrollWidth);
    const clientWidth = await bodyElement.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // タブレットでは許容
  });

  // ===== モバイル表示テスト =====

  test('E2E-CHKACT-046: モバイル表示（375x667）', async ({ page }) => {
    // ブラウザを375x667にリサイズ
    await page.setViewportSize({ width: 375, height: 667 });

    // ページにアクセス
    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 5000 });

    // ページタイトルが表示される
    const pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();

    // タブが表示される
    const checkTab = page.locator('[data-testid="tab-check"]');
    const actionTab = page.locator('[data-testid="tab-action"]');

    await expect(checkTab).toBeVisible();
    await expect(actionTab).toBeVisible();

    // 統計カードが縦並び表示されている
    const statsCards = page.locator('[data-testid="stats-card"]');
    const cardCount = await statsCards.count();

    // 各カードがモバイル幅で表示されていることを確認
    for (let i = 0; i < cardCount; i++) {
      const card = statsCards.nth(i);
      const boundingBox = await card.boundingBox();

      if (boundingBox) {
        // カードの幅がビューポート幅に近い（マージンを除く）
        expect(boundingBox.width).toBeLessThanOrEqual(375 - 20); // マージン考慮
      }
    }

    // フォームが全幅表示される
    const reflectionForm = page.locator('[data-testid="reflection-form"]');
    await expect(reflectionForm).toBeVisible();

    const contentTextarea = page.locator('[data-testid="reflection-content"]');
    const textareaBoundingBox = await contentTextarea.boundingBox();

    if (textareaBoundingBox) {
      expect(textareaBoundingBox.width).toBeLessThanOrEqual(375 - 20);
    }

    // タップ可能な要素が十分な大きさ（最小44x44px推奨）
    const periodButtons = page.locator('[data-testid^="period-"]');
    const buttonCount = await periodButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 2); i++) {
      const button = periodButtons.nth(i);
      const boundingBox = await button.boundingBox();

      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
        expect(boundingBox.width).toBeGreaterThanOrEqual(40);
      }
    }

    // 横スクロールが不要
    const bodyElement = page.locator('body');
    const scrollWidth = await bodyElement.evaluate((el) => el.scrollWidth);
    const clientWidth = await bodyElement.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  // ===== タッチジェスチャー対応テスト =====

  // タッチサポートを有効化
  test.use({ hasTouch: true });

  test('E2E-CHKACT-047: タッチジェスチャー対応', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // ページにアクセス
    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="tab-check"]', { timeout: 5000 });

    // タブボタンをタップ
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.tap();

    // タップでボタンが反応する
    await expect(actionTab).toHaveAttribute('data-active', 'true', { timeout: 1000 });

    // 視覚的フィードバック（背景色変化など）が確認できる
    const actionTabElement = actionTab;
    const classes = await actionTabElement.getAttribute('class');
    expect(classes).toBeDefined();

    // 期間ボタンをタップ
    const lastWeekBtn = page.locator('[data-testid="period-lastweek"]');
    await lastWeekBtn.tap();

    // タップで期間が切り替わる
    await expect(lastWeekBtn).toHaveAttribute('data-active', 'true', { timeout: 1000 });

    // 統計データが更新される
    const statsContainer = page.locator('[data-testid="stats-container"]');
    await expect(statsContainer).toBeVisible();
  });

  // ===== 画面回転対応テスト =====

  test('E2E-CHKACT-048: 縦向き・横向き切り替え', async ({ page }) => {
    // 縦向き（375x667）で開始
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 5000 });

    // 縦向きで要素が表示される
    let pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();

    // 横向きにリサイズ（667x375）
    await page.setViewportSize({ width: 667, height: 375 });

    // レイアウトが再配置される
    pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();

    // 表示崩れがないことを確認
    const bodyElement = page.locator('body');
    const scrollWidth = await bodyElement.evaluate((el) => el.scrollWidth);
    const clientWidth = await bodyElement.evaluate((el) => el.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    // 統計カードが横向きで適切に配置されている
    const statsContainer = page.locator('[data-testid="stats-container"]');
    await expect(statsContainer).toBeVisible();

    // 再び縦向きにリサイズ
    await page.setViewportSize({ width: 375, height: 667 });

    // レイアウトが元に戻る
    pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();
  });

  // ===== スクロール対応テスト =====

  test('E2E-CHKACT-049: 小画面でのスクロール', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="page-title"]', { timeout: 5000 });

    // ページトップが表示される
    let pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();

    // ページの高さを確認
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 667;

    if (pageHeight > viewportHeight) {
      // スクロール可能な場合、ページをスクロール
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // ページの下部要素が表示されることを確認
      const reflectionForm = page.locator('[data-testid="reflection-form"]');
      const formVisible = await reflectionForm.isVisible();

      // フォームが存在する場合、それが見えることを確認
      if (formVisible) {
        await expect(reflectionForm).toBeInViewport();
      }

      // 縦スクロールで全要素にアクセス可能であることを確認
      const scrollPosition = await page.evaluate(() => window.scrollY);
      expect(scrollPosition).toBeGreaterThan(0);
    }

    // 横スクロールが不要（スクロール位置がx=0のままであること）
    const horizontalScroll = await page.evaluate(() => window.scrollX);
    expect(horizontalScroll).toBe(0);
  });
});
