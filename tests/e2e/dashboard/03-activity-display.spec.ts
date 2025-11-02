/**
 * ダッシュボード E2E テスト - アクティビティ表示
 * テストID: E2E-DASH-015 ～ E2E-DASH-018
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Activity Display', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページにアクセス
    await page.goto('/');
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');
  });

  // E2E-DASH-015: 最近のアクティビティ表示
  test('E2E-DASH-015: 最近のアクティビティ表示 - 最近のアクティビティが表示される', async ({
    page,
  }) => {
    // 「最近のアクティビティ」見出しの確認
    const activitySectionTitle = page.locator('[data-testid="recent-activities-title"]');
    await expect(activitySectionTitle).toContainText('最近のアクティビティ');

    // アクティビティ一覧の確認（4件）
    const activityItems = page.locator('[data-testid^="activity-item-"]');
    await expect(activityItems).toHaveCount(4);

    // 各アクティビティにアイコン、説明、タイムスタンプが表示されていることを確認
    const firstActivity = page.locator('[data-testid="activity-item-0"]');
    await expect(firstActivity.locator('[data-testid="activity-icon"]')).toBeVisible();
    await expect(firstActivity.locator('[data-testid="activity-description"]')).toBeVisible();
    await expect(firstActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible();
  });

  // E2E-DASH-016: アクティビティアイコン表示
  test('E2E-DASH-016: アクティビティアイコン表示 - アクティビティタイプに応じたアイコンが表示される', async ({
    page,
  }) => {
    // アクティビティ一覧を取得
    const activityItems = page.locator('[data-testid^="activity-item-"]');

    // 最初のアクティビティ（タスク完了）
    const firstActivity = activityItems.nth(0);
    const firstIcon = firstActivity.locator('[data-testid="activity-icon"]');
    const firstIconClass = await firstIcon.getAttribute('data-activity-type');
    expect(firstIconClass).toBe('task_completed');

    // アイコンに緑背景が適用されていることを確認 (light green pastel)
    const firstIconBgColor = await firstIcon.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(firstIconBgColor).toMatch(/rgb\(220, 252, 231\)|#dcfce7/i);

    // 2番目のアクティビティ（ログ記録）
    const secondActivity = activityItems.nth(1);
    const secondIcon = secondActivity.locator('[data-testid="activity-icon"]');
    const secondIconClass = await secondIcon.getAttribute('data-activity-type');
    expect(secondIconClass).toBe('log_recorded');

    // アイコンに黄背景が適用されていることを確認 (light yellow pastel)
    const secondIconBgColor = await secondIcon.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(secondIconBgColor).toMatch(/rgb\(254, 243, 199\)|#fef3c7/i);

    // 3番目のアクティビティ（タスク作成）
    const thirdActivity = activityItems.nth(2);
    const thirdIcon = thirdActivity.locator('[data-testid="activity-icon"]');
    const thirdIconClass = await thirdIcon.getAttribute('data-activity-type');
    expect(thirdIconClass).toBe('task_created');

    // アイコンに青背景が適用されていることを確認 (light blue pastel)
    const thirdIconBgColor = await thirdIcon.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(thirdIconBgColor).toMatch(/rgb\(219, 234, 254\)|#dbeafe/i);

    // 4番目のアクティビティ（改善提案）
    const fourthActivity = activityItems.nth(3);
    const fourthIcon = fourthActivity.locator('[data-testid="activity-icon"]');
    const fourthIconClass = await fourthIcon.getAttribute('data-activity-type');
    expect(fourthIconClass).toBe('improvement_suggested');

    // アイコンに紫背景が適用されていることを確認 (light purple pastel)
    const fourthIconBgColor = await fourthIcon.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(fourthIconBgColor).toMatch(/rgb\(237, 233, 254\)|#ede9fe/i);
  });

  // E2E-DASH-017: アクティビティ説明HTML表示
  test('E2E-DASH-017: アクティビティ説明HTML表示 - アクティビティ説明にHTMLが適用される', async ({
    page,
  }) => {
    // 最初のアクティビティを取得
    const firstActivity = page.locator('[data-testid="activity-item-0"]');

    // 説明文を取得
    const description = firstActivity.locator('[data-testid="activity-description"]');

    // 「タスク完了:」などのテキストが太字で表示されていることを確認
    const strongElements = description.locator('strong');
    const count = await strongElements.count();
    expect(count).toBeGreaterThan(0);

    // 最初の strong 要素のテキストを確認
    const firstStrongText = await strongElements.nth(0).textContent();
    expect(firstStrongText).toMatch(/タスク完了:|ログ記録:|タスク作成:|改善提案:/);

    // dangerouslySetInnerHTMLが正しく動作していることを確認
    const descriptionHTML = await description.innerHTML();
    expect(descriptionHTML).toContain('<strong>');
  });

  // E2E-DASH-018: アクティビティタイムスタンプ表示
  test('E2E-DASH-018: アクティビティタイムスタンプ表示 - タイムスタンプが相対時間で表示される', async ({
    page,
  }) => {
    // アクティビティ一覧を取得
    const activityItems = page.locator('[data-testid^="activity-item-"]');

    // 各アクティビティのタイムスタンプを確認
    for (let i = 0; i < (await activityItems.count()); i++) {
      const activity = activityItems.nth(i);
      const timestamp = activity.locator('[data-testid="activity-timestamp"]');

      // タイムスタンプが表示されていることを確認
      const timestampText = await timestamp.textContent();
      expect(timestampText).toBeTruthy();

      // 相対時間形式（「○分前」「○時間前」「昨日」など）であることを確認
      const relativeTimePatterns = [
        /\d+分前/,    // "10分前"
        /\d+時間前/,  // "1時間前"
        /\d+日前/,    // "3日前"
        /昨日/,       // "昨日"
        /先週/,       // "先週"
        /先月/,       // "先月"
      ];

      const isRelativeTime = relativeTimePatterns.some((pattern) =>
        pattern.test(timestampText || '')
      );
      expect(isRelativeTime).toBe(true);
    }
  });
});
