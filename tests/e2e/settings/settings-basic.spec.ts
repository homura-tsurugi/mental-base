import { test, expect } from '@playwright/test';

/**
 * settings-basic.spec.ts: 設定ページの基本機能テスト
 * テストID範囲: E2E-SET-001 ~ E2E-SET-005, E2E-SET-021, E2E-SET-022
 */

test('E2E-SET-001: 設定ページ初期アクセス', async ({ page }) => {
  await page.goto('/client/settings');

  // ページが正常に読み込まれることを確認（タイトルは動的に設定されるため少し待つ）
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Settings|Mental-Base/i);

  // エラーメッセージが表示されていないことを確認
  const errorBox = page.locator('[data-testid="error-message"]');
  await expect(errorBox).not.toBeVisible();
});

test('E2E-SET-002: プロフィール情報表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング状態が完了するまで待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // プロフィールセクション見出しを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();
  await expect(profileHeading).toContainText('プロフィール');

  // 名前フィールドを確認
  const nameField = page.locator('[data-testid="profile-name-input"]');
  await expect(nameField).toBeVisible();
  await expect(nameField).toHaveValue('田中 太郎');

  // メールアドレスフィールドを確認
  const emailField = page.locator('[data-testid="profile-email-input"]');
  await expect(emailField).toBeVisible();
  await expect(emailField).toHaveValue('test@mentalbase.local');
});

test('E2E-SET-003: 通知設定表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング状態が完了するまで待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // 通知設定セクション見出しを確認
  const notificationHeading = page.locator('[data-testid="notification-heading"]');
  await expect(notificationHeading).toBeVisible();
  await expect(notificationHeading).toContainText('通知設定');

  // メール通知トグル（実際のinputは非表示なのでdata-state属性のみチェック）
  const emailToggle = page.locator('[data-testid="notification-email-toggle"]');
  await expect(emailToggle).toBeAttached();

  // トグルが有効状態であることを確認
  await expect(emailToggle).toHaveAttribute('data-state', 'checked');

  // 説明文を確認
  const description = page.locator('[data-testid="notification-email-description"]');
  await expect(description).toBeVisible();
  await expect(description).toContainText('重要なお知らせやリマインダーをメールで受け取る');
});

test('E2E-SET-004: パスワード変更フォーム表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング状態が完了するまで待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // パスワード変更セクション見出しを確認
  const passwordHeading = page.locator('[data-testid="password-heading"]');
  await expect(passwordHeading).toBeVisible();
  await expect(passwordHeading).toContainText('パスワード変更');

  // 現在のパスワード入力フィールドを確認
  const currentPasswordField = page.locator('[data-testid="password-current-input"]');
  await expect(currentPasswordField).toBeVisible();

  // 新しいパスワード入力フィールドを確認
  const newPasswordField = page.locator('[data-testid="password-new-input"]');
  await expect(newPasswordField).toBeVisible();

  // 新しいパスワード（確認）入力フィールドを確認
  const confirmPasswordField = page.locator('[data-testid="password-confirm-input"]');
  await expect(confirmPasswordField).toBeVisible();

  // パスワードを変更ボタンを確認
  const changePasswordButton = page.locator('[data-testid="password-change-button"]');
  await expect(changePasswordButton).toBeVisible();
  await expect(changePasswordButton).toContainText('パスワードを変更');
});

test('E2E-SET-005: アカウント管理セクション表示', async ({ page }) => {
  await page.goto('/client/settings');

  // ローディング状態が完了するまで待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウント管理セクション見出しを確認
  const accountHeading = page.locator('[data-testid="account-heading"]');
  await expect(accountHeading).toBeVisible();
  await expect(accountHeading).toContainText('アカウント管理');

  // 危険ゾーン表示を確認
  const dangerZone = page.locator('[data-testid="account-danger-zone"]');
  await expect(dangerZone).toBeVisible();

  // 警告アイコンと「危険な操作」テキストを確認
  const warningIcon = page.locator('[data-testid="account-warning-icon"]');
  await expect(warningIcon).toBeVisible();

  const warningText = page.locator('[data-testid="account-warning-text"]');
  await expect(warningText).toBeVisible();
  await expect(warningText).toContainText('危険な操作');

  // 説明文を確認
  const accountDescription = page.locator('[data-testid="account-description"]');
  await expect(accountDescription).toBeVisible();
  await expect(accountDescription).toContainText('アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。');

  // アカウント削除ボタンを確認
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await expect(deleteAccountButton).toBeVisible();
  await expect(deleteAccountButton).toContainText('アカウントを削除');
});

test('E2E-SET-021: ローディング状態表示', async ({ page }) => {
  // ネットワークを遅延させてローディング状態をキャプチャ
  await page.route('**/api/users/**', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms遅延
    route.continue();
  });

  await page.goto('/client/settings');

  // スピナーアニメーションが表示されることを確認
  const spinner = page.locator('[data-testid="loading-spinner"]');
  const loadingText = page.locator('[data-testid="loading-text"]');

  // ローディング要素が存在することを確認（短い時間で消える可能性あり）
  const spinnerVisible = await spinner.isVisible().catch(() => false);
  const textVisible = await loadingText.isVisible().catch(() => false);

  // どちらかが表示されればOK
  expect(spinnerVisible || textVisible).toBeTruthy();

  // ローディング完了後、コンテンツが表示されることを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible({ timeout: 10000 });
});

test('E2E-SET-022: API接続エラー表示', async ({ page }) => {
  // APIエラーをシミュレートするため、無効なエンドポイントに設定
  // または、モック実装でエラーを返すように設定
  await page.route('**/api/users/profile', (route) => {
    route.abort('failed');
  });

  await page.goto('/client/settings');

  // エラーボックスが表示されることを確認
  const errorBox = page.locator('[data-testid="error-message"]');
  await expect(errorBox).toBeVisible({ timeout: 5000 });

  // エラーメッセージが表示されることを確認
  await expect(errorBox).toContainText('エラーが発生しました');
});
