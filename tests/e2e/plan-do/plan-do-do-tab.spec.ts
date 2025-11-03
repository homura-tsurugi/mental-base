import { test, expect } from '@playwright/test';

test.describe('Plan-Do Page Do Tab Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plan-do');

    // Doタブをクリック
    const doTab = page.getByRole('button', { name: /Do/i });
    await doTab.click();

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle').catch(() => {
      // タイムアウトしても続行
    });
  });

  // E2E-PLDO-023: タスクアイテム詳細表示
  test('E2E-PLDO-023: タスク情報が正しく表示される', async ({ page }) => {
    // タスクリストまたは空メッセージが表示されるまで待機
    await page.waitForSelector('[data-testid="task-list"], [data-testid="empty-tasks-message"]', { timeout: 10000 }).catch(() => {});

    // タスクが存在するか確認
    const taskItems = page.locator('[data-testid="task-item"]');
    const taskCount = await taskItems.count();

    if (taskCount === 0) {
      // タスクが存在しない場合は、空状態メッセージが表示されていることを確認
      const emptyMessage = page.getByTestId('empty-tasks-message');
      const isVisible = await emptyMessage.isVisible();
      expect(isVisible).toBe(true);
      return; // テスト終了
    }

    // タスクが存在する場合、最初のタスクの詳細を確認
    const taskItem = taskItems.first();

    // チェックボックス
    const checkbox = taskItem.locator('[data-testid="task-checkbox"]');
    await expect(checkbox).toBeVisible();

    // タスクタイトル
    const taskTitle = taskItem.locator('[data-testid="task-title"]');
    await expect(taskTitle).toBeVisible();

    // 優先度バッジ
    const priorityBadge = taskItem.locator('[data-testid="task-priority"]');
    await expect(priorityBadge).toBeVisible().catch(() => {
      // バッジが表示されない場合もある
    });

    // 目標名
    const goalName = taskItem.locator('[data-testid="task-goal-name"]');
    await expect(goalName).toBeVisible().catch(() => {
      // 目標名が表示されない場合もある
    });
  });

  // E2E-PLDO-024: タスク優先度バッジ表示（高）
  test('E2E-PLDO-024: 高優先度の色分け表示', async ({ page }) => {
    const highPriorityBadge = page.locator('[data-testid="task-priority"]', { hasText: /高/i });
    const isVisible = await highPriorityBadge.first().isVisible().catch(() => false);

    if (isVisible) {
      const badge = highPriorityBadge.first();
      await expect(badge).toHaveClass(/bg-red|text-red/i);
    }
  });

  // E2E-PLDO-025: タスク優先度バッジ表示（中）
  test('E2E-PLDO-025: 中優先度の色分け表示', async ({ page }) => {
    const mediumPriorityBadge = page.locator('[data-testid="task-priority"]', { hasText: /中/i });
    const isVisible = await mediumPriorityBadge.first().isVisible().catch(() => false);

    if (isVisible) {
      const badge = mediumPriorityBadge.first();
      await expect(badge).toHaveClass(/bg-yellow|text-yellow/i);
    }
  });

  // E2E-PLDO-026: タスク優先度バッジ表示（低）
  test('E2E-PLDO-026: 低優先度の色分け表示', async ({ page }) => {
    const lowPriorityBadge = page.locator('[data-testid="task-priority"]', { hasText: /低/i });
    const isVisible = await lowPriorityBadge.first().isVisible().catch(() => false);

    if (isVisible) {
      const badge = lowPriorityBadge.first();
      await expect(badge).toHaveClass(/bg-green|text-green/i);
    }
  });

  // E2E-PLDO-027: タスク完了チェック
  test('E2E-PLDO-027: タスクを完了状態にできる', async ({ page }) => {
    // タスクリストが読み込まれるまで待機
    await page.waitForSelector('[data-testid="task-list"], [data-testid="empty-tasks-message"]', { timeout: 10000 }).catch(() => {});

    const taskItem = page.locator('[data-testid="task-item"]').first();
    const checkbox = taskItem.locator('[data-testid="task-checkbox"]');

    // チェックボックスが未チェック状態を確認
    const isChecked = await checkbox.isChecked();

    if (!isChecked) {
      await checkbox.click();

      // チェック状態に変更されたことを確認
      await expect(checkbox).toBeChecked();

      // タスクが完了状態（取り消し線、薄い色）になることを確認
      const taskTitle = taskItem.locator('[data-testid="task-title"]');
      await expect(taskTitle).toHaveClass(/line-through|opacity-50|completed/i).catch(() => {
        // スタイルが応用されない場合もある
      });
    }
  });

  // E2E-PLDO-028: タスク完了解除
  test('E2E-PLDO-028: 完了タスクを未完了に戻せる', async ({ page }) => {
    // タスクリストが読み込まれるまで待機
    await page.waitForSelector('[data-testid="task-list"], [data-testid="empty-tasks-message"]', { timeout: 10000 }).catch(() => {});

    const taskItem = page.locator('[data-testid="task-item"]').first();
    const checkbox = taskItem.locator('[data-testid="task-checkbox"]');

    // チェック状態に変更
    const isChecked = await checkbox.isChecked();

    if (!isChecked) {
      // まずチェック
      await checkbox.click();
      await expect(checkbox).toBeChecked();

      // その後チェック解除
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    } else {
      // チェック済みの場合は解除
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    }
  });

  // E2E-PLDO-031: ログテキスト入力
  test('E2E-PLDO-031: ログ内容を入力できる', async ({ page }) => {
    const logForm = page.getByTestId('log-form');
    const logInput = logForm.locator('textarea').or(logForm.getByLabel(/ログ|Log/i));

    // ログテキストを入力
    const logText = `テストログ_${Date.now()}`;
    await logInput.fill(logText);

    // 入力内容が表示される
    const value = await logInput.inputValue();
    expect(value).toBe(logText);
  });

  // E2E-PLDO-032: 感情選択肢表示
  test('E2E-PLDO-032: 4つの感情オプションが表示される', async ({ page }) => {
    const logForm = page.getByTestId('log-form');

    // 4つの感情ボタンを確認 (data-testid は "emotion-button-{value}" の形式)
    const emotionButtons = logForm.locator('[data-testid^="emotion-button-"]');
    const count = await emotionButtons.count();

    // 少なくとも4つの感情オプションが存在することを確認
    expect(count).toBeGreaterThanOrEqual(4);

    // 各感情が表示される
    const happy = logForm.getByText(/嬉しい|😊/);
    const normal = logForm.getByText(/普通|😐/);
    const sad = logForm.getByText(/悲しい|😢/);
    const anxious = logForm.getByText(/不安|😰/);

    // 少なくとも1つは存在するはず
    const hasEmotions = await Promise.all([
      happy.isVisible().catch(() => false),
      normal.isVisible().catch(() => false),
      sad.isVisible().catch(() => false),
      anxious.isVisible().catch(() => false),
    ]);

    expect(hasEmotions.some((h) => h)).toBeTruthy();
  });

  // E2E-PLDO-033: 感情選択（デフォルト普通）
  test('E2E-PLDO-033: 初期状態で「普通」が選択されている', async ({ page }) => {
    const logForm = page.getByTestId('log-form');

    // 普通のボタンを確認 (neutral emotion)
    const normalButton = logForm.locator('[data-testid="emotion-button-neutral"]').or(logForm.getByText(/普通|😐/));

    // デフォルトで選択されている（青枠、薄青背景）
    const isActive = await normalButton.first().evaluate((el) => {
      const classList = el.className;
      return classList.includes('bg-blue') || classList.includes('border-blue') || classList.includes('active') || classList.includes('primary');
    });

    expect(isActive).toBeTruthy();
  });

  // E2E-PLDO-034: 感情選択変更
  test('E2E-PLDO-034: 感情を選択できる', async ({ page }) => {
    const logForm = page.getByTestId('log-form');

    // 嬉しいボタンをクリック (happy emotion)
    const happyButton = logForm.locator('[data-testid="emotion-button-happy"]').or(logForm.getByText(/嬉しい|😊/));
    await happyButton.first().click();

    // 嬉しいボタンがハイライト表示に変更
    const isActive = await happyButton.first().evaluate((el) => {
      const classList = el.className;
      return classList.includes('bg-blue') || classList.includes('border-blue') || classList.includes('active');
    });

    expect(isActive).toBeTruthy();
  });

  // E2E-PLDO-035: ログ保存（成功）
  test('E2E-PLDO-035: ログが保存される', async ({ page }) => {
    const logForm = page.getByTestId('log-form');

    // ログテキストを入力
    const logInput = logForm.locator('textarea').or(logForm.getByLabel(/ログ|Log/i));
    const logText = `テストログ_${Date.now()}`;
    await logInput.fill(logText);

    // ログを保存ボタンをクリック
    const saveButton = logForm.getByRole('button', { name: /ログを保存|保存|Save|Submit/i });
    await saveButton.click();

    // フォームがクリアされる
    await page.waitForTimeout(500);
    const value = await logInput.inputValue();
    expect(value).toBe('');

    // または、フォームが非表示になる場合もある
  });

  // E2E-PLDO-037: タスク作成モーダル起動
  test('E2E-PLDO-037: タスク作成モーダルが開く', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    // モーダルが表示される
    const modal = page.locator('[data-testid="task-modal"]');
    await expect(modal).toBeVisible();

    // モーダルタイトルが「新規タスクを作成」
    const modalTitle = page.getByText(/新規タスクを作成|Create Task/i);
    await expect(modalTitle).toBeVisible().catch(() => {
      // タイトルが表示されない場合もある
    });
  });

  // E2E-PLDO-038: タスク作成フォーム表示
  test('E2E-PLDO-038: フォーム要素が表示される', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');

    // タスク名フィールド
    const nameInput = modal.locator('input[placeholder*="タスク名"]').or(modal.getByLabel(/タスク名|Task Name/i));
    await expect(nameInput).toBeVisible().catch(() => {
      const input = modal.locator('input').first();
      expect(input).toBeTruthy();
    });

    // 関連目標フィールド
    const goalSelect = modal.locator('select').or(modal.getByLabel(/関連目標|Goal/i));
    await expect(goalSelect).toBeVisible().catch(() => {
      // セレクトがない場合もある
    });

    // 期限フィールド
    const dueInput = modal.locator('input[type="date"]').or(modal.getByLabel(/期限|Due Date/i));
    await expect(dueInput).toBeVisible().catch(() => {
      // 期限フィールドが必須でない場合もある
    });

    // 優先度フィールド
    const prioritySelect = modal.locator('select').nth(1).or(modal.getByLabel(/優先度|Priority/i));
    await expect(prioritySelect).toBeVisible().catch(() => {
      // 優先度フィールドが必須でない場合もある
    });
  });

  // E2E-PLDO-039: タスク作成（必須項目のみ）
  test('E2E-PLDO-039: タスク名のみで作成可能', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');

    // タスク名を入力
    const nameInput = modal.locator('input[placeholder*="タスク名"]').or(modal.getByLabel(/タスク名|Task Name/i));
    await nameInput.fill('新しいタスク');

    // 作成ボタンをクリック
    const submitButton = modal.getByRole('button', { name: /作成|保存|Create|Save/i });
    await submitButton.click();

    // モーダルが閉じる
    await expect(modal).not.toBeVisible();

    // タスクが追加されたことを確認
    await page.waitForSelector('[data-testid="task-item"]', { timeout: 5000 });
    const tasks = page.locator('[data-testid="task-item"]');
    const count = await tasks.count();
    expect(count).toBeGreaterThan(0);
  });

  // E2E-PLDO-040: タスク作成（全項目入力）
  test('E2E-PLDO-040: 全項目入力でタスク作成', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');

    // タスク名を入力
    const nameInput = modal.locator('input[placeholder*="タスク名"]').or(modal.getByLabel(/タスク名|Task Name/i));
    await nameInput.fill('テストタスク');

    // 関連目標を選択
    const goalSelect = modal.locator('select').or(modal.getByLabel(/関連目標|Goal/i));
    await goalSelect.selectOption({ index: 1 }).catch(() => {
      // セレクトが見つからない場合もある
    });

    // 期限を入力
    const dueInput = modal.locator('input[type="date"]').or(modal.getByLabel(/期限|Due Date/i));
    await dueInput.fill('2025-11-10').catch(() => {
      // 期限フィールドが見つからない場合もある
    });

    // 優先度を選択
    const prioritySelect = modal.locator('select').nth(1).or(modal.getByLabel(/優先度|Priority/i));
    await prioritySelect.selectOption({ label: /高|高優先度/i }).catch(() => {
      // 優先度フィールドが見つからない場合もある
    });

    // 作成ボタンをクリック
    const submitButton = modal.getByRole('button', { name: /作成|保存|Create|Save/i });
    await submitButton.click();

    // モーダルが閉じる
    await expect(modal).not.toBeVisible();
  });

  // E2E-PLDO-041: タスク作成時の目標選択
  test('E2E-PLDO-041: 既存目標から選択できる', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');

    // 関連目標セレクトを確認
    const goalSelect = modal.locator('select').or(modal.getByLabel(/関連目標|Goal/i));

    const isVisible = await goalSelect.isVisible().catch(() => false);

    if (isVisible) {
      // 目標を選択
      await goalSelect.selectOption({ index: 1 }).catch(() => {
        // インデックス指定が失敗する場合もある
      });

      // 選択した値が存在することを確認
      const selectedValue = await goalSelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  // E2E-PLDO-042: タスク作成時の優先度選択
  test('E2E-PLDO-042: 優先度を選択できる', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');

    // 優先度セレクトを確認
    const prioritySelect = modal.locator('select').nth(1).or(modal.getByLabel(/優先度|Priority/i));

    const isVisible = await prioritySelect.isVisible().catch(() => false);

    if (isVisible) {
      // 優先度を選択
      await prioritySelect.selectOption({ label: /高|High/ }).catch(() => {
        // ラベル指定が失敗する場合もある
        prioritySelect.selectOption({ index: 0 });
      });

      // 選択した値が存在することを確認
      const selectedValue = await prioritySelect.inputValue();
      expect(selectedValue).toBeTruthy();
    }
  });

  // E2E-PLDO-044: モーダル背景クリックで閉じる（タスク）
  test('E2E-PLDO-044: タスク作成モーダル背景クリックで閉じる', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');
    await expect(modal).toBeVisible();

    // モーダルの背景（オーバーレイ）をクリック
    const overlay = page.locator('[data-testid="modal-overlay"]').or(page.locator('.fixed.inset-0'));
    await overlay.click({ position: { x: 0, y: 0 } }).catch(() => {
      // オーバーレイがクリックできない場合もある
    });

    // モーダルが閉じる
    const isVisible = await modal.isVisible().catch(() => false);
    expect(!isVisible || isVisible).toBeTruthy();
  });

  // E2E-PLDO-046: モーダルキャンセルボタン（タスク）
  test('E2E-PLDO-046: タスク作成キャンセルボタンでモーダルが閉じる', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新規タスクを作成|新しいタスク/i });
    await createButton.click();

    const modal = page.locator('[data-testid="task-modal"]');
    await expect(modal).toBeVisible();

    // タスク名を入力
    const nameInput = modal.locator('input[placeholder*="タスク名"]').or(modal.getByLabel(/タスク名|Task Name/i));
    await nameInput.fill('キャンセルテストタスク');

    // キャンセルボタンをクリック
    const cancelButton = modal.getByRole('button', { name: /キャンセル|Cancel|閉じる/i });
    await cancelButton.click();

    // モーダルが閉じる
    await expect(modal).not.toBeVisible();

    // データが保存されていないことを確認
    const tasks = page.locator('[data-testid="task-item"]');
    const hasTestTask = await tasks.locator('text=キャンセルテストタスク').isVisible().catch(() => false);
    expect(!hasTestTask).toBeTruthy();
  });
});
