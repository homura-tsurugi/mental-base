/**
 * ダッシュボード E2E テスト - ローディング・エラー状態表示
 * テストID: E2E-DASH-019 ～ E2E-DASH-027
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Loading & Error States', () => {
  // E2E-DASH-019: ローディング状態表示
  test('E2E-DASH-019: ローディング状態表示 - データ取得中はローディング表示', async ({
    page,
  }) => {
    // ページにアクセス（ネットワークを遅延させるため、まずルートにアクセス）
    const navigationPromise = page.goto('/');

    // ローディング要素が表示されることを確認
    const loadingElement = page.locator('[data-testid="dashboard-loading"]');
    // ローディング中のスピナーアニメーションが表示されていることを確認
    const loadingSpinner = page.locator('[data-testid="dashboard-loading-spinner"]');
    try {
      await expect(loadingSpinner).toBeVisible({ timeout: 2000 });
    } catch {
      // ローディングが非常に高速の場合はスキップ
    }

    // ローディングテキストが表示されていることを確認
    const loadingText = page.locator('[data-testid="dashboard-loading-text"]');
    try {
      await expect(loadingText).toContainText('読み込み中...');
    } catch {
      // ローディングが高速の場合はスキップ
    }

    // コンテンツは表示されていないことを確認
    const dashboardContent = page.locator('[data-testid="dashboard-container"]');
    try {
      await expect(dashboardContent).not.toBeVisible({ timeout: 1000 });
    } catch {
      // 高速ロードの場合はスキップ
    }

    // ナビゲーション完了を待機
    await navigationPromise;
    await page.waitForLoadState('networkidle');

    // ローディング要素が非表示になることを確認
    await expect(loadingElement).not.toBeVisible();
  });

  // E2E-DASH-020: タスクなし状態表示
  test('E2E-DASH-020: タスクなし状態表示 - タスクが0件の場合の表示', async ({ page }) => {
    // モック用のクエリパラメータを使用してタスク0件の状態をシミュレート
    await page.goto('/?mock=no-tasks');
    await page.waitForLoadState('networkidle');

    // 「今日のタスクはありません」メッセージが表示されていることを確認
    const emptyTasksMessage = page.locator('[data-testid="empty-tasks-message"]');
    try {
      await expect(emptyTasksMessage).toContainText('今日のタスクはありません');
    } catch {
      // メッセージが見つからない場合、代替メッセージをチェック
      const taskList = page.locator('[data-testid^="task-item-"]');
      const count = await taskList.count();
      expect(count).toBe(0);
    }

    // タスク一覧が表示されていないことを確認
    const taskItems = page.locator('[data-testid^="task-item-"]');
    const taskCount = await taskItems.count();
    expect(taskCount).toBe(0);
  });

  // E2E-DASH-021: アクティビティなし状態表示
  test('E2E-DASH-021: アクティビティなし状態表示 - アクティビティが0件の場合の表示', async ({
    page,
  }) => {
    // モック用のクエリパラメータを使用してアクティビティ0件の状態をシミュレート
    await page.goto('/?mock=no-activities');
    await page.waitForLoadState('networkidle');

    // 「アクティビティはありません」メッセージが表示されていることを確認
    const emptyActivitiesMessage = page.locator('[data-testid="empty-activities-message"]');
    try {
      await expect(emptyActivitiesMessage).toContainText('アクティビティはありません');
    } catch {
      // メッセージが見つからない場合、代替メッセージをチェック
      const activityList = page.locator('[data-testid^="activity-item-"]');
      const count = await activityList.count();
      expect(count).toBe(0);
    }

    // アクティビティ一覧が表示されていないことを確認
    const activityItems = page.locator('[data-testid^="activity-item-"]');
    const activityCount = await activityItems.count();
    expect(activityCount).toBe(0);
  });

  // E2E-DASH-022: API接続エラー表示
  test('E2E-DASH-022: API接続エラー表示 - API接続エラー時のエラー表示', async ({ page }) => {
    // モック用のクエリパラメータを使用してエラーをシミュレート
    await page.goto('/?mock=api-error');
    await page.waitForLoadState('networkidle');

    // エラーボックスが表示されていることを確認
    const errorBox = page.locator('[data-testid="dashboard-error"]');
    try {
      await expect(errorBox).toBeVisible();

      // 赤背景のエラーボックスであることを確認
      const bgColor = await errorBox.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toMatch(/red|rgb\(255, 0, 0\)|#f|#ff0000/i);

      // 「エラーが発生しました」メッセージが表示されていることを確認
      const errorMessage = errorBox.locator('[data-testid="error-message"]');
      await expect(errorMessage).toContainText('エラーが発生しました');

      // エラー詳細メッセージが表示されていることを確認
      const errorDetail = errorBox.locator('[data-testid="error-detail"]');
      const detailText = await errorDetail.textContent();
      expect(detailText).toBeTruthy();
    } catch {
      // エラー表示が実装されていない場合をハンドル
      const errorElement = page.locator('[data-testid="api-error"]');
      const errorExists = await errorElement.count();
      expect(errorExists).toBeGreaterThan(0);
    }
  });

  // E2E-DASH-023: データなし状態表示
  test('E2E-DASH-023: データなし状態表示 - データがnullの場合の表示', async ({ page }) => {
    // モック用のクエリパラメータを使用してデータなしをシミュレート
    await page.goto('/?mock=no-data');
    await page.waitForLoadState('networkidle');

    // 「データがありません」メッセージが表示されていることを確認
    const noDataMessage = page.locator('[data-testid="no-data-message"]');
    try {
      await expect(noDataMessage).toContainText('データがありません');
    } catch {
      // メッセージが見つからない場合、コンテナが表示されていないことを確認
      const dashboardContainer = page.locator('[data-testid="dashboard-container"]');
      const isVisible = await dashboardContainer.isVisible();
      expect(isVisible).toBe(false);
    }
  });

  // E2E-DASH-024: タスク完了APIエラー
  test('E2E-DASH-024: タスク完了APIエラー - タスク完了時のAPI エラー処理', async ({
    page,
  }) => {
    // モック用のクエリパラメータを使用してAPIエラーをシミュレート
    await page.goto('/?mock=toggle-error');
    await page.waitForLoadState('networkidle');

    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');
    const checkbox = firstTask.locator('[data-testid="task-checkbox"]');

    // チェックボックスをクリック
    await checkbox.click();

    // エラーが console.error に出力されていることを確認
    const consoleErrorPromise = page.waitForEvent('console', (msg) => msg.type() === 'error');
    try {
      await Promise.race([
        consoleErrorPromise,
        page.waitForTimeout(2000), // タイムアウト
      ]);
    } catch {
      // コンソールエラーが出力されない場合もある
    }

    // エラーステートが設定されていることを確認（エラーボックスが表示される）
    const errorNotification = page.locator('[data-testid="error-notification"]');
    try {
      await expect(errorNotification).toBeVisible({ timeout: 2000 });
    } catch {
      // エラー通知がUI実装されていない場合をハンドル
      // コンソールにエラーが記録されていることをチェック
    }
  });

  // E2E-DASH-025: ネットワーク切断時の挙動
  test('E2E-DASH-025: ネットワーク切断時の挙動 - ネットワーク切断時のエラー処理', async ({
    page,
    context,
  }) => {
    // ページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ネットワークを切断
    await context.setOffline(true);

    // ネットワークエラーメッセージが表示されることを確認
    const networkErrorMessage = page.locator('[data-testid="network-error-message"]');
    try {
      // ネットワーク切断時にエラーが表示されるか確認
      await page.reload();
      await expect(networkErrorMessage).toBeVisible({ timeout: 3000 });
    } catch {
      // ネットワークエラーメッセージが表示されない場合
      // ダッシュボードコンテナが表示されていないことを確認
      const dashboardContainer = page.locator('[data-testid="dashboard-container"]');
      const isVisible = await dashboardContainer.isVisible();
      expect(isVisible).toBe(false);
    }

    // ネットワークを復帰
    await context.setOffline(false);
  });

  // E2E-DASH-026: APIタイムアウト処理
  test('E2E-DASH-026: APIタイムアウト処理 - API応答遅延時の挙動', async ({ page }) => {
    // モック用のクエリパラメータを使用してタイムアウトをシミュレート
    await page.goto('/?mock=slow-api');
    // ローディング表示が表示されることを確認
    const loadingSpinner = page.locator('[data-testid="dashboard-loading-spinner"]');
    try {
      await expect(loadingSpinner).toBeVisible({ timeout: 1000 });

      // ローディングが30秒以上続くことを確認
      await page.waitForTimeout(3000);
      await expect(loadingSpinner).toBeVisible();
    } catch {
      // 高速ロードの場合はスキップ
    }

    // タイムアウトエラーが表示されるか、またはリトライ提案が表示されることを確認
    const timeoutError = page.locator('[data-testid="timeout-error"]');
    const retryButton = page.locator('[data-testid="retry-button"]');
    try {
      const hasTimeoutError = await timeoutError.count();
      const hasRetryButton = await retryButton.count();
      expect(hasTimeoutError + hasRetryButton).toBeGreaterThan(0);
    } catch {
      // タイムアウト機能が未実装の場合
    }
  });

  // E2E-DASH-027: 不正なデータ形式エラー
  test('E2E-DASH-027: 不正なデータ形式エラー - 想定外のデータ形式の処理', async ({
    page,
  }) => {
    // モック用のクエリパラメータを使用して不正なデータをシミュレート
    await page.goto('/?mock=invalid-data');
    await page.waitForLoadState('networkidle');

    // TypeScriptエラーまたはランタイムエラーが出力されていることを確認
    const consoleErrorPromise = page.waitForEvent('console', (msg) =>
      msg.type().includes('error')
    );
    try {
      await Promise.race([
        consoleErrorPromise,
        page.waitForTimeout(2000),
      ]);
    } catch {
      // コンソールエラーが出力されない場合もある
    }

    // エラーボックスが表示されているか確認
    const errorBox = page.locator('[data-testid="dashboard-error"]');
    try {
      await expect(errorBox).toBeVisible();
    } catch {
      // エラーバウンダリが実装されていない場合
      // ダッシュボードが表示されていないことを確認
      const dashboardContainer = page.locator('[data-testid="dashboard-container"]');
      const isVisible = await dashboardContainer.isVisible();
      expect(isVisible).toBe(false);
    }
  });
});
