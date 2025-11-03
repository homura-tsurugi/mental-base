/**
 * ダッシュボード E2E テスト - ページアクセス・基本表示
 * テストID: E2E-DASH-001 ～ E2E-DASH-008
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Page Access & Basic Display', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページにアクセス
    await page.goto('/client');
  });

  // E2E-DASH-001: ダッシュボード初期アクセス
  test('E2E-DASH-001: ダッシュボード初期アクセス - ページが正常に表示される', async ({
    page,
  }) => {
    // ローディング表示が表示されることを確認
    const loadingElement = page.locator('[data-testid="dashboard-loading"]');

    // ページがロードされたことを確認
    await page.waitForLoadState('networkidle');

    // ダッシュボードコンテナが表示されていることを確認
    const dashboardContainer = page.locator('[data-testid="dashboard-container"]');
    await expect(dashboardContainer).toBeVisible();

    // エラーが表示されていないことを確認
    const errorElement = page.locator('[data-testid="dashboard-error"]');
    await expect(errorElement).not.toBeVisible();
  });

  // E2E-DASH-002: ユーザー情報表示
  test('E2E-DASH-002: ユーザー情報表示 - モックユーザー情報が正しく表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // ユーザー名の確認
    const userName = page.locator('[data-testid="user-name"]');
    await expect(userName).toContainText('Tanaka Sato');

    // イニシャルの確認
    const initials = page.locator('[data-testid="user-initials"]');
    await expect(initials).toContainText('TS');

    // メールアドレスの確認
    const email = page.locator('[data-testid="user-email"]');
    await expect(email).toContainText('test@mentalbase.local');
  });

  // E2E-DASH-003: COM:PASS進捗サマリー表示
  test('E2E-DASH-003: COM:PASS進捗サマリー表示 - 4フェーズの進捗が表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // COM:PASS進捗サマリー見出しの確認
    const sectionTitle = page.locator('[data-testid="compass-summary-title"]');
    await expect(sectionTitle).toContainText('COM:PASS進捗サマリー');

    // 4つのカードが表示されていることを確認
    const cards = page.locator('[data-testid^="compass-card-"]');
    await expect(cards).toHaveCount(4);

    // 各カードに進捗率が表示されていることを確認
    const progressBars = page.locator('[data-testid^="compass-progress-"]');
    await expect(progressBars).toHaveCount(4);
  });

  // E2E-DASH-004: PLAN進捗カード表示
  test('E2E-DASH-004: PLAN進捗カード表示 - PLANフェーズの進捗が正しく表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // PLANカードの確認
    const planCard = page.locator('[data-testid="compass-card-plan"]');
    await expect(planCard).toBeVisible();

    // ラベルの確認
    const planLabel = planCard.locator('[data-testid="compass-label"]');
    await expect(planLabel).toContainText('PLAN');

    // サブラベルの確認
    const subLabel = planCard.locator('[data-testid="compass-sublabel"]');
    await expect(subLabel).toContainText('計画');

    // 進捗率の確認
    const progressText = planCard.locator('[data-testid="compass-percentage"]');
    await expect(progressText).toContainText('75%');

    // 円形プログレスバーの確認
    const progressBar = planCard.locator('[data-testid="compass-progress-plan"]');
    await expect(progressBar).toBeVisible();
  });

  // E2E-DASH-005: DO進捗カード表示
  test('E2E-DASH-005: DO進捗カード表示 - DOフェーズの進捗が正しく表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // DOカードの確認
    const doCard = page.locator('[data-testid="compass-card-do"]');
    await expect(doCard).toBeVisible();

    // ラベルの確認
    const doLabel = doCard.locator('[data-testid="compass-label"]');
    await expect(doLabel).toContainText('DO');

    // サブラベルの確認
    const subLabel = doCard.locator('[data-testid="compass-sublabel"]');
    await expect(subLabel).toContainText('実行');

    // 進捗率の確認
    const progressText = doCard.locator('[data-testid="compass-percentage"]');
    await expect(progressText).toContainText('60%');
  });

  // E2E-DASH-006: Check進捗カード表示
  test('E2E-DASH-006: Check進捗カード表示 - Checkフェーズの進捗が正しく表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // Checkカードの確認
    const checkCard = page.locator('[data-testid="compass-card-check"]');
    await expect(checkCard).toBeVisible();

    // ラベルの確認
    const checkLabel = checkCard.locator('[data-testid="compass-label"]');
    await expect(checkLabel).toContainText('Check');

    // サブラベルの確認
    const subLabel = checkCard.locator('[data-testid="compass-sublabel"]');
    await expect(subLabel).toContainText('振り返り');

    // 進捗率の確認
    const progressText = checkCard.locator('[data-testid="compass-percentage"]');
    await expect(progressText).toContainText('50%');
  });

  // E2E-DASH-007: Action進捗カード表示
  test('E2E-DASH-007: Action進捗カード表示 - Actionフェーズの進捗が正しく表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // Actionカードの確認
    const actionCard = page.locator('[data-testid="compass-card-action"]');
    await expect(actionCard).toBeVisible();

    // ラベルの確認
    const actionLabel = actionCard.locator('[data-testid="compass-label"]');
    await expect(actionLabel).toContainText('Action');

    // サブラベルの確認
    const subLabel = actionCard.locator('[data-testid="compass-sublabel"]');
    await expect(subLabel).toContainText('改善');

    // 進捗率の確認
    const progressText = actionCard.locator('[data-testid="compass-percentage"]');
    await expect(progressText).toContainText('40%');
  });

  // E2E-DASH-008: 今日のタスク一覧表示
  test('E2E-DASH-008: 今日のタスク一覧表示 - 今日のタスクが一覧表示される', async ({
    page,
  }) => {
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');

    // 「今日のタスク」見出しの確認
    const taskSectionTitle = page.locator('[data-testid="today-tasks-title"]');
    await expect(taskSectionTitle).toContainText('今日のタスク');

    // タスク一覧の確認（3件）
    const taskItems = page.locator('[data-testid^="task-item-"]');
    await expect(taskItems).toHaveCount(3);

    // 最初のタスクにタイトル、目標名、予定時刻が表示されていることを確認
    const firstTask = page.locator('[data-testid="task-item-0"]');
    await expect(firstTask.locator('[data-testid="task-title"]')).toBeVisible();
    await expect(firstTask.locator('[data-testid="task-goal-badge"]')).toBeVisible();
    await expect(firstTask.locator('[data-testid="task-time-badge"]')).toBeVisible();
  });
});
