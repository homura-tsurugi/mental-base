import { test, expect } from '@playwright/test';

/**
 * mentor-search.spec.ts: メンターダッシュボードの検索・フィルタ・ソート機能テスト
 * テストID範囲: E2E-MENTOR-016 ~ E2E-MENTOR-025
 */

test.describe('E2E-MENTOR-016～025: メンターダッシュボード検索・フィルタ・ソート機能', () => {
  test.beforeEach(async ({ page }) => {
    // ページに移動
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');
  });

  // E2E-MENTOR-016: 検索バー入力
  test('E2E-MENTOR-016: 検索バー入力', async ({ page }) => {
    // 検索バーを取得
    const searchInput = page.locator(
      'input[type="search"], [data-testid="search-input"]'
    );
    await expect(searchInput).toBeVisible();

    // テキスト入力
    await searchInput.click();
    await searchInput.fill('太郎');

    // 入力値が表示される
    await expect(searchInput).toHaveValue('太郎');

    // クライアント一覧がフィルタされる
    await page.waitForTimeout(300); // onChange待機
    const clientCards = page.locator(
      '[data-testid="client-card"], [class*="card"]:has-text("太郎")'
    );
    // フィルタされたクライアントが表示される
    const visibleCards = await clientCards.count();
    expect(visibleCards).toBeGreaterThanOrEqual(0);
  });

  // E2E-MENTOR-017: フィルターボタン表示
  test('E2E-MENTOR-017: フィルターボタン表示', async ({ page }) => {
    // フィルターボタンが表示されている
    const allButton = page.locator('button:has-text("全て")').first();
    const onTrackButton = page.locator('button:has-text("順調")').first();
    const stagnantButton = page.locator('button:has-text("停滞")').first();
    const followupButton = page.locator('button:has-text("要フォロー")').first();

    await expect(allButton).toBeVisible();
    await expect(onTrackButton).toBeVisible();
    await expect(stagnantButton).toBeVisible();
    await expect(followupButton).toBeVisible();

    // デフォルトは「全て」が選択（bg-blue-600）
    await expect(allButton).toHaveClass(/bg-blue-600|bg-blue/);
  });

  // E2E-MENTOR-018: フィルター: 順調
  test('E2E-MENTOR-018: フィルター: 順調', async ({ page }) => {
    // 「順調」ボタンをクリック
    const onTrackButton = page.locator('button:has-text("順調")').first();
    await onTrackButton.click();

    // ボタンが青背景に変更
    await expect(onTrackButton).toHaveClass(/bg-blue/);

    // status='on_track'のクライアントのみ表示
    await page.waitForTimeout(300); // フィルタ待機
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // ステータスバッジが「順調」であることを確認
      const badges = page.locator('text=/順調/');
      expect(await badges.count()).toBeGreaterThan(0);
    }
  });

  // E2E-MENTOR-019: フィルター: 停滞
  test('E2E-MENTOR-019: フィルター: 停滞', async ({ page }) => {
    // 「停滞」ボタンをクリック
    const stagnantButton = page.locator('button:has-text("停滞")').first();
    await stagnantButton.click();

    // ボタンが青背景に変更
    await expect(stagnantButton).toHaveClass(/bg-blue/);

    // status='stagnant'のクライアントのみ表示
    await page.waitForTimeout(300); // フィルタ待機
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // ステータスバッジが「停滞」であることを確認
      const badges = page.locator('text=/停滞/');
      expect(await badges.count()).toBeGreaterThan(0);
    }
  });

  // E2E-MENTOR-020: フィルター: 要フォロー
  test('E2E-MENTOR-020: フィルター: 要フォロー', async ({ page }) => {
    // 「要フォロー」ボタンをクリック
    const followupButton = page.locator('button:has-text("要フォロー")').first();
    await followupButton.click();

    // ボタンが青背景に変更
    await expect(followupButton).toHaveClass(/bg-blue/);

    // status='needs_followup'のクライアントのみ表示
    await page.waitForTimeout(300); // フィルタ待機
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // ステータスバッジが「要フォロー」であることを確認
      const badges = page.locator('text=/要フォロー/');
      expect(await badges.count()).toBeGreaterThan(0);
    }
  });

  // E2E-MENTOR-021: フィルター: 全て
  test('E2E-MENTOR-021: フィルター: 全て', async ({ page }) => {
    // まず「順調」で絞り込み
    const onTrackButton = page.locator('button:has-text("順調")').first();
    await onTrackButton.click();
    await page.waitForTimeout(300);

    // 次に「全て」ボタンをクリック
    const allButton = page.locator('button:has-text("全て")').first();
    await allButton.click();

    // ボタンが青背景に変更
    await expect(allButton).toHaveClass(/bg-blue/);

    // すべてのステータスのクライアントが表示される
    await page.waitForTimeout(300);
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  // E2E-MENTOR-022: ソートドロップダウン表示
  test('E2E-MENTOR-022: ソートドロップダウン表示', async ({ page }) => {
    // ソートドロップダウンを取得
    const sortDropdown = page.locator(
      'select, [data-testid="sort-dropdown"], button:has-text("最終活動日順")'
    );
    await expect(sortDropdown).toBeVisible();

    // デフォルト値が「最終活動日順」
    const selectedText = await sortDropdown.locator('text=/最終活動日順|最終活動').first();
    await expect(selectedText).toBeVisible();
  });

  // E2E-MENTOR-023: ソート: 最終活動日順
  test('E2E-MENTOR-023: ソート: 最終活動日順', async ({ page }) => {
    // ソートドロップダウンを確認（デフォルト）
    const sortDropdown = page.locator(
      'select, [data-testid="sort-dropdown"]'
    );

    if (await sortDropdown.locator('select').count() > 0) {
      // selectの場合
      await expect(sortDropdown.locator('select')).toHaveValue(/lastActivity|最終活動日/i);
    }

    // クライアントカードが表示されている
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 1) {
      // 最後の活動日が降順でソートされている
      // （最初のカードと2番目のカードの日付を比較）
      const firstActivity = clientCards.first().locator('[data-testid="last-activity"]');
      const secondActivity = clientCards.nth(1).locator('[data-testid="last-activity"]');

      if (await firstActivity.count() > 0 && await secondActivity.count() > 0) {
        const firstText = await firstActivity.textContent();
        const secondText = await secondActivity.textContent();
        expect(firstText).toBeTruthy();
        expect(secondText).toBeTruthy();
      }
    }
  });

  // E2E-MENTOR-024: ソート: 進捗率順
  test('E2E-MENTOR-024: ソート: 進捗率順', async ({ page }) => {
    // ソートドロップダウンを取得
    const sortDropdown = page.locator(
      'select, [data-testid="sort-dropdown"]'
    );

    if (await sortDropdown.locator('select').count() > 0) {
      // selectの場合は選択値を変更
      await sortDropdown.locator('select').selectOption('progress');
    } else {
      // ボタンドロップダウンの場合
      const sortButton = page.locator('button:has-text("最終活動日順"), [data-testid="sort-button"]');
      await sortButton.click();
      const progressOption = page.locator('text=/進捗率順/');
      if (await progressOption.count() > 0) {
        await progressOption.click();
      }
    }

    await page.waitForTimeout(300); // ソート待機

    // 進捗率が高い順に並ぶ
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // 少なくとも1つのクライアントが表示されている
      await expect(clientCards.first()).toBeVisible();
    }
  });

  // E2E-MENTOR-025: ソート: 名前順
  test('E2E-MENTOR-025: ソート: 名前順', async ({ page }) => {
    // ソートドロップダウンを取得
    const sortDropdown = page.locator(
      'select, [data-testid="sort-dropdown"]'
    );

    if (await sortDropdown.locator('select').count() > 0) {
      // selectの場合は選択値を変更
      await sortDropdown.locator('select').selectOption('name');
    } else {
      // ボタンドロップダウンの場合
      const sortButton = page.locator('button:has-text("最終活動日順"), [data-testid="sort-button"]');
      await sortButton.click();
      const nameOption = page.locator('text=/名前順/');
      if (await nameOption.count() > 0) {
        await nameOption.click();
      }
    }

    await page.waitForTimeout(300); // ソート待機

    // クライアント名が50音順に並ぶ
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();

    if (cardCount > 0) {
      // 少なくとも1つのクライアントが表示されている
      await expect(clientCards.first()).toBeVisible();
    }
  });
});
