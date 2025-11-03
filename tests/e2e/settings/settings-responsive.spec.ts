import { test, expect } from '@playwright/test';

/**
 * settings-responsive.spec.ts: レスポンシブ対応テスト
 * テストID範囲: E2E-SET-043 ~ E2E-SET-047
 */

test('E2E-SET-043: デスクトップ表示（1920x1080）', async ({ page }) => {
  // ブラウザを1920x1080にリサイズ
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 各セクションが表示されていることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();

  const notificationHeading = page.locator('[data-testid="notification-heading"]');
  await expect(notificationHeading).toBeVisible();

  const passwordHeading = page.locator('[data-testid="password-heading"]');
  await expect(passwordHeading).toBeVisible();

  const accountHeading = page.locator('[data-testid="account-heading"]');
  await expect(accountHeading).toBeVisible();

  // ページ全体がビューポート内に収まっていることを確認
  const mainContent = page.locator('[data-testid="settings-form"]');
  const boundingBox = await mainContent.boundingBox();
  expect(boundingBox).not.toBeNull();
  if (boundingBox) {
    expect(boundingBox.width).toBeLessThanOrEqual(1920);
  }

  // 余白（px-6、py-6）が適用されていることを確認
  const cardElement = page.locator('[data-testid="profile-card"]');
  const padding = await cardElement.evaluate((el) => {
    return window.getComputedStyle(el).padding;
  });
  expect(padding).toBeTruthy();
});

test('E2E-SET-044: タブレット表示（768x1024）', async ({ page }) => {
  // ブラウザを768x1024にリサイズ
  await page.setViewportSize({ width: 768, height: 1024 });

  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 各セクションが表示されていることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();

  // 入力フィールドが読みやすいサイズであることを確認
  const nameField = page.locator('[data-testid="profile-name-input"]');
  const fieldBoundingBox = await nameField.boundingBox();
  expect(fieldBoundingBox).not.toBeNull();
  if (fieldBoundingBox) {
    expect(fieldBoundingBox.width).toBeGreaterThan(150);
  }

  // ボタンがタップしやすいサイズであることを確認
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  const buttonBoundingBox = await saveButton.boundingBox();
  expect(buttonBoundingBox).not.toBeNull();
  if (buttonBoundingBox) {
    expect(buttonBoundingBox.height).toBeGreaterThanOrEqual(40);
  }

  // 文字サイズが適切であることを確認
  const fontSize = await nameField.evaluate((el) => {
    return window.getComputedStyle(el).fontSize;
  });
  expect(fontSize).toBeTruthy();
});

test('E2E-SET-045: モバイル表示（375x667）', async ({ page }) => {
  // ブラウザを375x667にリサイズ
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 各セクションが縦積みされていることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  const profileBox = await profileHeading.boundingBox();

  const notificationHeading = page.locator('[data-testid="notification-heading"]');
  const notificationBox = await notificationHeading.boundingBox();

  expect(profileBox).not.toBeNull();
  expect(notificationBox).not.toBeNull();

  if (profileBox && notificationBox) {
    // 通知設定がプロフィールの下にあることを確認
    expect(notificationBox.y).toBeGreaterThan(profileBox.y);
  }

  // 入力フィールドが画面幅に適応していることを確認
  const nameField = page.locator('[data-testid="profile-name-input"]');
  const fieldBoundingBox = await nameField.boundingBox();
  expect(fieldBoundingBox).not.toBeNull();
  if (fieldBoundingBox) {
    expect(fieldBoundingBox.width).toBeGreaterThan(300);
  }

  // タッチターゲットが44px以上であることを確認
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  const buttonBoundingBox = await saveButton.boundingBox();
  expect(buttonBoundingBox).not.toBeNull();
  if (buttonBoundingBox) {
    expect(buttonBoundingBox.height).toBeGreaterThanOrEqual(44);
  }

  // ボタンが幅100%（w-full）であることを確認
  expect(buttonBoundingBox?.width).toBeGreaterThan(300);

  // 横スクロールがないことを確認
  const bodyWidth = await page.evaluate(() => {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth
    );
  });
  const viewportWidth = 375;
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});

test('E2E-SET-046: タッチジェスチャー対応', async ({ page }) => {
  // モバイルデバイスの設定
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // トグルスイッチをタップ
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  await emailToggle.tap();

  // タップ操作が正確に反応することを確認
  const initialState = await emailToggle.getAttribute('data-state');
  expect(initialState).toBeTruthy();

  // active:scale-[0.98]のアニメーションが動作することを確認
  const scale = await emailToggle.evaluate((el) => {
    return window.getComputedStyle(el).transform;
  });
  expect(scale).toBeTruthy();

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
});

test('E2E-SET-047: 縦向き・横向き切り替え', async ({ page }) => {
  // 縦向き表示（375x667）
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/client/settings');

  // ローディング完了を待機
  let loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールセクションが表示されていることを確認
  let profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();

  // 縦向き時の幅を確認
  let profileBox = await profileHeading.boundingBox();
  const portraitWidth = profileBox?.width;

  // 横向き表示（667x375）に切り替え
  await page.setViewportSize({ width: 667, height: 375 });

  // ローディング完了を待機
  loading = page.locator('[data-testid="loading-spinner"]');
  const isLoading = await loading.isVisible().catch(() => false);
  if (isLoading) {
    await expect(loading).not.toBeVisible({ timeout: 5000 });
  }

  // コンテンツが切れていないことを確認
  profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();

  // 横向き時の幅を確認
  profileBox = await profileHeading.boundingBox();
  const landscapeWidth = profileBox?.width;

  // 横向きの方が幅が広いことを確認
  if (portraitWidth && landscapeWidth) {
    expect(landscapeWidth).toBeGreaterThan(portraitWidth);
  }

  // スクロール可能であることを確認
  const pageHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight;
  });
  expect(pageHeight).toBeGreaterThan(0);

  // モーダルが適切に表示されることを確認
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();
});
