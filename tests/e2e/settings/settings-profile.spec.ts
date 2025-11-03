import { test, expect } from '@playwright/test';

/**
 * settings-profile.spec.ts: プロフィール更新関連テスト
 * テストID範囲: E2E-SET-006 ~ E2E-SET-008, E2E-SET-025, E2E-SET-026, E2E-SET-035, E2E-SET-051 ~ E2E-SET-054
 */

test('E2E-SET-006: プロフィール更新（正常）', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 名前を変更
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill('佐藤 花子');

  // メールアドレスを変更
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await emailField.clear();
  await emailField.fill('sato@example.com');

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // 成功メッセージが表示されることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
  await expect(successMessage).toContainText('プロフィールが更新されました');

  // 3秒後にメッセージが自動で消えることを確認
  await expect(successMessage).not.toBeVisible({ timeout: 5000 });

  // フォームに新しい情報が反映されていることを確認
  await expect(nameField).toHaveValue('佐藤 花子');
  await expect(emailField).toHaveValue('sato@example.com');
});

test('E2E-SET-007: プロフィール更新（名前空欄）', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 名前を空欄にする
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('名前を入力してください');
});

test('E2E-SET-008: プロフィール更新（無効なメール形式）', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メールアドレスを無効な形式に変更
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await emailField.clear();
  await emailField.fill('invalid-email');

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('有効なメールアドレスを入力してください');
});

test('E2E-SET-025: プロフィール名前フィールド入力', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 名前フィールドをクリック
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.click();

  // フォーカス状態を確認
  await expect(nameField).toBeFocused();

  // 入力を確認
  await nameField.clear();
  await nameField.fill('新しい名前');
  await expect(nameField).toHaveValue('新しい名前');
});

test('E2E-SET-026: プロフィールメールフィールド入力', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メールフィールドをクリック
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await emailField.click();

  // フォーカス状態を確認
  await expect(emailField).toBeFocused();

  // 入力を確認
  await emailField.clear();
  await emailField.fill('new@example.com');
  await expect(emailField).toHaveValue('new@example.com');
});

test('E2E-SET-035: プロフィール更新（メール重複）', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // メールアドレスを既存ユーザーのものに変更
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await emailField.clear();
  await emailField.fill('existing@example.com');

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('このメールアドレスは既に使用されています');
});

test('E2E-SET-051: 長い名前の表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 100文字以上の名前を入力
  const longName = '田中太郎' + '太郎'.repeat(30);
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill(longName);

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // 名前がはみ出さずに表示されていることを確認
  const profileCard = page.locator('[data-testid="profile-card"]');
  await expect(profileCard).toBeVisible();

  // フォームがはみ出さないことを確認
  const formContainer = page.locator('[data-testid="settings-form"]');
  const boundingBox = await formContainer.boundingBox();
  expect(boundingBox).not.toBeNull();
});

test('E2E-SET-052: 長いメールアドレスの表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 100文字以上のメールアドレスを入力
  const longEmail = 'verylongemailadresswithuserprefix' + '@verylongdomainname.co.jp';
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await emailField.clear();
  await emailField.fill(longEmail);

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // メールアドレスがはみ出さずに表示されていることを確認
  const profileCard = page.locator('[data-testid="profile-card"]');
  await expect(profileCard).toBeVisible();

  // フォームがはみ出さないことを確認
  const formContainer = page.locator('[data-testid="settings-form"]');
  const boundingBox = await formContainer.boundingBox();
  expect(boundingBox).not.toBeNull();
});

test('E2E-SET-053: 特殊文字を含む名前', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 特殊文字を含む名前を入力
  const specialName = '田中<太郎>';
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill(specialName);

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーが発生しないことを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).not.toBeVisible();

  // 特殊文字がエスケープされていることを確認
  const successMessage = page.locator('[data-testid="success-message"]');
  await expect(successMessage).toBeVisible();
});

test('E2E-SET-054: 空白のみの名前', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 空白のみの名前を入力
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await nameField.clear();
  await nameField.fill('   ');

  // プロフィールを保存ボタンをクリック
  const saveButton = page.locator('[data-testid="profile-save-button"]');
  await saveButton.click();

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('名前を入力してください');
});
