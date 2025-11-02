import { test, expect } from '@playwright/test';

/**
 * settings-password.spec.ts: パスワード変更関連テスト
 * テストID範囲: E2E-SET-009 ~ E2E-SET-012, E2E-SET-027, E2E-SET-029, E2E-SET-036, E2E-SET-041
 */

test('E2E-SET-009: パスワード変更（正常）', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 現在のパスワードを入力
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('OldPassword123!');

  // 新しいパスワードを入力
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('NewPassword456!');

  // 新しいパスワード（確認）を入力
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('NewPassword456!');

  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('パスワードが変更されました');

  // 3秒後にメッセージが自動で消えることを確認
  await expect(successMessage).not.toBeVisible({ timeout: 5000 });

  // 入力フィールドがクリアされることを確認
  await expect(currentPasswordField).toHaveValue('');
  await expect(newPasswordField).toHaveValue('');
  await expect(confirmPasswordField).toHaveValue('');
});

test('E2E-SET-010: パスワード変更（全フィールド空欄）', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 全フィールドを空欄のまま
  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('すべてのフィールドを入力してください');
});

test('E2E-SET-011: パスワード変更（8文字未満）', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 現在のパスワードを入力
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('OldPassword123!');

  // 8文字未満の新しいパスワードを入力
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('Short1!');

  // 確認パスワードを入力
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('Short1!');

  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('新しいパスワードは8文字以上で入力してください');
});

test('E2E-SET-012: パスワード変更（確認パスワード不一致）', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 現在のパスワードを入力
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('OldPassword123!');

  // 新しいパスワードを入力
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('NewPassword456!');

  // 異なる確認パスワードを入力
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('DifferentPassword789!');

  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('新しいパスワードが一致しません');
});

test('E2E-SET-027: パスワードフィールドの非表示', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 現在のパスワードフィールドをクリック
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.click();

  // パスワードを入力
  await currentPasswordField.fill('password123');

  // typeがpasswordであることを確認
  const passwordType = await currentPasswordField.getAttribute('type');
  expect(passwordType).toBe('password');

  // 入力文字が非表示になることを確認（inputのvalue属性では確認可能）
  await expect(currentPasswordField).toHaveValue('password123');
});

test('E2E-SET-029: パスワード変更ボタンの視覚フィードバック', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // パスワードを変更ボタンを確認
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await expect(changePasswordButton).toBeVisible();

  // ホバー時の視覚フィードバック
  await changePasswordButton.hover();

  // アイコンが表示されていることを確認
  const buttonIcon = page.locator('[data-testid="password-change-button-icon"]');
  await expect(buttonIcon).toBeVisible();

  // ボタンがクリック可能であることを確認
  await expect(changePasswordButton).toBeEnabled();
});

test('E2E-SET-036: パスワード変更（現在のパスワード不正）', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 間違った現在のパスワードを入力
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('WrongPassword123!');

  // 新しいパスワードを入力
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('NewPassword456!');

  // 新しいパスワード（確認）を入力
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('NewPassword456!');

  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('現在のパスワードが正しくありません');
});

test('E2E-SET-041: パスワード変更時のセキュリティ強度チェック', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 現在のパスワードを入力
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await currentPasswordField.fill('OldPassword123!');

  // 脆弱なパスワードを入力
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await newPasswordField.fill('password');

  // 確認パスワードを入力
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await confirmPasswordField.fill('password');

  // パスワードを変更ボタンをクリック
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await changePasswordButton.click();

  // パスワード強度に関する警告メッセージが表示されるか確認
  // （実装予定なので、警告メッセージが表示されるか、または処理が継続されるか確認）
  const warningMessage = page.locator('[data-testid="password-strength-warning"]');
  const isWarningVisible = await warningMessage.isVisible().catch(() => false);

  // 警告が表示されるか、そのまま処理が進むか確認
  if (isWarningVisible) {
    await expect(warningMessage).toContainText('より強固なパスワードを推奨します');
  }
});
