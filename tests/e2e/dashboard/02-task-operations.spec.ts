/**
 * ダッシュボード E2E テスト - タスク操作・ボタンクリック
 * テストID: E2E-DASH-009 ～ E2E-DASH-014
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Task Operations', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページにアクセス
    await page.goto('/');
    // ページロード完了を待機
    await page.waitForLoadState('networkidle');
  });

  // E2E-DASH-009: タスク詳細情報表示
  test('E2E-DASH-009: タスク詳細情報表示 - タスクの詳細情報が表示される', async ({
    page,
  }) => {
    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');
    await expect(firstTask).toBeVisible();

    // タスクタイトルの確認
    const taskTitle = firstTask.locator('[data-testid="task-title"]');
    await expect(taskTitle).toContainText('朝のストレッチを10分間行う');

    // 目標名バッジの確認
    const goalBadge = firstTask.locator('[data-testid="task-goal-badge"]');
    await expect(goalBadge).toContainText('健康管理');

    // 予定時刻バッジの確認
    const timeBadge = firstTask.locator('[data-testid="task-time-badge"]');
    await expect(timeBadge).toContainText('09:00');

    // チェックボックスの確認
    const checkbox = firstTask.locator('[data-testid="task-checkbox"]');
    await expect(checkbox).toBeVisible();

    // 実行ボタンの確認
    const playButton = firstTask.locator('[data-testid="task-play-button"]');
    await expect(playButton).toBeVisible();

    // 編集ボタンの確認
    const editButton = firstTask.locator('[data-testid="task-edit-button"]');
    await expect(editButton).toBeVisible();
  });

  // E2E-DASH-010: タスクチェックボックス操作
  test('E2E-DASH-010: タスクチェックボックス操作 - タスクを完了状態にできる', async ({
    page,
  }) => {
    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');

    // チェックボックスをクリック
    const checkbox = firstTask.locator('[data-testid="task-checkbox"]');
    await checkbox.click();

    // ページがリフレッシュされるまで待機
    await page.waitForLoadState('networkidle');

    // チェックボックスがチェック状態になっていることを確認
    await expect(checkbox).toBeChecked();

    // タスクタイトルに取り消し線が適用されていることを確認
    const taskTitle = firstTask.locator('[data-testid="task-title"]');
    const titleElement = await taskTitle.evaluate((el) => {
      return window.getComputedStyle(el).textDecoration;
    });
    expect(titleElement).toContain('line-through');

    // タスク全体の透明度が60%になっていることを確認
    const taskOpacity = await firstTask.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(taskOpacity)).toBeLessThanOrEqual(0.6);
  });

  // E2E-DASH-011: タスク完了解除
  test('E2E-DASH-011: タスク完了解除 - 完了したタスクを未完了に戻せる', async ({
    page,
  }) => {
    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');
    const checkbox = firstTask.locator('[data-testid="task-checkbox"]');

    // チェックボックスをクリックして完了状態にする
    await checkbox.click();
    await page.waitForLoadState('networkidle');

    // チェックボックスが完了状態であることを確認
    await expect(checkbox).toBeChecked();

    // チェックボックスを再度クリックして未完了に戻す
    await checkbox.click();
    await page.waitForLoadState('networkidle');

    // チェックボックスが未チェック状態になっていることを確認
    await expect(checkbox).not.toBeChecked();

    // タスクタイトルの取り消し線が解除されていることを確認
    const taskTitle = firstTask.locator('[data-testid="task-title"]');
    const titleElement = await taskTitle.evaluate((el) => {
      return window.getComputedStyle(el).textDecoration;
    });
    expect(titleElement).not.toContain('line-through');

    // タスク全体の透明度が100%に戻っていることを確認
    const taskOpacity = await firstTask.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(taskOpacity)).toBe(1);
  });

  // E2E-DASH-012: タスクの優先度表示
  test('E2E-DASH-012: タスクの優先度表示 - タスクの優先度が視覚的に識別できる', async ({
    page,
  }) => {
    // タスク一覧を取得
    const taskItems = page.locator('[data-testid^="task-item-"]');
    await expect(taskItems).toHaveCount(3);

    // 最初のタスク（高優先度）
    const firstTask = taskItems.nth(0);
    const firstPriority = await firstTask.getAttribute('data-priority');
    expect(firstPriority).toBe('high');

    // 2番目のタスク（高優先度）
    const secondTask = taskItems.nth(1);
    const secondPriority = await secondTask.getAttribute('data-priority');
    expect(secondPriority).toBe('high');

    // 3番目のタスク（中優先度）
    const thirdTask = taskItems.nth(2);
    const thirdPriority = await thirdTask.getAttribute('data-priority');
    expect(thirdPriority).toBe('medium');

    // 優先度の視覚的識別（色やアイコンなど）
    const highPriorityIndicator = firstTask.locator(
      '[data-testid="task-priority-indicator"]'
    );
    await expect(highPriorityIndicator).toHaveAttribute('data-priority', 'high');
  });

  // E2E-DASH-013: タスク実行ボタンクリック
  test('E2E-DASH-013: タスク実行ボタンクリック - タスク実行ボタンがクリック可能', async ({
    page,
  }) => {
    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');

    // 実行ボタンを取得
    const playButton = firstTask.locator('[data-testid="task-play-button"]');
    await expect(playButton).toBeVisible();

    // ボタンがクリック可能であることを確認
    await expect(playButton).toBeEnabled();

    // イベント伝播が止まっていることを確認（clickイベント後にタスク全体がクリックされない）
    let eventPropagated = false;
    await page.evaluate(() => {
      const task = document.querySelector('[data-testid="task-item-0"]');
      task?.addEventListener(
        'click',
        () => {
          window.taskClickEvent = true;
        },
        { capture: true }
      );
    });

    // ボタンをクリック
    await playButton.click();

    // イベント伝播が止まっていることを確認
    const propagated = await page.evaluate(() => {
      return (window as any).taskClickEvent || false;
    });
    expect(propagated).toBe(false);
  });

  // E2E-DASH-014: タスク編集ボタンクリック
  test('E2E-DASH-014: タスク編集ボタンクリック - タスク編集ボタンがクリック可能', async ({
    page,
  }) => {
    // 最初のタスクを取得
    const firstTask = page.locator('[data-testid="task-item-0"]');

    // 編集ボタンを取得
    const editButton = firstTask.locator('[data-testid="task-edit-button"]');
    await expect(editButton).toBeVisible();

    // ボタンがクリック可能であることを確認
    await expect(editButton).toBeEnabled();

    // イベント伝播が止まっていることを確認
    let eventPropagated = false;
    await page.evaluate(() => {
      const task = document.querySelector('[data-testid="task-item-0"]');
      task?.addEventListener(
        'click',
        () => {
          window.taskClickEvent = true;
        },
        { capture: true }
      );
    });

    // ボタンをクリック
    await editButton.click();

    // イベント伝播が止まっていることを確認
    const propagated = await page.evaluate(() => {
      return (window as any).taskClickEvent || false;
    });
    expect(propagated).toBe(false);
  });
});
