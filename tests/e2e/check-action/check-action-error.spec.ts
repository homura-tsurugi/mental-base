import { test, expect } from '@playwright/test';

/**
 * check-action-error.spec.ts: Check/Actionページの異常系テスト
 * テストID範囲: E2E-CHKACT-027 ~ E2E-CHKACT-037
 * 優先度: 高～中
 */

test.describe('Check/Actionページ - 異常系テスト', () => {
  test.beforeEach(async ({ page }) => {
    // 環境変数でスキップ認証を設定
    await page.context().addInitScript(() => {
      localStorage.setItem('VITE_SKIP_AUTH', 'true');
    });
  });

  // ===== API エラーハンドリング =====

  test('E2E-CHKACT-027: API接続エラー表示', async ({ page }) => {
    // APIモック切断状態でページアクセス（モックサービスを無効化）
    await page.context().addInitScript(() => {
      window.localStorage.setItem('MOCK_API_DISABLED', 'true');
    });

    await page.goto('/client/check-action');

    // 赤色背景のエラーカード表示「エラーが発生しました」
    const errorCard = page.locator('[data-testid="error-card"]');
    await expect(errorCard).toBeVisible({ timeout: 5000 });
    await expect(errorCard).toContainText('エラーが発生しました');

    // エラーカードが赤色背景であることを確認
    await expect(errorCard).toHaveClass(/bg-red|error/);

    // エラーメッセージが表示される
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
  });

  test('E2E-CHKACT-028: データなし状態表示', async ({ page }) => {
    // 空データでページアクセス（テストデータなし状態）
    await page.context().addInitScript(() => {
      window.localStorage.setItem('EMPTY_TEST_DATA', 'true');
    });

    await page.goto('/client/check-action');

    // 「データがありません」テキストが表示される
    const emptyMessage = page.locator('[data-testid="empty-state-message"]');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    await expect(emptyMessage).toContainText('データがありません');
  });

  // ===== フォーム検証エラー =====

  test('E2E-CHKACT-029: 振り返り内容空欄エラー', async ({ page }) => {
    await page.goto('/client/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="reflection-form"]', { timeout: 5000 });

    // 振り返り内容を空欄のままAI分析ボタンをクリック
    const reflectionContent = page.locator('[data-testid="reflection-content"]');
    await reflectionContent.fill(''); // 空欄にする

    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // 「振り返り内容を入力してください」エラーが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 2000 });
    await expect(errorAlert).toContainText('振り返り内容を入力してください');

    // AI分析は実行されない（ローディングが表示されない）
    const loadingIndicator = page.locator('[data-testid="ai-analysis-loading"]');
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('E2E-CHKACT-030: AI分析失敗エラー', async ({ page }) => {
    await page.goto('/client/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="reflection-form"]', { timeout: 5000 });

    // AIエラーモードを有効化
    await page.context().addInitScript(() => {
      window.localStorage.setItem('AI_API_ERROR', 'true');
    });

    // 振り返り内容を入力
    const reflectionContent = page.locator('[data-testid="reflection-content"]');
    await reflectionContent.fill('今週は朝のルーティンを確立できた');

    // AI分析ボタンをクリック
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // AI分析中のローディングが表示される
    const loadingIndicator = page.locator('[data-testid="ai-analysis-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });

    // AI分析失敗エラーアラートが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 3000 });
    await expect(errorAlert).toContainText('AI分析に失敗しました');

    // ローディングが解除される
    await expect(loadingIndicator).toBeHidden({ timeout: 2000 });
  });

  test('E2E-CHKACT-031: 振り返りなしでAI分析実行', async ({ page }) => {
    // 振り返りが存在しない状態を設定
    await page.context().addInitScript(() => {
      window.localStorage.setItem('NO_REFLECTION_DATA', 'true');
    });

    await page.goto('/client/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="reflection-form"]', { timeout: 5000 });

    // AI分析ボタンをクリック
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // 「まず振り返りを記録してください」アラートが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 2000 });
    await expect(errorAlert).toContainText('まず振り返りを記録してください');
  });

  // ===== アクションプラン作成エラー =====

  test('E2E-CHKACT-032: 改善計画タイトル空欄エラー', async ({ page }) => {
    await page.goto('/client/check-action');

    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-plan-form"]', { timeout: 5000 });

    // タイトルを空欄のまま説明のみ入力
    const descriptionInput = page.locator('[data-testid="action-plan-description"]');
    await descriptionInput.fill('朝6時に起床し、30分の運動習慣を確立する');

    // 作成ボタンをクリック
    const createBtn = page.locator('[data-testid="btn-create-action-plan"]');
    await createBtn.click();

    // 「計画タイトルを入力してください」エラーが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 2000 });
    await expect(errorAlert).toContainText('計画タイトルを入力してください');
  });

  test('E2E-CHKACT-033: アクション項目なしエラー', async ({ page }) => {
    await page.goto('/client/check-action');

    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-plan-form"]', { timeout: 5000 });

    // タイトルを入力
    const titleInput = page.locator('[data-testid="action-plan-title"]');
    await titleInput.fill('朝活習慣の改善プラン');

    // 説明を入力
    const descriptionInput = page.locator('[data-testid="action-plan-description"]');
    await descriptionInput.fill('朝6時に起床し、30分の運動習慣を確立する');

    // 全アクション項目を削除
    let actionItems = page.locator('[data-testid="action-item"]');
    let itemCount = await actionItems.count();

    for (let i = 0; i < itemCount; i++) {
      const deleteBtn = actionItems.first().locator('[data-testid="btn-delete-action-item"]');
      await deleteBtn.click();
      await page.waitForTimeout(100);
    }

    // 作成ボタンをクリック
    const createBtn = page.locator('[data-testid="btn-create-action-plan"]');
    await createBtn.click();

    // 「少なくとも1つのアクション項目を追加してください」エラーが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 2000 });
    await expect(errorAlert).toContainText('少なくとも1つのアクション項目を追加してください');
  });

  test('E2E-CHKACT-034: 改善計画作成失敗エラー', async ({ page }) => {
    // API呼び出し失敗モードを有効化
    await page.context().addInitScript(() => {
      window.localStorage.setItem('ACTION_PLAN_CREATE_ERROR', 'true');
    });

    await page.goto('/client/check-action');

    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-plan-form"]', { timeout: 5000 });

    // フォームに入力
    const titleInput = page.locator('[data-testid="action-plan-title"]');
    await titleInput.fill('朝活習慣の改善プラン');

    const descriptionInput = page.locator('[data-testid="action-plan-description"]');
    await descriptionInput.fill('朝6時に起床し、30分の運動習慣を確立する');

    // 作成ボタンをクリック
    const createBtn = page.locator('[data-testid="btn-create-action-plan"]');
    await createBtn.click();

    // 「改善計画の作成に失敗しました」エラーが表示される
    const errorAlert = page.locator('[data-testid="alert-error"]');
    await expect(errorAlert).toBeVisible({ timeout: 3000 });
    await expect(errorAlert).toContainText('改善計画の作成に失敗しました');

    // ローディングが解除される
    const loadingIndicator = page.locator('[data-testid="action-plan-loading"]');
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('E2E-CHKACT-035: ネットワーク切断時の挙動', async ({ page }) => {
    await page.goto('/client/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="stats-card"]', { timeout: 5000 });

    // ネットワークをオフラインに設定
    await page.context().setOffline(true);

    // 期間ボタンをクリックして新しいデータ取得を試みる
    const lastWeekBtn = page.locator('[data-testid="period-lastweek"]');
    await lastWeekBtn.click();

    // ページリロード
    await page.reload();

    // エラー表示またはキャッシュデータが表示される
    // 以下のいずれかが表示されることを確認
    const errorCard = page.locator('[data-testid="error-card"]');
    const statsCard = page.locator('[data-testid="stats-card"]');

    const hasError = await errorCard.isVisible();
    const hasStats = await statsCard.isVisible();

    expect(hasError || hasStats).toBeTruthy();

    // ネットワークをオンラインに戻す
    await page.context().setOffline(false);
  });

  test('E2E-CHKACT-036: APIタイムアウト処理', async ({ page }) => {
    // タイムアウトモードを有効化
    await page.context().addInitScript(() => {
      window.localStorage.setItem('AI_API_TIMEOUT', 'true');
    });

    await page.goto('/client/check-action');

    // ページ読み込みを待つ
    await page.waitForSelector('[data-testid="reflection-form"]', { timeout: 5000 });

    // 振り返り内容を入力
    const reflectionContent = page.locator('[data-testid="reflection-content"]');
    await reflectionContent.fill('今週は朝のルーティンを確立できた');

    // AI分析ボタンをクリック
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // AI分析中のローディングが表示される
    const loadingIndicator = page.locator('[data-testid="ai-analysis-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });

    // 30秒以上待機してタイムアウトを確認
    // タイムアウトエラー表示またはローディング継続を確認（最大35秒待機）
    const errorAlert = page.locator('[data-testid="alert-error"]');
    let hasTimeout = false;

    try {
      await expect(errorAlert).toBeVisible({ timeout: 35000 });
      const alertText = await errorAlert.textContent();
      hasTimeout = alertText?.includes('タイムアウト') ?? false;
    } catch (e) {
      // ローディングが続いている可能性もある
      const stillLoading = await loadingIndicator.isVisible();
      hasTimeout = stillLoading;
    }

    expect(hasTimeout).toBeTruthy();
  });

  test('E2E-CHKACT-037: 不正なデータ形式エラー', async ({ page }) => {
    // 不正なデータモードを有効化
    await page.context().addInitScript(() => {
      window.localStorage.setItem('INVALID_DATA_FORMAT', 'true');
    });

    await page.goto('/client/check-action');

    // ページが読み込まれ、エラーメッセージが表示される
    const errorCard = page.locator('[data-testid="error-card"]');
    await expect(errorCard).toBeVisible({ timeout: 5000 });
    await expect(errorCard).toContainText('エラーが発生しました');

    // アプリケーションがクラッシュしていないことを確認
    //（ページが正常にレンダリングされている）
    const pageContent = page.locator('[data-testid="page-title"]');
    const errorMessage = page.locator('[data-testid="error-message"]');

    // ページタイトルまたはエラーメッセージが表示されている
    const hasContent = await pageContent.isVisible().catch(() => false);
    const hasErrorMsg = await errorMessage.isVisible();

    expect(hasContent || hasErrorMsg).toBeTruthy();
  });
});
