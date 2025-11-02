// M-002: クライアント詳細ページ - ビジュアル検証用スクリーンショット取得
import { test } from '@playwright/test';
import * as path from 'path';

test.describe('M-002: クライアント詳細 - ビジュアル比較用スクリーンショット取得', () => {
  const pageName = 'ClientDetail';
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  viewports.forEach(viewport => {
    test(`HTMLモックアップ - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const mockupPath = path.resolve(`mockups/${pageName}.html`);
      await page.goto(`file://${mockupPath}`);

      // レンダリング完了を待機
      await page.waitForTimeout(1000);

      // 最初のタブ（目標）を選択
      await page.click('button:has-text("目標")');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `tests/screenshots/mockups/${pageName}-${viewport.name}-tab1.png`,
        fullPage: true
      });

      // タブ2（タスク）
      await page.click('button:has-text("タスク")');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/screenshots/mockups/${pageName}-${viewport.name}-tab2.png`,
        fullPage: true
      });

      // タブ6（メンターノート）
      await page.click('button:has-text("メンターノート")');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `tests/screenshots/mockups/${pageName}-${viewport.name}-tab6.png`,
        fullPage: true
      });
    });

    test(`React実装 - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);

      // モックユーザーのクライアントID（モックデータから）
      const clientId = 'client-001';

      await page.goto(`http://localhost:3247/mentor/client/${clientId}`);

      // ページロード完了を待機
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 最初のタブ（目標）を選択
      const goalsTab = page.locator('button:has-text("目標")');
      if (await goalsTab.count() > 0) {
        await goalsTab.click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: `tests/screenshots/react/${pageName}-${viewport.name}-tab1.png`,
        fullPage: true
      });

      // タブ2（タスク）
      const tasksTab = page.locator('button:has-text("タスク")');
      if (await tasksTab.count() > 0) {
        await tasksTab.click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: `tests/screenshots/react/${pageName}-${viewport.name}-tab2.png`,
        fullPage: true
      });

      // タブ6（メンターノート）
      const notesTab = page.locator('button:has-text("メンターノート")');
      if (await notesTab.count() > 0) {
        await notesTab.click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: `tests/screenshots/react/${pageName}-${viewport.name}-tab6.png`,
        fullPage: true
      });
    });
  });
});
