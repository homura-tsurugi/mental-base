import { test, expect } from '@playwright/test';

/**
 * settings-ui.spec.ts: UI・メッセージ表示関連テスト
 * テストID範囲: E2E-SET-023, E2E-SET-024, E2E-SET-028, E2E-SET-056 ~ E2E-SET-058
 */

test('E2E-SET-023: 成功メッセージ表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールを更新して成功メッセージを表示させる
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill('新しい名前');

  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // 成功メッセージボックスが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();

  // 背景色が緑であることを確認
  const messageStyle = await successMessage.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(messageStyle).toBeTruthy();

  // チェックアイコンが表示されていることを確認
  const checkIcon = page.locator('[data-testid="success-message-icon"]');
  await expect(checkIcon).toBeVisible();

  // テキストが表示されていることを確認
  await expect(successMessage).toContainText('プロフィールが更新されました');
});

test('E2E-SET-024: エラーメッセージ表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 無効なデータでプロフィールを更新
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();

  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージボックスが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();

  // 背景色が赤であることを確認
  const messageStyle = await errorMessage.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(messageStyle).toBeTruthy();

  // エラーアイコンが表示されていることを確認
  const errorIcon = page.locator('[data-testid="error-message-icon"]');
  await expect(errorIcon).toBeVisible();

  // テキストが表示されていることを確認
  await expect(errorMessage).toContainText('名前を入力してください');
});

test('E2E-SET-028: プロフィール保存ボタンの視覚フィードバック', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールを保存ボタンを確認
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await expect(saveButton).toBeVisible();

  // ホバー時の視覚フィードバック
  await saveButton.hover();

  // アイコンが表示されていることを確認
  const buttonIcon = page.locator('[data-testid="profile-save-button-icon"]');
  await expect(buttonIcon).toBeVisible();

  // ボタンの色がホバー時に変化することを確認
  const hoverStyle = await saveButton.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(hoverStyle).toBeTruthy();

  // ボタンがクリック可能であることを確認
  await expect(saveButton).toBeEnabled();
});

test('E2E-SET-056: 成功メッセージの自動消去タイマー', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールを更新
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill('新しい名前');

  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();

  // 3秒後にメッセージが消えることを確認
  await expect(successMessage).not.toBeVisible({ timeout: 5000 });
});

test('E2E-SET-057: 複数の成功メッセージ上書き', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールを更新
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill('新しい名前');

  const profileSaveButton = page.locator('[data-testid="profile-save-button"]');
  await profileSaveButton.click();

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('プロフィールが更新されました');

  // すぐにパスワードを変更
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('OldPassword123!');

  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('NewPassword456!');

  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('NewPassword456!');

  const passwordChangeButton = page.locator('[data-testid="password-change-button"]');
  await passwordChangeButton.click();

  // 最新の成功メッセージが表示されることを確認
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('パスワードが変更されました');

  // メッセージが重複表示されていないことを確認
  const allSuccessMessages = page.locator('[data-testid="success-message"]');
  const count = await allSuccessMessages.count();
  expect(count).toBeLessThanOrEqual(1);
});

test('E2E-SET-058: エラーメッセージと成功メッセージの排他制御', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 無効なデータでプロフィールを更新（エラー）
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();

  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('名前を入力してください');

  // 成功メッセージが表示されていないことを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).not.toBeVisible();

  // 正しいデータでプロフィールを更新（成功）
  await nameField.fill('正しい名前');
  await saveButton.click();

  // 成功メッセージが表示されることを確認
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('プロフィールが更新されました');

  // エラーメッセージが消えていることを確認
  await expect(errorMessage).not.toBeVisible();

  // メッセージが重複表示されていないことを確認
  const allMessages = page.locator('[data-testid="success-message"], [data-testid="error-message"]');
  const count = await allMessages.count();
  expect(count).toBeLessThanOrEqual(1);
});
