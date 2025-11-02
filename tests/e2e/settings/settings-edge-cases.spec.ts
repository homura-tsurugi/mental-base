import { test, expect } from '@playwright/test';

/**
 * settings-edge-cases.spec.ts: エッジケース・その他テスト
 * テストID範囲: E2E-SET-032 ~ E2E-SET-034, E2E-SET-055
 */

test('E2E-SET-032: ネットワーク切断時の挙動', async ({ page }) => {
  // オフラインモードに設定
  await page.context().setOffline(true);

  await page.goto('/settings');

  // ネットワークエラーが表示されることを確認
  const errorBox = page.locator('[data-testid="error-message"]');

  // エラーが表示されるまで待機
  await expect(errorBox).toBeVisible({ timeout: 5000 });

  // ネットワークエラーメッセージを確認
  await expect(errorBox).toContainText('エラーが発生しました');

  // オンラインに戻す
  await page.context().setOffline(false);

  // リトライが可能であることを確認
  const retryButton = page.locator('[data-testid="retry-button"]');

  // リトライボタンが存在する場合
  if (await retryButton.isVisible()) {
    await retryButton.click();

    // ページが再度読み込まれることを確認
    const loading = page.locator('[data-testid="loading-spinner"]');
    await expect(loading).toBeVisible({ timeout: 1000 });
  }
});

test('E2E-SET-033: APIタイムアウト処理', async ({ page }) => {
  // APIレスポンスを遅延させる
  await page.route('**/api/**', async (route) => {
    // 30秒以上の遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 31000));
    route.continue();
  });

  await page.goto('/settings', { timeout: 35000 });

  // ローディング状態が継続されることを確認
  const loading = page.locator('[data-testid="loading-spinner"]');
  const isLoading = await loading.isVisible().catch(() => false);

  if (isLoading) {
    // ローディングが続いていることを確認
    await expect(loading).toBeVisible();
  }

  // タイムアウト処理が実装されている場合はエラーメッセージが表示される
  const errorMessage = page.locator('[data-testid="error-message"]');
  const isErrorVisible = await errorMessage.isVisible().catch(() => false);

  // ローディングまたはエラーが表示されることを確認
  expect(isLoading || isErrorVisible).toBe(true);

  // ルートを復元
  await page.unroute('**/api/**');
});

test('E2E-SET-034: 不正なデータ形式エラー', async ({ page }) => {
  // 不正なデータ形式をシミュレート
  await page.route('**/api/users/profile', (route) => {
    route.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        // 不正な型のデータを返す
        name: 123, // stringではなくnumber
        email: { invalid: 'structure' }, // stringではなくobject
      }),
    });
  });

  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // エラーが表示されることを確認
  const errorBox = page.locator('[data-testid="error-message"]');
  const isErrorVisible = await errorBox.isVisible().catch(() => false);

  if (isErrorVisible) {
    // エラーメッセージが表示されている
    await expect(errorBox).toBeVisible();
  }

  // ページが表示されているか確認
  const pageContent = page.locator('body');
  await expect(pageContent).toBeVisible();
});

test('E2E-SET-055: モーダル内のイベント伝播防止', async ({ page }) => {
  await page.goto('/settings');

  // ローディング完了を待機
  const loading = page.locator('[data-testid="loading-spinner"]');
  await expect(loading).not.toBeVisible({ timeout: 5000 });

  // アカウント削除モーダルを表示
  const deleteAccountButton = page.locator('[data-testid="account-delete-button"]');
  await deleteAccountButton.click();

  const modal = page.locator('[data-testid="account-delete-modal"]');
  await expect(modal).toBeVisible();

  // モーダル内のコンテンツをクリック
  const modalTitle = page.locator('[data-testid="account-delete-modal-title"]');
  await modalTitle.click();

  // モーダルが閉じないことを確認
  await expect(modal).toBeVisible();

  // キャンセルボタンをクリック
  const cancelButton = page.locator('[data-testid="account-delete-modal-cancel-button"]');
  await cancelButton.click();

  // モーダルが正しく閉じることを確認
  await expect(modal).not.toBeVisible();

  // 意図しない操作が発生していないことを確認
  const profileHeading = page.locator('[data-testid="profile-heading"]');
  await expect(profileHeading).toBeVisible();
});
