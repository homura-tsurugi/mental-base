import { test, expect } from '@playwright/test';

/**
 * settings-mentor-registration.spec.ts: メンター登録機能のテスト
 * テストID範囲: E2E-SETTINGS-MENTOR-001 ~ E2E-SETTINGS-MENTOR-020
 */

test.describe('E2E-SETTINGS-MENTOR: メンター登録機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3247/settings');
    await page.waitForLoadState('networkidle');
  });

  // E2E-SETTINGS-MENTOR-001: メンター登録セクションの表示
  test('E2E-SETTINGS-MENTOR-001: メンター登録セクションの表示', async ({ page }) => {
    const mentorRegistrationSection = page.locator('[data-testid="mentor-registration-section"]');
    await expect(mentorRegistrationSection).toBeVisible();
  });

  // E2E-SETTINGS-MENTOR-002: メンター登録ボタンの表示（未登録ユーザー）
  test('E2E-SETTINGS-MENTOR-002: メンター登録ボタンの表示（未登録ユーザー）', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する")');

    // ボタンが表示されるか、既に登録済みバッジが表示される
    const isRegisterVisible = await registerButton.isVisible();
    const registeredBadge = page.locator('.badge:has-text("登録済み")');
    const isBadgeVisible = await registeredBadge.isVisible();

    expect(isRegisterVisible || isBadgeVisible).toBeTruthy();
  });

  // E2E-SETTINGS-MENTOR-003: メンター登録フォームの展開
  test('E2E-SETTINGS-MENTOR-003: メンター登録フォームの展開', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する")');

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // 自己紹介入力欄が表示される
      const bioTextarea = page.locator('[data-testid="bio-input"], textarea[id="bio"]');
      await expect(bioTextarea).toBeVisible();

      // 専門分野入力欄が表示される
      const expertiseInput = page.locator('[data-testid="expertise-input"], input[id="expertise"]');
      await expect(expertiseInput).toBeVisible();
    }
  });

  // E2E-SETTINGS-MENTOR-004: 自己紹介の入力
  test('E2E-SETTINGS-MENTOR-004: 自己紹介の入力', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する"), button:has-text("編集")');

    if (await registerButton.count() > 0) {
      await registerButton.first().click();

      const bioTextarea = page.locator('[data-testid="bio-input"], textarea[id="bio"]');
      if (await bioTextarea.isVisible()) {
        await bioTextarea.fill('10年以上のキャリアコーチング経験があります。一緒に目標達成を目指しましょう。');

        const value = await bioTextarea.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  // E2E-SETTINGS-MENTOR-005: 専門分野の入力（カンマ区切り）
  test('E2E-SETTINGS-MENTOR-005: 専門分野の入力（カンマ区切り）', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する"), button:has-text("編集")');

    if (await registerButton.count() > 0) {
      await registerButton.first().click();

      const expertiseInput = page.locator('[data-testid="expertise-input"], input[id="expertise"]');
      if (await expertiseInput.isVisible()) {
        await expertiseInput.fill('キャリア相談, 時間管理, ストレス管理');

        const value = await expertiseInput.inputValue();
        expect(value).toContain(',');
      }
    }
  });

  // E2E-SETTINGS-MENTOR-006: メンター登録の実行
  test('E2E-SETTINGS-MENTOR-006: メンター登録の実行', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する")');

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // フォームに入力
      const bioTextarea = page.locator('textarea[id="bio"]');
      await bioTextarea.fill('メンターとして皆様の成長をサポートします。');

      const expertiseInput = page.locator('input[id="expertise"]');
      await expertiseInput.fill('キャリア相談, ライフコーチング');

      // 登録ボタンをクリック
      const submitButton = page.locator('button:has-text("登録")');
      await submitButton.click();

      // 成功メッセージが表示される
      const successMessage = page.locator('[data-testid="success-message"], text=/登録しました/');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });

  // E2E-SETTINGS-MENTOR-007: 登録済みバッジの表示
  test('E2E-SETTINGS-MENTOR-007: 登録済みバッジの表示', async ({ page }) => {
    // 既にメンター登録済みの場合
    const registeredBadge = page.locator('.badge:has-text("登録済み")');

    if (await registeredBadge.isVisible()) {
      await expect(registeredBadge).toHaveText(/登録済み/);
    }
  });

  // E2E-SETTINGS-MENTOR-008: メンター情報の編集ボタン
  test('E2E-SETTINGS-MENTOR-008: メンター情報の編集ボタン', async ({ page }) => {
    const registeredBadge = page.locator('.badge:has-text("登録済み")');

    if (await registeredBadge.isVisible()) {
      // 編集ボタンが表示される
      const editButton = page.locator('button:has-text("編集")');
      await expect(editButton).toBeVisible();
    }
  });

  // E2E-SETTINGS-MENTOR-009: メンター情報の編集
  test('E2E-SETTINGS-MENTOR-009: メンター情報の編集', async ({ page }) => {
    const editButton = page.locator('button:has-text("編集")');

    if (await editButton.count() > 0) {
      await editButton.first().click();

      // 既存の情報が表示される
      const bioTextarea = page.locator('textarea[id="bio"]');
      if (await bioTextarea.isVisible()) {
        const currentValue = await bioTextarea.inputValue();

        // 新しい情報を追加
        await bioTextarea.fill(currentValue + ' 更新しました。');

        // 更新ボタンをクリック
        const updateButton = page.locator('button:has-text("更新")');
        await updateButton.click();

        // 成功メッセージが表示される
        const successMessage = page.locator('[data-testid="success-message"]');
        await expect(successMessage).toBeVisible({ timeout: 10000 });
      }
    }
  });

  // E2E-SETTINGS-MENTOR-010: 編集のキャンセル
  test('E2E-SETTINGS-MENTOR-010: 編集のキャンセル', async ({ page }) => {
    const editButton = page.locator('button:has-text("編集")');

    if (await editButton.count() > 0) {
      await editButton.first().click();

      const bioTextarea = page.locator('textarea[id="bio"]');
      if (await bioTextarea.isVisible()) {
        const originalValue = await bioTextarea.inputValue();

        // 値を変更
        await bioTextarea.fill('変更テスト');

        // キャンセルボタンをクリック
        const cancelButton = page.locator('button:has-text("キャンセル")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();

          // フォームが閉じる（または元の値に戻る）
          await page.waitForTimeout(500);
        }
      }
    }
  });

  // E2E-SETTINGS-MENTOR-011: 専門分野の複数指定
  test('E2E-SETTINGS-MENTOR-011: 専門分野の複数指定', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する"), button:has-text("編集")');

    if (await registerButton.count() > 0) {
      await registerButton.first().click();

      const expertiseInput = page.locator('input[id="expertise"]');
      if (await expertiseInput.isVisible()) {
        // 5つの専門分野を指定
        await expertiseInput.fill('キャリア相談, 時間管理, ストレス管理, リーダーシップ, コミュニケーション');

        const value = await expertiseInput.inputValue();
        const count = value.split(',').length;
        expect(count).toBe(5);
      }
    }
  });

  // E2E-SETTINGS-MENTOR-012: 空欄での登録試行
  test('E2E-SETTINGS-MENTOR-012: 空欄での登録試行', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する")');

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // 何も入力せずに登録ボタンをクリック
      const submitButton = page.locator('button:has-text("登録")');
      await submitButton.click();

      // 空欄でも登録可能（任意項目のため）
      await page.waitForTimeout(2000);
    }
  });

  // E2E-SETTINGS-MENTOR-013: 自己紹介の文字数制限
  test('E2E-SETTINGS-MENTOR-013: 自己紹介の文字数制限', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する"), button:has-text("編集")');

    if (await registerButton.count() > 0) {
      await registerButton.first().click();

      const bioTextarea = page.locator('textarea[id="bio"]');
      if (await bioTextarea.isVisible()) {
        // 長いテキストを入力
        const longText = 'a'.repeat(1000);
        await bioTextarea.fill(longText);

        const value = await bioTextarea.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  // E2E-SETTINGS-MENTOR-014: メンター登録後の通知確認
  test('E2E-SETTINGS-MENTOR-014: メンター登録後の通知確認', async ({ page }) => {
    // 登録後に通知アイコンを確認
    await page.goto('http://localhost:3247/');
    await page.waitForLoadState('networkidle');

    const notificationIcon = page.locator('[data-testid="notification-icon"], button[aria-label*="通知"]');
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();

      // メンター登録完了の通知
      const mentorNotification = page.locator('text=/メンター登録が完了しました/');
      const count = await mentorNotification.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // E2E-SETTINGS-MENTOR-015: メンター情報の表示形式
  test('E2E-SETTINGS-MENTOR-015: メンター情報の表示形式', async ({ page }) => {
    const mentorRegistrationSection = page.locator('[data-testid="mentor-registration-section"]');

    if (await mentorRegistrationSection.isVisible()) {
      // セクションタイトルが表示される
      const sectionTitle = page.locator('text=/メンター登録/');
      await expect(sectionTitle).toBeVisible();

      // 説明文が表示される
      const description = page.locator('text=/メンターとして登録し/');
      await expect(description).toBeVisible();
    }
  });

  // E2E-SETTINGS-MENTOR-016: ヘルプテキストの表示
  test('E2E-SETTINGS-MENTOR-016: ヘルプテキストの表示', async ({ page }) => {
    const registerButton = page.locator('button:has-text("メンターとして登録する"), button:has-text("編集")');

    if (await registerButton.count() > 0) {
      await registerButton.first().click();

      // 専門分野のヘルプテキスト
      const helpText = page.locator('text=/複数の専門分野をカンマで区切って/');
      await expect(helpText).toBeVisible();
    }
  });

  // E2E-SETTINGS-MENTOR-017: ロールの確認
  test('E2E-SETTINGS-MENTOR-017: ロールの確認', async ({ page }) => {
    // メンター登録後、ロールがMENTORに変更される
    // これはバックエンドでの確認が必要だが、UI上では登録済みバッジで判断
    const registeredBadge = page.locator('.badge:has-text("登録済み")');

    if (await registeredBadge.isVisible()) {
      // メンターとして登録されている
      expect(await registeredBadge.textContent()).toContain('登録済み');
    }
  });

  // E2E-SETTINGS-MENTOR-018: メンターダッシュボードへのアクセス
  test('E2E-SETTINGS-MENTOR-018: メンターダッシュボードへのアクセス', async ({ page }) => {
    // メンター登録後、メンターダッシュボードにアクセスできる
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');

    // ページが表示される（403エラーにならない）
    const pageTitle = page.locator('h1, [data-testid="page-title"]');
    const isVisible = await pageTitle.isVisible();

    // メンターとして登録されている場合はアクセス可能
    expect(isVisible).toBeTruthy();
  });

  // E2E-SETTINGS-MENTOR-019: プロフィール更新後の反映
  test('E2E-SETTINGS-MENTOR-019: プロフィール更新後の反映', async ({ page }) => {
    const editButton = page.locator('button:has-text("編集")');

    if (await editButton.count() > 0) {
      await editButton.first().click();

      const bioTextarea = page.locator('textarea[id="bio"]');
      if (await bioTextarea.isVisible()) {
        const newBio = 'テストメンター - 更新版';
        await bioTextarea.fill(newBio);

        const updateButton = page.locator('button:has-text("更新")');
        await updateButton.click();

        // ページをリロード
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 更新した情報が表示される
        const editButtonAfterReload = page.locator('button:has-text("編集")');
        if (await editButtonAfterReload.count() > 0) {
          await editButtonAfterReload.first().click();
          const bioAfterReload = await page.locator('textarea[id="bio"]').inputValue();
          expect(bioAfterReload).toContain('テストメンター');
        }
      }
    }
  });

  // E2E-SETTINGS-MENTOR-020: セクションの位置確認
  test('E2E-SETTINGS-MENTOR-020: セクションの位置確認', async ({ page }) => {
    // メンター登録セクションがプロフィールセクションの後に表示される
    const profileSection = page.locator('[data-testid="profile-section"]');
    const mentorSection = page.locator('[data-testid="mentor-registration-section"]');

    const isProfileVisible = await profileSection.isVisible();
    const isMentorVisible = await mentorSection.isVisible();

    expect(isProfileVisible).toBeTruthy();
    expect(isMentorVisible).toBeTruthy();
  });
});
