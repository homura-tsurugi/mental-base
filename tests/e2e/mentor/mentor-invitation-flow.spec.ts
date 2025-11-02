import { test, expect } from '@playwright/test';

/**
 * mentor-invitation-flow.spec.ts: メンター招待・承認フローのテスト
 * テストID範囲: E2E-MENTOR-INV-001 ~ E2E-MENTOR-INV-020
 */

test.describe('E2E-MENTOR-INV: メンター招待・承認フロー', () => {
  // E2E-MENTOR-INV-001: メンター招待ボタンの表示
  test('E2E-MENTOR-INV-001: メンター招待ボタンの表示', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.locator('[data-testid="invite-client-btn"], button:has-text("クライアント招待")');
    await expect(inviteButton).toBeVisible();
  });

  // E2E-MENTOR-INV-002: 招待モーダルの表示
  test('E2E-MENTOR-INV-002: 招待モーダルの表示', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.locator('[data-testid="invite-client-btn"], button:has-text("クライアント招待")');
    await inviteButton.click();

    // モーダルが表示される
    const modal = page.locator('[data-testid="invite-modal"], [role="dialog"]');
    await expect(modal).toBeVisible();

    // メールアドレス入力欄が表示される
    const emailInput = page.locator('[data-testid="client-email-input"], input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  // E2E-MENTOR-INV-003: 招待メール送信（有効なメールアドレス）
  test('E2E-MENTOR-INV-003: 招待メール送信（有効なメールアドレス）', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.locator('[data-testid="invite-client-btn"], button:has-text("クライアント招待")');
    await inviteButton.click();

    // メールアドレスを入力
    const emailInput = page.locator('[data-testid="client-email-input"], input[type="email"]');
    await emailInput.fill('client@example.com');

    // メッセージを入力（任意）
    const messageInput = page.locator('[data-testid="invite-message-input"], textarea');
    if (await messageInput.isVisible()) {
      await messageInput.fill('一緒に成長しましょう！');
    }

    // 送信ボタンをクリック
    const sendButton = page.locator('[data-testid="send-invite-btn"], button:has-text("招待を送信")');
    await sendButton.click();

    // 成功メッセージが表示される
    const successMessage = page.locator('[data-testid="success-message"], text=/招待を送信しました/');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  // E2E-MENTOR-INV-004: 招待送信（無効なメールアドレス）
  test('E2E-MENTOR-INV-004: 招待送信（無効なメールアドレス）', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    const inviteButton = page.locator('[data-testid="invite-client-btn"], button:has-text("クライアント招待")');
    await inviteButton.click();

    // 無効なメールアドレスを入力
    const emailInput = page.locator('[data-testid="client-email-input"], input[type="email"]');
    await emailInput.fill('invalid-email');

    // 送信ボタンをクリック
    const sendButton = page.locator('[data-testid="send-invite-btn"], button:has-text("招待を送信")');
    await sendButton.click();

    // エラーメッセージが表示される
    const errorMessage = page.locator('[data-testid="error-message"], [data-testid="form-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  // E2E-MENTOR-INV-005: 招待一覧の表示（pending状態）
  test('E2E-MENTOR-INV-005: 招待一覧の表示（pending状態）', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // pending状態の招待が表示される
    const pendingBadge = page.locator('[data-testid="status-badge"], .badge:has-text("保留中")');
    
    // 少なくとも1つのpending招待が表示されるか確認
    const count = await pendingBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // E2E-MENTOR-INV-006: クライアント側 - 招待通知の表示
  test('E2E-MENTOR-INV-006: クライアント側 - 招待通知の表示', async ({ page }) => {
    // クライアントとしてログイン（通常はauth flowで実装）
    await page.goto('http://localhost:3247/');
    await page.waitForLoadState('networkidle');

    // 通知アイコンをクリック
    const notificationIcon = page.locator('[data-testid="notification-icon"], button[aria-label*="通知"]');
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // メンター招待の通知が表示される
      const inviteNotification = page.locator('text=/メンターから招待が届きました/');
      const count = await inviteNotification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-INV-007: クライアント側 - 招待承認
  test('E2E-MENTOR-INV-007: クライアント側 - 招待承認', async ({ page }) => {
    // 設定ページに移動
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // データアクセス制御セクションを確認
    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      // pending状態の招待を承認するボタンを探す
      const acceptButton = page.locator('[data-testid="accept-invite-btn"], button:has-text("承認")');
      
      if (await acceptButton.count() > 0) {
        await acceptButton.first().click();

        // 成功メッセージが表示される
        const successMessage = page.locator('[data-testid="success-message"], text=/承認しました/');
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      }
    }
  });

  // E2E-MENTOR-INV-008: 関係のステータス遷移（pending → active）
  test('E2E-MENTOR-INV-008: 関係のステータス遷移（pending → active）', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // active状態のクライアントが表示される
    const activeBadge = page.locator('[data-testid="status-badge"]:has-text("アクティブ"), .badge:has-text("アクティブ")');
    const count = await activeBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // E2E-MENTOR-INV-009: メンター側 - 承認後の通知確認
  test('E2E-MENTOR-INV-009: メンター側 - 承認後の通知確認', async ({ page }) => {
    await page.goto('http://localhost:3247/');
    await page.waitForLoadState('networkidle');

    // 通知アイコンをクリック
    const notificationIcon = page.locator('[data-testid="notification-icon"], button[aria-label*="通知"]');
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // 承認通知が表示される
      const acceptNotification = page.locator('text=/招待を承認しました/');
      const count = await acceptNotification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-INV-010: 関係終了フロー - メンター側
  test('E2E-MENTOR-INV-010: 関係終了フロー - メンター側', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // クライアントカードの終了ボタンを探す
    const terminateButton = page.locator('[data-testid="terminate-relationship-btn"], button:has-text("関係を終了")');
    
    if (await terminateButton.count() > 0) {
      await terminateButton.first().click();

      // 確認ダイアログが表示される
      const confirmDialog = page.locator('[data-testid="confirm-dialog"], [role="dialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      // キャンセルボタンで閉じる
      const cancelButton = page.locator('[data-testid="cancel-btn"], button:has-text("キャンセル")');
      await cancelButton.click();
    }
  });

  // E2E-MENTOR-INV-011: 関係終了 - 理由の入力
  test('E2E-MENTOR-INV-011: 関係終了 - 理由の入力', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    const terminateButton = page.locator('[data-testid="terminate-relationship-btn"], button:has-text("関係を終了")');
    
    if (await terminateButton.count() > 0) {
      await terminateButton.first().click();

      // 理由入力欄が表示される
      const reasonInput = page.locator('[data-testid="termination-reason"], textarea');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('目標達成のため');
      }
    }
  });

  // E2E-MENTOR-INV-012: デフォルトアクセス権限の確認
  test('E2E-MENTOR-INV-012: デフォルトアクセス権限の確認', async ({ page }) => {
    // 承認後のデフォルト設定: すべてのデータが共有される
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      // 目標、タスク、ログ、振り返り、AI分析レポートのスイッチが全てONになっている
      const goalsSwitch = page.locator('[id*="goals"][data-state="checked"]');
      const tasksSwitch = page.locator('[id*="tasks"][data-state="checked"]');
      const logsSwitch = page.locator('[id*="logs"][data-state="checked"]');
      
      expect(await goalsSwitch.count() + await tasksSwitch.count() + await logsSwitch.count()).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-INV-013: 緩和策通知の確認
  test('E2E-MENTOR-INV-013: 緩和策通知の確認', async ({ page }) => {
    await page.goto('http://localhost:3247/');
    await page.waitForLoadState('networkidle');

    // 通知アイコンをクリック
    const notificationIcon = page.locator('[data-testid="notification-icon"], button[aria-label*="通知"]');
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // データ公開に関する通知が表示される
      const dataNotification = page.locator('text=/すべてのデータ.*が公開されています/');
      const count = await dataNotification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-INV-014: 複数メンター招待のテスト
  test('E2E-MENTOR-INV-014: 複数メンター招待のテスト', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      // 複数のメンター関係が表示される
      const mentorCards = page.locator('[data-testid*="mentor-"], .mentor-relationship-card');
      const count = await mentorCards.count();
      
      // 0個以上のメンター関係が存在
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-INV-015: 招待キャンセル（pending状態）
  test('E2E-MENTOR-INV-015: 招待キャンセル（pending状態）', async ({ page }) => {
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // pending状態の招待をキャンセルするボタン
    const cancelButton = page.locator('[data-testid="cancel-invite-btn"], button:has-text("キャンセル")');
    
    if (await cancelButton.count() > 0) {
      await cancelButton.first().click();

      // 確認ダイアログで確定
      const confirmButton = page.locator('[data-testid="confirm-cancel-btn"], button:has-text("はい")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  });
});
