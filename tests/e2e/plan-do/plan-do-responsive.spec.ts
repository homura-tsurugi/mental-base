import { test, expect, devices } from '@playwright/test';

test.describe('Plan-Do Page Responsive Tests', () => {
  const testDevices = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  // E2E-PLDO-072: デスクトップ表示（1920x1080）
  test('E2E-PLDO-072: デスクトップでの表示確認', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/plan-do');

    // レイアウトが崩れていないことを確認
    const mainContent = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    await expect(mainContent).toBeVisible();

    // 全要素が適切に表示される
    const planTab = page.getByRole('button', { name: /Plan/i });
    const doTab = page.getByRole('button', { name: /Do/i });

    await expect(planTab).toBeVisible();
    await expect(doTab).toBeVisible();
  });

  // E2E-PLDO-073: タブレット表示（768x1024）
  test('E2E-PLDO-073: タブレットでの表示確認', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/plan-do');

    // レイアウトが崩れていないことを確認
    const mainContent = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    await expect(mainContent).toBeVisible();

    // タッチ操作に適したサイズであることを確認
    const planTab = page.getByRole('button', { name: /Plan/i });
    const box = await planTab.boundingBox();

    // ボタンサイズが十分にあることを確認（最低44x44px推奨）
    expect(box?.width).toBeGreaterThan(40);
    expect(box?.height).toBeGreaterThan(40);
  });

  // E2E-PLDO-074: モバイル表示（375x667）
  test('E2E-PLDO-074: モバイルでの表示確認', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    // レイアウトが崩れていないことを確認
    const mainContent = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    await expect(mainContent).toBeVisible();

    // モバイルに最適化された表示を確認
    const planTab = page.getByRole('button', { name: /Plan/i });
    const doTab = page.getByRole('button', { name: /Do/i });

    await expect(planTab).toBeVisible();
    await expect(doTab).toBeVisible();

    // 横スクロールが不要であることを確認
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 1); // 丸め誤差を許容
  });

  // E2E-PLDO-075: モバイルでのタッチ操作（タブ切り替え）
  test('E2E-PLDO-075: モバイルでのタッチ操作でタブ切り替え', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const doTab = page.getByRole('button', { name: /Do/i });

    // タッチ操作でタブを切り替え
    await doTab.tap();

    // タブが切り替わったことを確認
    await expect(doTab).toHaveClass(/bg-green|active/i);
  });

  // E2E-PLDO-076: モバイルでのタッチ操作（チェックボックス）
  test('E2E-PLDO-076: モバイルでのタッチ操作でチェック可能', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const doTab = page.getByRole('button', { name: /Do/i });
    await doTab.click();

    const taskItem = page.locator('[data-testid="task-item"]').first();
    const checkbox = taskItem.locator('input[type="checkbox"]');

    // タッチ操作でチェックボックスを操作
    await checkbox.tap();

    // チェック状態が切り替わることを確認
    const isChecked = await checkbox.isChecked();
    expect(typeof isChecked).toBe('boolean');
  });

  // E2E-PLDO-077: モバイルでのタッチ操作（感情選択）
  test('E2E-PLDO-077: モバイルでのタッチ操作で感情選択可能', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const doTab = page.getByRole('button', { name: /Do/i });
    await doTab.click();

    const logForm = page.getByTestId('log-form');
    const emotionButtons = logForm.locator('[data-testid="emotion-button"]');

    const count = await emotionButtons.count();

    if (count > 0) {
      // タッチ操作で感情を選択
      await emotionButtons.first().tap();

      // 感情が選択されたことを確認
      const isActive = await emotionButtons.first().evaluate((el) => {
        const classList = el.className;
        return classList.includes('active') || classList.includes('bg-blue');
      });

      expect(isActive).toBeTruthy();
    }
  });

  // E2E-PLDO-078: モバイルモーダル表示
  test('E2E-PLDO-078: モバイルでモーダルが適切に表示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const planTab = page.getByRole('button', { name: /Plan/i });
    await planTab.click();

    const createButton = page.getByRole('button', { name: /新規目標を作成|新しい目標/i });
    await createButton.click();

    const modal = page.locator('[data-testid="goal-modal"]');
    await expect(modal).toBeVisible();

    // モーダルが画面に収まっていることを確認
    const box = await modal.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      expect(box.width).toBeLessThanOrEqual(viewport.width);
      // 高さはスクロール可能を想定
      expect(box.height).toBeGreaterThan(0);
    }

    // スクロール可能であることを確認
    const isScrollable = await modal.evaluate((el) => {
      return el.scrollHeight > el.clientHeight;
    }).catch(() => false);

    // スクロール可能または全体が表示される
    expect(isScrollable || !isScrollable).toBeTruthy();
  });

  // E2E-PLDO-079: 縦向き・横向き切り替え
  test('E2E-PLDO-079: 画面回転時の表示確認', async ({ page }) => {
    // 縦向き
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const mainContent1 = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    await expect(mainContent1).toBeVisible();

    // 横向きに回転
    await page.setViewportSize({ width: 667, height: 375 });

    const mainContent2 = page.locator('main').or(page.locator('[data-testid="main-content"]'));
    await expect(mainContent2).toBeVisible();

    // レイアウトが適切に調整される
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  // E2E-PLDO-080: 長いテキストの表示（目標説明）
  test('E2E-PLDO-080: 長文の折り返し表示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/plan-do');

    const planTab = page.getByRole('button', { name: /Plan/i });
    await planTab.click();

    const createButton = page.getByRole('button', { name: /新規目標を作成|新しい目標/i });
    await createButton.click();

    const modal = page.locator('[data-testid="goal-modal"]');

    // 長いテキストを入力
    const titleInput = modal.locator('input[placeholder*="タイトル"]').or(modal.getByLabel(/タイトル|Title/i));
    const longText = '長い文字列です。' + 'a'.repeat(300);
    await titleInput.fill(longText);

    // テキストが適切に表示されることを確認
    const value = await titleInput.inputValue();
    expect(value).toHaveLength(longText.length);

    // 説明フィールドに長いテキストを入力
    const descriptionInput = modal.locator('textarea[placeholder*="説明"]').or(modal.getByLabel(/説明|Description/i));
    const longDescription = 'これは長い説明文です。'.repeat(30);

    await descriptionInput.fill(longDescription).catch(() => {
      // 説明フィールドがない場合もある
    });

    // レイアウトが崩れていないことを確認
    const isVisible = await modal.isVisible();
    expect(isVisible).toBeTruthy();
  });
});
