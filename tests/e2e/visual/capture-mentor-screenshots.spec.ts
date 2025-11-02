import { test } from '@playwright/test';

test.describe('メンターページ ビジュアル比較用スクリーンショット取得', () => {
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  viewports.forEach(viewport => {
    test(`メンターダッシュボード (M-001) - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);

      // TODO: 認証が必要な場合、ログイン処理を追加
      // await page.goto('http://localhost:3247/auth');
      // await page.fill('[name="email"]', 'mentor@test.com');
      // await page.fill('[name="password"]', 'password');
      // await page.click('button[type="submit"]');

      await page.goto('http://localhost:3247/mentor');
      await page.waitForTimeout(2000); // レンダリング待機（API呼び出し含む）

      await page.screenshot({
        path: `tests/screenshots/react/MentorDashboard-${viewport.name}.png`,
        fullPage: true
      });
    });

    test(`クライアント詳細 (M-002) - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);

      // Mock client ID
      const mockClientId = 'client-001';

      await page.goto(`http://localhost:3247/mentor/client/${mockClientId}`);
      await page.waitForTimeout(2000); // レンダリング待機（API呼び出し含む）

      await page.screenshot({
        path: `tests/screenshots/react/ClientDetail-${viewport.name}.png`,
        fullPage: true
      });
    });
  });

  // インタラクティブな要素のテスト
  test('メンターダッシュボード - 検索・フィルタ機能', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3247/mentor');
    await page.waitForTimeout(2000);

    // 検索入力
    const searchInput = page.locator('input[type="search"], input[placeholder*="検索"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('田中');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'tests/screenshots/react/MentorDashboard-search-active.png',
        fullPage: true
      });
    }
  });

  test('クライアント詳細 - タブ切り替え', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const mockClientId = 'client-001';
    await page.goto(`http://localhost:3247/mentor/client/${mockClientId}`);
    await page.waitForTimeout(2000);

    // タスクタブをクリック（存在する場合）
    const tasksTab = page.locator('button:has-text("タスク"), [role="tab"]:has-text("タスク")');
    if (await tasksTab.count() > 0) {
      await tasksTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'tests/screenshots/react/ClientDetail-tasks-tab.png',
        fullPage: true
      });
    }

    // 振り返りタブをクリック（存在する場合）
    const reflectionsTab = page.locator('button:has-text("振り返り"), [role="tab"]:has-text("振り返り")');
    if (await reflectionsTab.count() > 0) {
      await reflectionsTab.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'tests/screenshots/react/ClientDetail-reflections-tab.png',
        fullPage: true
      });
    }
  });
});
