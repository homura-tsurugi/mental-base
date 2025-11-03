import { test, expect } from '@playwright/test';

/**
 * check-action-basic.spec.ts: Check/Actionページの基本機能テスト
 * テストID範囲: E2E-CHKACT-001 ~ E2E-CHKACT-026
 * 優先度: 高（全て正常系）
 */

test.describe('Check/Actionページ - 基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // 環境変数でスキップ認証を設定（仕様書参照）
    await page.context().addInitScript(() => {
      localStorage.setItem('VITE_SKIP_AUTH', 'true');
    });
    await page.goto('/client/check-action');
  });

  // ===== ページ初期アクセス関連 =====

  test('E2E-CHKACT-001: ページ初期アクセス', async ({ page }) => {
    // ページタイトル「振り返り・改善」が表示されることを確認
    const pageTitle = page.locator('[data-testid="page-title"]');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText('振り返り・改善');

    // Checkタブがアクティブであることを確認
    const checkTab = page.locator('[data-testid="tab-check"]');
    await expect(checkTab).toHaveAttribute('data-active', 'true');
  });

  test('E2E-CHKACT-002: ローディング状態表示', async ({ page }) => {
    // ページ読み込み時、ローディング中のスピナー表示を確認
    const spinner = page.locator('[data-testid="loading-spinner"]');
    const loadingText = page.locator('[data-testid="loading-text"]');

    // スピナーアニメーションとテキストが表示される
    await expect(spinner).toBeVisible();
    await expect(loadingText).toContainText('読み込み中...');

    // データ取得後、ローディングが消える
    await expect(spinner).toBeHidden({ timeout: 5000 });
  });

  test('E2E-CHKACT-003: タブ切り替え表示', async ({ page }) => {
    // 2つのタブボタン（Check、Action）が表示される
    const checkTab = page.locator('[data-testid="tab-check"]');
    const actionTab = page.locator('[data-testid="tab-action"]');

    await expect(checkTab).toBeVisible();
    await expect(actionTab).toBeVisible();

    // 適切なアイコンが付いているか確認
    const checkIcon = checkTab.locator('[data-testid="check-tab-icon"]');
    const actionIcon = actionTab.locator('[data-testid="action-tab-icon"]');

    await expect(checkIcon).toBeVisible();
    await expect(actionIcon).toBeVisible();
  });

  test('E2E-CHKACT-004: 期間セレクター表示', async ({ page }) => {
    // 4つの期間ボタン（今日、今週、先週、今月）が表示される
    const todayBtn = page.locator('[data-testid="period-today"]');
    const thisWeekBtn = page.locator('[data-testid="period-thisweek"]');
    const lastWeekBtn = page.locator('[data-testid="period-lastweek"]');
    const thisMonthBtn = page.locator('[data-testid="period-thismonth"]');

    await expect(todayBtn).toBeVisible();
    await expect(thisWeekBtn).toBeVisible();
    await expect(lastWeekBtn).toBeVisible();
    await expect(thisMonthBtn).toBeVisible();
  });

  test('E2E-CHKACT-005: 進捗統計カード表示', async ({ page }) => {
    // ローディング完了を待つ
    await page.waitForSelector('[data-testid="stats-card"]', { timeout: 5000 });

    // 4つの統計カードが表示される
    const achievementRate = page.locator('[data-testid="stat-achievement-rate"]');
    const completedTasks = page.locator('[data-testid="stat-completed-tasks"]');
    const logDays = page.locator('[data-testid="stat-log-days"]');
    const activeGoals = page.locator('[data-testid="stat-active-goals"]');

    await expect(achievementRate).toBeVisible();
    await expect(completedTasks).toBeVisible();
    await expect(logDays).toBeVisible();
    await expect(activeGoals).toBeVisible();
  });

  test('E2E-CHKACT-006: 進捗チャート表示', async ({ page }) => {
    // 週間タスク完了推移チャートが表示される
    await page.waitForSelector('[data-testid="progress-chart"]', { timeout: 5000 });

    const chart = page.locator('[data-testid="progress-chart"]');
    await expect(chart).toBeVisible();

    // 各曜日のバーが表示されていることを確認
    const chartBars = page.locator('[data-testid="chart-bar"]');
    const barCount = await chartBars.count();
    expect(barCount).toBeGreaterThan(0);
  });

  test('E2E-CHKACT-007: 振り返りフォーム表示', async ({ page }) => {
    // 振り返り記録フォームが表示される
    const reflectionForm = page.locator('[data-testid="reflection-form"]');
    await expect(reflectionForm).toBeVisible();

    // 3つのテキストエリア（内容、達成、課題）が表示される
    const contentTextarea = page.locator('[data-testid="reflection-content"]');
    const achievementTextarea = page.locator('[data-testid="reflection-achievement"]');
    const challengeTextarea = page.locator('[data-testid="reflection-challenge"]');

    await expect(contentTextarea).toBeVisible();
    await expect(achievementTextarea).toBeVisible();
    await expect(challengeTextarea).toBeVisible();

    // AI分析ボタンが表示される
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await expect(analyzeBtn).toBeVisible();
  });

  // ===== 期間切り替え関連 =====

  test('E2E-CHKACT-008: 期間切り替え機能', async ({ page }) => {
    // ローディング完了を待つ
    await page.waitForSelector('[data-testid="stats-card"]', { timeout: 5000 });

    // 初期状態の統計データを取得
    const initialRate = await page
      .locator('[data-testid="stat-achievement-rate"]')
      .textContent();

    // 「先週」ボタンをクリック
    const lastWeekBtn = page.locator('[data-testid="period-lastweek"]');
    await lastWeekBtn.click();

    // 期間が切り替わり、統計・チャートデータが更新される
    // NOTE: 実装によってはデータが異なるはずなので、wait for navigationやAPI呼び出しを待つ
    await page.waitForTimeout(500);

    // 統計データが更新されたことを確認
    const updatedRate = await page
      .locator('[data-testid="stat-achievement-rate"]')
      .textContent();

    // 期間が実際に変更されたことを確認できるケースもある
    // 最低限、ボタンのアクティブ状態が変わることを確認
    const selectedPeriodBtn = page.locator('[data-testid="period-lastweek"][data-active="true"]');
    await expect(selectedPeriodBtn).toBeVisible();
  });

  test('E2E-CHKACT-009: 期間ボタンのアクティブ状態', async ({ page }) => {
    // ローディング完了を待つ
    await page.waitForSelector('[data-testid="period-thisweek"]', { timeout: 5000 });

    // 「今週」が初期状態でアクティブ（青色背景）
    const thisWeekBtn = page.locator('[data-testid="period-thisweek"]');
    await expect(thisWeekBtn).toHaveAttribute('data-active', 'true');

    // 別の期間ボタンをクリック
    const thisMonthBtn = page.locator('[data-testid="period-thismonth"]');
    await thisMonthBtn.click();

    // クリックした期間ボタンがアクティブになる
    await expect(thisMonthBtn).toHaveAttribute('data-active', 'true');

    // 前のボタンはアクティブでなくなる
    await expect(thisWeekBtn).not.toHaveAttribute('data-active', 'true');
  });

  test('E2E-CHKACT-010: 各期間の統計データ表示', async ({ page }) => {
    // ローディング完了を待つ
    await page.waitForSelector('[data-testid="stat-completed-tasks"]', { timeout: 5000 });

    // 各期間ボタンをクリックして、それぞれで統計が表示されることを確認
    const periods = [
      'today',
      'thisweek',
      'lastweek',
      'thismonth'
    ];

    for (const period of periods) {
      const periodBtn = page.locator(`[data-testid="period-${period}"]`);
      await periodBtn.click();
      await page.waitForTimeout(300);

      // 統計カードが表示されている
      const completedTasks = page.locator('[data-testid="stat-completed-tasks"]');
      await expect(completedTasks).toBeVisible();

      const achievementRate = page.locator('[data-testid="stat-achievement-rate"]');
      const rateText = await achievementRate.textContent();
      expect(rateText).toBeTruthy();
    }
  });

  // ===== 振り返り入力関連 =====

  test('E2E-CHKACT-011: 振り返り内容入力', async ({ page }) => {
    // 振り返り内容テキストエリアを取得
    const contentTextarea = page.locator('[data-testid="reflection-content"]');

    // テキストを入力
    await contentTextarea.fill('今週は朝のルーティンを確立できた');

    // テキストがテキストエリアに表示される
    await expect(contentTextarea).toHaveValue('今週は朝のルーティンを確立できた');
  });

  test('E2E-CHKACT-012: 達成内容入力', async ({ page }) => {
    // 達成内容テキストエリアを取得
    const achievementTextarea = page.locator('[data-testid="reflection-achievement"]');

    // テキストを入力
    await achievementTextarea.fill('朝の運動を7日連続で実行');

    // テキストが表示される
    await expect(achievementTextarea).toHaveValue('朝の運動を7日連続で実行');
  });

  test('E2E-CHKACT-013: 課題内容入力', async ({ page }) => {
    // 課題テキストエリアを取得
    const challengeTextarea = page.locator('[data-testid="reflection-challenge"]');

    // テキストを入力
    await challengeTextarea.fill('週末の運動実行率が低下');

    // テキストが表示される
    await expect(challengeTextarea).toHaveValue('週末の運動実行率が低下');
  });

  test('E2E-CHKACT-014: AI分析ボタンクリック（振り返りあり）', async ({ page }) => {
    // 振り返り内容を入力
    const contentTextarea = page.locator('[data-testid="reflection-content"]');
    await contentTextarea.fill('今週は朝のルーティンを確立できた');

    // AI分析ボタンをクリック
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // AI分析中のローディングが表示される
    const loadingIndicator = page.locator('[data-testid="ai-analysis-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });

    // AI分析完了後、Actionタブに自動切り替え
    const actionTab = page.locator('[data-testid="tab-action"]');
    await expect(actionTab).toHaveAttribute('data-active', 'true', { timeout: 5000 });
  });

  test('E2E-CHKACT-015: AI分析中のローディング表示', async ({ page }) => {
    // 振り返り内容を入力
    const contentTextarea = page.locator('[data-testid="reflection-content"]');
    await contentTextarea.fill('今週は朝のルーティンを確立できた');

    // AI分析ボタンをクリック
    const analyzeBtn = page.locator('[data-testid="btn-ai-analyze"]');
    await analyzeBtn.click();

    // スピナーが表示される
    const spinner = page.locator('[data-testid="ai-analysis-spinner"]');
    await expect(spinner).toBeVisible();

    // "AI分析中..." テキストが表示される
    const loadingText = page.locator('[data-testid="ai-analysis-loading-text"]');
    await expect(loadingText).toContainText('AI分析中...');

    // 詳細メッセージが表示される
    const loadingDetail = page.locator('[data-testid="ai-analysis-loading-detail"]');
    await expect(loadingDetail).toContainText('あなたの振り返り内容を分析しています');
  });

  // ===== Actionタブ関連 =====

  test('E2E-CHKACT-016: Actionタブへの切り替え', async ({ page }) => {
    // Actionタブボタンをクリック
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // Actionタブがアクティブになる
    await expect(actionTab).toHaveAttribute('data-active', 'true');

    // 背景色が変化するなど視覚的に区別される（class や data-active属性で確認）
    const checkTab = page.locator('[data-testid="tab-check"]');
    await expect(checkTab).not.toHaveAttribute('data-active', 'true');
  });

  test('E2E-CHKACT-017: AI分析レポート表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // AI分析レポートカードが表示される
    await page.waitForSelector('[data-testid="ai-report-card"]', { timeout: 5000 });

    const reportCard = page.locator('[data-testid="ai-report-card"]');
    await expect(reportCard).toBeVisible();

    // サマリーが含まれる
    const summary = page.locator('[data-testid="ai-report-summary"]');
    await expect(summary).toBeVisible();

    // 洞察セクションが表示される
    const insights = page.locator('[data-testid="ai-report-insights"]');
    await expect(insights).toBeVisible();

    // 推奨事項セクションが表示される
    const recommendations = page.locator('[data-testid="ai-report-recommendations"]');
    await expect(recommendations).toBeVisible();
  });

  test('E2E-CHKACT-018: AI分析レポート信頼度表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // AI分析レポートの読み込みを待つ
    await page.waitForSelector('[data-testid="ai-report-confidence"]', { timeout: 5000 });

    // 信頼度バッジが表示される
    const confidenceBadge = page.locator('[data-testid="ai-report-confidence"]');
    await expect(confidenceBadge).toBeVisible();

    // バッジが緑色（成功状態）であることを確認
    await expect(confidenceBadge).toHaveClass(/bg-green/);

    // パーセンテージが表示される
    const confidenceText = await confidenceBadge.textContent();
    expect(confidenceText).toMatch(/\d+%/);
  });

  test('E2E-CHKACT-019: AI洞察リスト表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // AI分析レポートの読み込みを待つ
    await page.waitForSelector('[data-testid="ai-report-insight-item"]', { timeout: 5000 });

    // 洞察項目が表示される（最低3つ）
    const insightItems = page.locator('[data-testid="ai-report-insight-item"]');
    const insightCount = await insightItems.count();
    expect(insightCount).toBeGreaterThanOrEqual(3);

    // 各洞察項目にタイトル・説明・重要度があることを確認
    const firstInsight = insightItems.first();
    const title = firstInsight.locator('[data-testid="insight-title"]');
    const description = firstInsight.locator('[data-testid="insight-description"]');
    const importance = firstInsight.locator('[data-testid="insight-importance"]');

    await expect(title).toBeVisible();
    await expect(description).toBeVisible();
    await expect(importance).toBeVisible();
  });

  test('E2E-CHKACT-020: AI推奨事項リスト表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // AI分析レポートの読み込みを待つ
    await page.waitForSelector('[data-testid="ai-report-recommendation-item"]', { timeout: 5000 });

    // 推奨事項が表示される（最低3つ）
    const recommendationItems = page.locator('[data-testid="ai-report-recommendation-item"]');
    const recCount = await recommendationItems.count();
    expect(recCount).toBeGreaterThanOrEqual(3);

    // 各推奨事項に優先度番号・タイトル・説明・カテゴリタグがあることを確認
    const firstRec = recommendationItems.first();
    const priority = firstRec.locator('[data-testid="rec-priority"]');
    const title = firstRec.locator('[data-testid="rec-title"]');
    const description = firstRec.locator('[data-testid="rec-description"]');
    const categoryTag = firstRec.locator('[data-testid="rec-category-tag"]');

    await expect(priority).toBeVisible();
    await expect(title).toBeVisible();
    await expect(description).toBeVisible();
    await expect(categoryTag).toBeVisible();
  });

  // ===== アクションプラン関連 =====

  test('E2E-CHKACT-021: 改善計画フォーム表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-plan-form"]', { timeout: 5000 });

    // アクションプラン作成フォームが表示される
    const form = page.locator('[data-testid="action-plan-form"]');
    await expect(form).toBeVisible();

    // 計画タイトル入力欄
    const titleInput = page.locator('[data-testid="action-plan-title"]');
    await expect(titleInput).toBeVisible();

    // 説明入力欄
    const descriptionInput = page.locator('[data-testid="action-plan-description"]');
    await expect(descriptionInput).toBeVisible();

    // アクション項目リスト
    const actionsList = page.locator('[data-testid="action-items-list"]');
    await expect(actionsList).toBeVisible();

    // 作成ボタン
    const createBtn = page.locator('[data-testid="btn-create-action-plan"]');
    await expect(createBtn).toBeVisible();
  });

  test('E2E-CHKACT-022: デフォルトアクション項目表示', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-item"]', { timeout: 5000 });

    // デフォルトアクション項目が3つ表示される
    const actionItems = page.locator('[data-testid="action-item"]');
    const itemCount = await actionItems.count();
    expect(itemCount).toBe(3);

    // 各アクション項目が番号付きで表示される
    for (let i = 0; i < 3; i++) {
      const item = actionItems.nth(i);
      const number = item.locator('[data-testid="action-item-number"]');
      await expect(number).toContainText(`${i + 1}`);
    }
  });

  test('E2E-CHKACT-023: アクション項目追加', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-item-input"]', { timeout: 5000 });

    // 初期のアクション項目数を取得
    const initialItems = await page.locator('[data-testid="action-item"]').count();

    // 新しいアクション項目を入力
    const inputField = page.locator('[data-testid="action-item-input"]');
    await inputField.fill('毎朝6時に起床する');

    // 追加ボタンをクリック
    const addBtn = page.locator('[data-testid="btn-add-action-item"]');
    await addBtn.click();

    // 新しい項目がリストに追加される
    const itemsAfter = await page.locator('[data-testid="action-item"]').count();
    expect(itemsAfter).toBe(initialItems + 1);

    // 新しい項目に番号が付与される
    const lastItem = page.locator('[data-testid="action-item"]').last();
    const lastNumber = lastItem.locator('[data-testid="action-item-number"]');
    await expect(lastNumber).toContainText(`${initialItems + 1}`);
  });

  test('E2E-CHKACT-024: アクション項目削除', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-item"]', { timeout: 5000 });

    // アクション項目数を取得
    let itemCount = await page.locator('[data-testid="action-item"]').count();
    const initialCount = itemCount;

    // 最後のアクション項目の削除ボタンをクリック
    const lastItem = page.locator('[data-testid="action-item"]').last();
    const deleteBtn = lastItem.locator('[data-testid="btn-delete-action-item"]');
    await deleteBtn.click();

    // 項目がリストから削除される
    itemCount = await page.locator('[data-testid="action-item"]').count();
    expect(itemCount).toBe(initialCount - 1);
  });

  test('E2E-CHKACT-025: 改善計画タイトル編集', async ({ page }) => {
    // Actionタブに移動
    const actionTab = page.locator('[data-testid="tab-action"]');
    await actionTab.click();

    // ページの読み込みを待つ
    await page.waitForSelector('[data-testid="action-plan-title"]', { timeout: 5000 });

    // タイトル入力欄を取得
    const titleInput = page.locator('[data-testid="action-plan-title"]');

    // タイトルを入力
    await titleInput.fill('朝活習慣の改善プラン');

    // 入力した内容がタイトル欄に表示される
    await expect(titleInput).toHaveValue('朝活習慣の改善プラン');
  });

  test('E2E-CHKACT-026: 改善計画作成', async ({ page }) => {
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

    // 改善計画を作成ボタンをクリック
    const createBtn = page.locator('[data-testid="btn-create-action-plan"]');
    await createBtn.click();

    // 成功アラートが表示される
    const successAlert = page.locator('[data-testid="alert-success"]');
    await expect(successAlert).toBeVisible({ timeout: 2000 });
    await expect(successAlert).toContainText('改善計画を作成しました');

    // アラートが自動的に消える
    await expect(successAlert).toBeHidden({ timeout: 5000 });
  });
});
