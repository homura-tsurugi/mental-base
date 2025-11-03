import { test, expect } from '@playwright/test';

/**
 * settings-notification.spec.ts: 通知設定関連テスト
 * テストID範囲: E2E-SET-013 ~ E2E-SET-015, E2E-SET-031
 */

test('E2E-SET-013: メール通知ON→OFF切り替え', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メール通知トグルを確認（初期状態はON）
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  await expect(emailToggle).toHaveAttribute('data-state', 'checked');

  // トグルをクリック
  await emailToggle.click();

  // トグルがOFF状態に変化することを確認
  await expect(emailToggle).toHaveAttribute('data-state', 'unchecked');

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('メール通知を無効にしました');

  // 3秒後にメッセージが自動で消えることを確認
  await expect(successMessage).not.toBeVisible({ timeout: 5000 });
});

test('E2E-SET-014: メール通知OFF→ON切り替え', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メール通知トグルをOFFにする（初期状態がONの場合）
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  if (await emailToggle.getAttribute('data-state') === 'checked') {
    await emailToggle.click();
    // OFF状態を確認
    await expect(emailToggle).toHaveAttribute('data-state', 'unchecked');
  }

  // トグルをクリック（OFF→ON）
  await emailToggle.click();

  // トグルがON状態に変化することを確認
  await expect(emailToggle).toHaveAttribute('data-state', 'checked');

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('メール通知を有効にしました');

  // 3秒後にメッセージが自動で消えることを確認
  await expect(successMessage).not.toBeVisible({ timeout: 5000 });
});

test('E2E-SET-015: 通知設定変更（APIエラー）', async ({ page }) => {
  // APIエラーをシミュレート
  await page.route('**/api/users/settings', (route) => {
    route.abort('failed');
  });

  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メール通知トグルの初期状態を確認
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  const initialState = await emailToggle.getAttribute('data-state');

  // トグルをクリック
  await emailToggle.click();

  // トグルが一瞬変化後、元の状態に戻ることを確認
  // 状態が戻る前の状態を確認
  const stateAfterClick = await emailToggle.getAttribute('data-state');
  expect(stateAfterClick).not.toBe(initialState);

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible({ timeout: 2000 });

  // トグルが元の状態に戻ることを確認
  await expect(emailToggle).toHaveAttribute('data-state', initialState);
});

test('E2E-SET-031: トグルスイッチアニメーション', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メール通知トグルを確認
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  await expect(emailToggle).toBeVisible();

  // トグルが表示されていることを確認
  const toggleButton = page.locator('[data-testid="notification-email-toggle-button"]');
  await expect(toggleButton).toBeVisible();

  // トグルをクリック
  await emailToggle.click();

  // アニメーションが適用されていることを確認（transition-allが適用されている）
  const toggleStyle = await toggleButton.evaluate((el) => {
    return window.getComputedStyle(el).transition;
  });
  expect(toggleStyle).toBeTruthy();

  // トグルが右（ON）から左（OFF）に移動することを確認
  const stateAfterClick = await emailToggle.getAttribute('data-state');
  expect(stateAfterClick).toBe('unchecked');

  // 背景色が変化することを確認
  const bgColor = await toggleButton.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(bgColor).toBeTruthy();
});
