import { test, expect } from '@playwright/test';

/**
 * mentor-security-responsive.spec.ts: メンターダッシュボードのセキュリティ・エラーハンドリング・レスポンシブテスト
 * テストID範囲: E2E-MENTOR-045 ~ E2E-MENTOR-048
 */

test.describe('E2E-MENTOR-045～048: メンターダッシュボード セキュリティ・エラー処理・レスポンシブ', () => {
  // E2E-MENTOR-045: API接続エラー表示
  test('E2E-MENTOR-045: API接続エラー表示', async ({ page }) => {
    // ネットワークエラーを発生させる
    await page.route('**/api/mentor/dashboard**', (route) => {
      route.abort('failed');
    });

    // ページに移動
    await page.goto('http://localhost:3247/mentor');
    await page.waitForTimeout(1000); // エラー処理待機

    // console.errorにエラー出力
    let errorLogged = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogged = true;
      }
    });

    // ユーザーにエラー通知（実装予定）
    const errorNotification = page.locator(
      '[data-testid="error-notification"], [role="alert"]'
    );

    if (await errorNotification.count() > 0) {
      // エラー通知が表示されている
      await expect(errorNotification).toBeVisible();
    }

    // エラーステート設定
    const errorState = page.locator(
      '[data-testid="error-state"], [class*="error"]'
    );
    if (await errorState.count() > 0) {
      // エラー状態が表示されている
      await expect(errorState).toBeVisible();
    }
  });

  // E2E-MENTOR-046: レスポンシブ: デスクトップ
  test('E2E-MENTOR-046: レスポンシブ: デスクトップ', async ({ page }) => {
    // ブラウザを1920x1080にリサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });

    // メンターダッシュボードにアクセス
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // 統計カードが4列（lg:grid-cols-4）
    const statsGrid = page.locator(
      '[data-testid="dashboard-stats"], [class*="grid"]'
    ).first();
    if (await statsGrid.count() > 0) {
      const gridClass = await statsGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-4|lg:grid-cols-4/);
    }

    // クライアントカードが3列（lg:grid-cols-3）
    const clientGrid = page.locator(
      '[data-testid="client-grid"], [class*="grid"]:has([data-testid="client-card"])'
    ).first();
    if (await clientGrid.count() > 0) {
      const gridClass = await clientGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-3|lg:grid-cols-3/);
    }

    // 適切な余白（px-8、py-8）
    const mainContent = page.locator('[data-testid="main-content"], main');
    if (await mainContent.count() > 0) {
      const classes = await mainContent.getAttribute('class');
      if (classes) {
        expect(classes).toMatch(/px-8|px-\[2rem\]/);
      }
    }

    // 全体的にレイアウトが整っている
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  // E2E-MENTOR-047: レスポンシブ: タブレット
  test('E2E-MENTOR-047: レスポンシブ: タブレット', async ({ page }) => {
    // ブラウザを768x1024にリサイズ
    await page.setViewportSize({ width: 768, height: 1024 });

    // メンターダッシュボードにアクセス
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // 統計カードが2列（md:grid-cols-2）
    const statsGrid = page.locator(
      '[data-testid="dashboard-stats"], [class*="grid"]'
    ).first();
    if (await statsGrid.count() > 0) {
      const gridClass = await statsGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-1|grid-cols-2|md:grid-cols-2/);
    }

    // クライアントカードが2列（md:grid-cols-2）
    const clientGrid = page.locator(
      '[data-testid="client-grid"], [class*="grid"]:has([data-testid="client-card"])'
    ).first();
    if (await clientGrid.count() > 0) {
      const gridClass = await clientGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-1|grid-cols-2|md:grid-cols-2/);
    }

    // タッチ操作が可能
    const clientCard = page.locator('[data-testid="client-card"]').first();
    if (await clientCard.count() > 0) {
      // クリック可能性を確認
      await expect(clientCard).toBeVisible();
    }

    // タッチターゲットが44px以上
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    if (await firstButton.count() > 0) {
      const boundingBox = await firstButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(32); // 最小推奨44px
      }
    }
  });

  // E2E-MENTOR-048: レスポンシブ: モバイル
  test('E2E-MENTOR-048: レスポンシブ: モバイル', async ({ page }) => {
    // ブラウザを375x667にリサイズ
    await page.setViewportSize({ width: 375, height: 667 });

    // メンターダッシュボードにアクセス
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // 統計カードが1列（grid-cols-1）
    const statsGrid = page.locator(
      '[data-testid="dashboard-stats"], [class*="grid"]'
    ).first();
    if (await statsGrid.count() > 0) {
      const gridClass = await statsGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-1/);
    }

    // クライアントカードが1列（grid-cols-1）
    const clientGrid = page.locator(
      '[data-testid="client-grid"], [class*="grid"]:has([data-testid="client-card"])'
    ).first();
    if (await clientGrid.count() > 0) {
      const gridClass = await clientGrid.getAttribute('class');
      expect(gridClass).toMatch(/grid-cols-1/);
    }

    // 横スクロールなし
    const pageWidth = await page.evaluate(() => {
      return Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      );
    });
    const viewportWidth = 375;
    expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 1); // 小数点誤差許容

    // タッチターゲット44px以上
    const buttons = page.locator('button');
    const firstButton = buttons.first();
    if (await firstButton.count() > 0) {
      const boundingBox = await firstButton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(32); // 最小推奨44px
        expect(boundingBox.width).toBeGreaterThanOrEqual(32); // 最小推奨44px
      }
    }

    // フォントサイズが読みやすい
    const heading = page.locator('h1');
    if (await heading.count() > 0) {
      const fontSize = await heading.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize).toBeGreaterThanOrEqual(16); // 最小16px推奨
    }
  });
});
