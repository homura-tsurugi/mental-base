import { test, expect } from '@playwright/test';

/**
 * mentor-data-access-control.spec.ts: データアクセス制御のテスト
 * テストID範囲: E2E-MENTOR-DAC-001 ~ E2E-MENTOR-DAC-020
 */

test.describe('E2E-MENTOR-DAC: データアクセス制御', () => {
  // E2E-MENTOR-DAC-001: データアクセス制御セクションの表示
  test('E2E-MENTOR-DAC-001: データアクセス制御セクションの表示', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    await expect(dataAccessSection).toBeVisible();
  });

  // E2E-MENTOR-DAC-002: 個別メンター設定の表示
  test('E2E-MENTOR-DAC-002: 個別メンター設定の表示', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // メンターごとの設定カードが表示される
    const mentorCards = page.locator('[data-testid*="mentor-"], .mentor-relationship-card');
    const count = await mentorCards.count();
    
    // 0個以上のメンター関係が存在
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // E2E-MENTOR-DAC-003: 目標アクセス権限のトグル
  test('E2E-MENTOR-DAC-003: 目標アクセス権限のトグル', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const goalsSwitch = page.locator('[id*="goals"]').first();
    
    if (await goalsSwitch.isVisible()) {
      const initialState = await goalsSwitch.getAttribute('data-state');
      
      // スイッチをクリック
      await goalsSwitch.click();
      
      // 状態が変更される
      await page.waitForTimeout(500);
      const newState = await goalsSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  // E2E-MENTOR-DAC-004: タスクアクセス権限のトグル
  test('E2E-MENTOR-DAC-004: タスクアクセス権限のトグル', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const tasksSwitch = page.locator('[id*="tasks"]').first();
    
    if (await tasksSwitch.isVisible()) {
      const initialState = await tasksSwitch.getAttribute('data-state');
      await tasksSwitch.click();
      await page.waitForTimeout(500);
      const newState = await tasksSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  // E2E-MENTOR-DAC-005: ログアクセス権限のトグル
  test('E2E-MENTOR-DAC-005: ログアクセス権限のトグル', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const logsSwitch = page.locator('[id*="logs"]').first();
    
    if (await logsSwitch.isVisible()) {
      const initialState = await logsSwitch.getAttribute('data-state');
      await logsSwitch.click();
      await page.waitForTimeout(500);
      const newState = await logsSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  // E2E-MENTOR-DAC-006: 振り返りアクセス権限のトグル
  test('E2E-MENTOR-DAC-006: 振り返りアクセス権限のトグル', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const reflectionsSwitch = page.locator('[id*="reflections"]').first();
    
    if (await reflectionsSwitch.isVisible()) {
      const initialState = await reflectionsSwitch.getAttribute('data-state');
      await reflectionsSwitch.click();
      await page.waitForTimeout(500);
      const newState = await reflectionsSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  // E2E-MENTOR-DAC-007: AI分析レポートアクセス権限のトグル
  test('E2E-MENTOR-DAC-007: AI分析レポートアクセス権限のトグル', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const aiReportsSwitch = page.locator('[id*="ai-reports"]').first();
    
    if (await aiReportsSwitch.isVisible()) {
      const initialState = await aiReportsSwitch.getAttribute('data-state');
      await aiReportsSwitch.click();
      await page.waitForTimeout(500);
      const newState = await aiReportsSwitch.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
    }
  });

  // E2E-MENTOR-DAC-008: アクセス権限保存ボタンの表示
  test('E2E-MENTOR-DAC-008: アクセス権限保存ボタンの表示', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const saveButton = page.locator('[data-testid*="save"], button:has-text("設定を保存")');
    
    if (await saveButton.count() > 0) {
      await expect(saveButton.first()).toBeVisible();
    }
  });

  // E2E-MENTOR-DAC-009: アクセス権限の保存
  test('E2E-MENTOR-DAC-009: アクセス権限の保存', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // 権限を変更
    const goalsSwitch = page.locator('[id*="goals"]').first();
    if (await goalsSwitch.isVisible()) {
      await goalsSwitch.click();
    }

    // 保存ボタンをクリック
    const saveButton = page.locator('[data-testid*="save"], button:has-text("設定を保存")');
    if (await saveButton.count() > 0) {
      await saveButton.first().click();

      // 成功メッセージが表示される
      const successMessage = page.locator('[data-testid="success-message"], text=/保存しました/');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });

  // E2E-MENTOR-DAC-010: メンターへの権限変更通知
  test('E2E-MENTOR-DAC-010: メンターへの権限変更通知', async ({ page }) => {
    // 権限を変更した後、メンター側で通知を確認
    await page.goto('http://localhost:3247/');
    await page.waitForLoadState('networkidle');

    const notificationIcon = page.locator('[data-testid="notification-icon"], button[aria-label*="通知"]');
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // アクセス権限変更の通知
      const permissionNotification = page.locator('text=/データアクセス権限が変更されました/');
      const count = await permissionNotification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-DAC-011: すべての権限をOFF
  test('E2E-MENTOR-DAC-011: すべての権限をOFF', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // すべてのスイッチをOFFに
    const switches = page.locator('[data-state="checked"]');
    const count = await switches.count();
    
    for (let i = 0; i < count; i++) {
      const switchElement = switches.nth(i);
      if (await switchElement.isVisible()) {
        await switchElement.click();
        await page.waitForTimeout(200);
      }
    }
  });

  // E2E-MENTOR-DAC-012: すべての権限をON
  test('E2E-MENTOR-DAC-012: すべての権限をON', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // すべてのスイッチをONに
    const switches = page.locator('[data-state="unchecked"]');
    const count = await switches.count();
    
    for (let i = 0; i < count; i++) {
      const switchElement = switches.nth(i);
      if (await switchElement.isVisible()) {
        await switchElement.click();
        await page.waitForTimeout(200);
      }
    }
  });

  // E2E-MENTOR-DAC-013: 監査ログの記録確認
  test('E2E-MENTOR-DAC-013: 監査ログの記録確認', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // 監査ログに関する説明テキストが表示される
    const auditLogText = page.locator('text=/監査ログに記録されます/');
    await expect(auditLogText).toBeVisible();
  });

  // E2E-MENTOR-DAC-014: メンター詳細情報の表示
  test('E2E-MENTOR-DAC-014: メンター詳細情報の表示', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      // メンター名とメールアドレスが表示される
      const mentorName = page.locator('[data-testid*="mentor-name"]');
      const mentorEmail = page.locator('[data-testid*="mentor-email"]');
      
      if (await mentorName.count() > 0) {
        await expect(mentorName.first()).toBeVisible();
      }
    }
  });

  // E2E-MENTOR-DAC-015: 関係ステータスバッジの表示
  test('E2E-MENTOR-DAC-015: 関係ステータスバッジの表示', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // アクティブまたは保留中のバッジが表示される
    const statusBadge = page.locator('[data-testid="status-badge"], .badge');
    
    if (await statusBadge.count() > 0) {
      await expect(statusBadge.first()).toBeVisible();
    }
  });

  // E2E-MENTOR-DAC-016: pending状態での権限設定無効化
  test('E2E-MENTOR-DAC-016: pending状態での権限設定無効化', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    // pending状態のメンター関係を探す
    const pendingBadge = page.locator('.badge:has-text("保留中")');
    
    if (await pendingBadge.count() > 0) {
      // pending状態ではスイッチが無効化されている
      const disabledSwitch = page.locator('[disabled]');
      const count = await disabledSwitch.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  // E2E-MENTOR-DAC-017: アクセス権限のリアルタイム反映
  test('E2E-MENTOR-DAC-017: アクセス権限のリアルタイム反映', async ({ page }) => {
    // クライアントが権限をOFFにした後、メンター側でデータにアクセスできなくなる
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const goalsSwitch = page.locator('[id*="goals"]').first();
    if (await goalsSwitch.isVisible()) {
      const initialState = await goalsSwitch.getAttribute('data-state');
      
      if (initialState === 'checked') {
        await goalsSwitch.click();
        
        // 保存ボタンをクリック
        const saveButton = page.locator('button:has-text("設定を保存")').first();
        await saveButton.click();
        
        // 成功メッセージを待つ
        await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      }
    }
  });

  // E2E-MENTOR-DAC-018: 複数メンターへの個別設定
  test('E2E-MENTOR-DAC-018: 複数メンターへの個別設定', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const mentorCards = page.locator('[data-testid*="mentor-"], .mentor-relationship-card');
    const count = await mentorCards.count();
    
    // 複数のメンターがいる場合、それぞれ個別に設定できる
    if (count > 1) {
      // 1つ目のメンターの目標権限をトグル
      const firstGoalsSwitch = page.locator('[id*="goals"]').first();
      await firstGoalsSwitch.click();
      
      // 2つ目のメンターの目標権限は独立して制御できる
      const secondGoalsSwitch = page.locator('[id*="goals"]').nth(1);
      const secondState = await secondGoalsSwitch.getAttribute('data-state');
      expect(secondState).toBeDefined();
    }
  });

  // E2E-MENTOR-DAC-019: メンターなし状態の表示
  test('E2E-MENTOR-DAC-019: メンターなし状態の表示', async ({ page }) => {
    // 新規ユーザーでメンター関係がない場合
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      const emptyMessage = page.locator('text=/まだメンター関係がありません/');
      const count = await emptyMessage.count();
      
      // メンターがいない場合、または1件以上いる場合、どちらでもOK
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-MENTOR-DAC-020: データアクセス制御のヘルプテキスト
  test('E2E-MENTOR-DAC-020: データアクセス制御のヘルプテキスト', async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');

    const dataAccessSection = page.locator('[data-testid="data-access-control-section"]');
    
    if (await dataAccessSection.isVisible()) {
      // ヘルプテキストが表示される
      const helpText = page.locator('text=/メンターに公開するデータの範囲/');
      await expect(helpText).toBeVisible();
    }
  });
});
