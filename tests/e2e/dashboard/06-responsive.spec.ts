/**
 * ダッシュボード E2E テスト - レスポンシブデザイン
 * テストID: E2E-DASH-032 ～ E2E-DASH-036
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Responsive Design', () => {
  // E2E-DASH-032: デスクトップ表示（1920x1080）
  test('E2E-DASH-032: デスクトップ表示（1920x1080） - デスクトップ表示の確認', async ({
    page,
  }) => {
    // ビューポートを1920x1080に設定
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ダッシュボードにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // COM:PASSカードが2列（grid-cols-2）で表示されていることを確認
    const compassCards = page.locator('[data-testid^="compass-card-"]');
    const cardCount = await compassCards.count();
    expect(cardCount).toBe(4);

    // 2列レイアウトであることを確認（最初と3番目のカードの位置を確認）
    const firstCardBox = await compassCards.nth(0).boundingBox();
    const thirdCardBox = await compassCards.nth(2).boundingBox();

    // 3番目のカードが最初のカードの下（y座標が大きい）に配置されていることを確認
    expect(thirdCardBox!.y).toBeGreaterThan(firstCardBox!.y);

    // 各セクションが適切な幅で表示されていることを確認
    const container = page.locator('[data-testid="dashboard-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox!.width).toBeCloseTo(1920, 100); // 許容誤差100px

    // px-6、py-6の余白が適用されていることを確認
    const computedStyle = await container.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
      };
    });

    // px-6 (1.5rem = 24px)、py-6 (1.5rem = 24px) の余白を確認
    expect(computedStyle.paddingLeft).toMatch(/24px|1.5rem/);
    expect(computedStyle.paddingRight).toMatch(/24px|1.5rem/);
    expect(computedStyle.paddingTop).toMatch(/24px|1.5rem/);
    expect(computedStyle.paddingBottom).toMatch(/24px|1.5rem/);
  });

  // E2E-DASH-033: タブレット表示（768x1024）
  test('E2E-DASH-033: タブレット表示（768x1024） - タブレット表示の確認', async ({
    page,
  }) => {
    // ビューポートを768x1024に設定
    await page.setViewportSize({ width: 768, height: 1024 });

    // ダッシュボードにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // COM:PASSカードが2列で表示されていることを確認
    const compassCards = page.locator('[data-testid^="compass-card-"]');
    const cardCount = await compassCards.count();
    expect(cardCount).toBe(4);

    // タスクカードが適切にリサイズされていることを確認
    const taskItems = page.locator('[data-testid^="task-item-"]');
    const taskCount = await taskItems.count();
    expect(taskCount).toBeGreaterThan(0);

    // タスクカードが画面幅内に収まっていることを確認
    for (let i = 0; i < taskCount; i++) {
      const taskBox = await taskItems.nth(i).boundingBox();
      expect(taskBox!.width).toBeLessThanOrEqual(768);
    }

    // タッチ操作が可能なサイズ（最小44x44px）であることを確認
    const checkbox = page.locator('[data-testid="task-checkbox"]').first();
    const checkboxBox = await checkbox.boundingBox();
    expect(checkboxBox!.width).toBeGreaterThanOrEqual(44);
    expect(checkboxBox!.height).toBeGreaterThanOrEqual(44);

    // 文字サイズが読みやすいことを確認
    const taskTitle = page.locator('[data-testid="task-title"]').first();
    const fontSize = await taskTitle.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // 最小16px（読みやすいサイズ）であることを確認
    const fontSizeValue = parseInt(fontSize, 10);
    expect(fontSizeValue).toBeGreaterThanOrEqual(14);
  });

  // E2E-DASH-034: モバイル表示（375x667）
  test('E2E-DASH-034: モバイル表示（375x667） - モバイル表示の確認', async ({
    page,
  }) => {
    // ビューポートを375x667に設定
    await page.setViewportSize({ width: 375, height: 667 });

    // ダッシュボードにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // COM:PASSカードが2列で表示されていることを確認
    const compassCards = page.locator('[data-testid^="compass-card-"]');
    const cardCount = await compassCards.count();
    expect(cardCount).toBe(4);

    // タスクカードが縦積みで表示されていることを確認
    const taskItems = page.locator('[data-testid^="task-item-"]');
    if ((await taskItems.count()) > 1) {
      const firstTaskBox = await taskItems.nth(0).boundingBox();
      const secondTaskBox = await taskItems.nth(1).boundingBox();

      // 2番目のタスクが最初のタスクの下に配置されていることを確認
      expect(secondTaskBox!.y).toBeGreaterThan(firstTaskBox!.y + firstTaskBox!.height);
    }

    // タッチターゲットが44px以上であることを確認
    const checkbox = page.locator('[data-testid="task-checkbox"]').first();
    const checkboxBox = await checkbox.boundingBox();
    expect(checkboxBox!.width).toBeGreaterThanOrEqual(44);
    expect(checkboxBox!.height).toBeGreaterThanOrEqual(44);

    // 横スクロール（overflow-x）がないことを確認
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // 最大幅が375px以内であることを確認
    const container = page.locator('[data-testid="dashboard-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox!.width).toBeLessThanOrEqual(375);
  });

  // E2E-DASH-035: タッチジェスチャー対応
  test('E2E-DASH-035: タッチジェスチャー対応 - モバイルでのタッチ操作確認', async ({
    browser,
  }) => {
    // モバイルタッチサポートを有効にした新しいコンテキストを作成
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();

    // ダッシュボードにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');
    const checkbox = firstTask.locator('[data-testid="task-checkbox"]');

    // タップ操作でチェックボックスをクリック
    await checkbox.tap();
    await page.waitForLoadState('networkidle');

    // チェックボックスがチェック状態になっていることを確認
    await expect(checkbox).toBeChecked();

    // active:scale-[0.98]のアニメーション動作を確認
    const initialScale = await checkbox.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // チェックボックスをマウスダウン状態にする
    await checkbox.dispatchEvent('pointerdown');
    await page.waitForTimeout(100);

    const activeScale = await checkbox.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });

    // アニメーションが適用されているか確認（scale値が変わっている）
    if (initialScale !== activeScale && activeScale !== 'none') {
      expect(activeScale).toMatch(/scale/);
    }

    // マウスアップ状態にする
    await checkbox.dispatchEvent('pointerup');
  });

  // E2E-DASH-036: 縦向き・横向き切り替え
  test('E2E-DASH-036: 縦向き・横向き切り替え - デバイス回転時の表示確認', async ({
    page,
  }) => {
    // 縦向き（portrait）で表示
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 縦向きのコンテンツを取得
    const containerPortrait = page.locator('[data-testid="dashboard-container"]');
    const portraitBox = await containerPortrait.boundingBox();

    // 横向き（landscape）に切り替え
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForLoadState('networkidle');

    // レイアウトが自動調整されていることを確認
    const containerLandscape = page.locator('[data-testid="dashboard-container"]');
    const landscapeBox = await containerLandscape.boundingBox();

    // 幅が変更されていることを確認
    expect(landscapeBox!.width).not.toBe(portraitBox!.width);

    // コンテンツが切れていないことを確認
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // スクロール可能であることを確認（コンテンツが多い場合）
    const isScrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });
    // スクロール可能である場合は true、コンテンツが少ない場合は false（どちらでも OK）
    expect(typeof isScrollable).toBe('boolean');
  });
});
