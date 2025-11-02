import { test } from '@playwright/test';
import * as path from 'path';

test.describe('CheckActionPage ビジュアル比較用スクリーンショット取得', () => {
  const pageName = 'CheckActionPage';
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
      await page.waitForTimeout(1000); // レンダリング待機
      await page.screenshot({
        path: `tests/screenshots/mockups/${pageName}-${viewport.name}.png`,
        fullPage: true
      });
    });

    test(`React実装 - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3247/check-action');
      await page.waitForTimeout(2000); // レンダリング待機（API呼び出し含む）
      await page.screenshot({
        path: `tests/screenshots/react/${pageName}-${viewport.name}.png`,
        fullPage: true
      });
    });
  });
});
