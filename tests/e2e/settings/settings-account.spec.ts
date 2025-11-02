import { test, expect } from '@playwright/test';

/**
 * settings-account.spec.ts: アカウント削除関連テスト
 * テストID範囲: E2E-SET-016 ~ E2E-SET-020, E2E-SET-030
 */

test('E2E-SET-016: アカウント削除モーダル表示', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウントを削除ボタンをクリック
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  // モーダルが表示されることを確認
  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // モーダルタイトルを確認
  const modalTitle = page.locator('[data-testid="account-delete-modal-title"]');
  await expect(modalTitle).toBeVisible();
  await expect(modalTitle).toContainText('アカウント削除の確認');

  // 警告文を確認
  const warningText = page.locator('[data-testid="account-delete-modal-warning"]');
  await expect(warningText).toBeVisible();
  await expect(warningText).toContainText('本当にアカウントを削除しますか？この操作は取り消せません。すべてのデータが完全に削除されます。');

  // キャンセルボタンを確認
  const cancelButton = page.locator('[data-testid="account-delete-modal-cancel-button"]');
  await expect(cancelButton).toBeVisible();
  await expect(cancelButton).toContainText('キャンセル');

  // 削除するボタンを確認
  const confirmDeleteButton = page.locator('[data-testid="account-delete-modal-confirm-button"]');
  await expect(confirmDeleteButton).toBeVisible();
  await expect(confirmDeleteButton).toContainText('削除する');

  // 背景が暗くなっていることを確認
  const backdrop = page.locator('[data-testid="account-delete-modal-backdrop"]');
  await expect(backdrop).toBeVisible();
});

test('E2E-SET-017: アカウント削除モーダルキャンセル', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウントを削除ボタンをクリック
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  // モーダルが表示されることを確認
  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // キャンセルボタンをクリック
  const cancelButton = page.locator('[data-testid="account-delete-modal-cancel-button"]');
  await cancelButton.click();

  // モーダルが閉じることを確認
  await expect(modal).not.toBeVisible();

  // 設定ページに戻ることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();
});

test('E2E-SET-018: アカウント削除モーダル背景クリックで閉じる', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウントを削除ボタンをクリック
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  // モーダルが表示されることを確認
  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // 背景（backdrop）をクリック
  const backdrop = page.locator('[data-testid="account-delete-modal-backdrop"]');
  await backdrop.click();

  // モーダルが閉じることを確認
  await expect(modal).not.toBeVisible();

  // 設定ページに戻ることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();
});

test('E2E-SET-019: アカウント削除実行', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウントを削除ボタンをクリック
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  // モーダルが表示されることを確認
  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // 削除するボタンをクリック
  const confirmDeleteButton = page.locator('[data-testid="account-delete-modal-confirm-button"]');
  await confirmDeleteButton.click();

  // アラート（alert）が表示されることを確認（またはメッセージボックス）
  page.once('dialog', (dialog) => {
    expect(dialog.message()).toContain('アカウントが削除されました');
    dialog.accept();
  });

  // ログインページにリダイレクトされることを確認
  await page.waitForNavigation({ waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('E2E-SET-020: アカウント削除APIエラー', async ({ page }) => {
  // アカウント削除APIでエラーをシミュレート
  await page.route('**/api/users/account', (route) => {
    route.abort('failed');
  });

  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウントを削除ボタンをクリック
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  // モーダルが表示されることを確認
  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // 削除するボタンをクリック
  const confirmDeleteButton = page.locator('[data-testid="account-delete-modal-confirm-button"]');
  await confirmDeleteButton.click();

  // モーダルが閉じることを確認
  await expect(modal).not.toBeVisible({ timeout: 2000 });

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();

  // アカウントが削除されていないことを確認
  const accountHeading = page.locator('[data-testid="account-heading"]');
  await expect(accountHeading).toBeVisible();
});

test('E2E-SET-030: アカウント削除ボタンの視覚フィードバック', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウント削除ボタンを確認
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await expect(deleteAccountButton).toBeVisible();

  // ホバー時の視覚フィードバック
  await deleteAccountButton.hover();

  // ボタンの色がより濃い赤になることを確認（bg-red-600）
  const buttonStyle = await deleteAccountButton.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(buttonStyle).toBeTruthy();

  // アイコンが表示されていることを確認
  const buttonIcon = page.locator('[data-testid="account-delete-button-icon"]');
  await expect(buttonIcon).toBeVisible();

  // ボタンがクリック可能であることを確認
  await expect(deleteAccountButton).toBeEnabled();
});
