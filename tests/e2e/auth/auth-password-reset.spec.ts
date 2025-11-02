import { test, expect } from '@playwright/test';

// auth-password-reset.spec.ts: パスワードリセット機能テスト
// テストID範囲: E2E-AUTH-023 ~ E2E-AUTH-030

test.describe('パスワードリセット機能', () => {
  test.beforeEach(async ({ page }) => {
    // ブラウザストレージをクリア
    await page.goto('about:blank');
    await page.context().clearCookies();
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // about:blankなどでアクセスできない場合は無視
      }
    });
  });

  test('E2E-AUTH-023: パスワードリセット画面の初期表示', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    // ロゴ「COM:PASS」が表示されることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('COM:PASS');

    // パスワードリセットタイトルが表示されることを確認
    const resetTitle = page.locator('[data-testid="password-reset-title"]');
    await expect(resetTitle).toBeVisible();
    await expect(resetTitle).toContainText('パスワードリセット');

    // メールアドレス入力欄が表示されることを確認
    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'example@email.com');

    // リセットリンク送信ボタンが表示されることを確認
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toContainText('リセットリンクを送信');

    // ログイン画面に戻るリンクが表示されることを確認
    const backToLoginLink = page.locator('[data-testid="password-reset-back-to-login-link"]');
    await expect(backToLoginLink).toBeVisible();
  });

  test('E2E-AUTH-024: パスワードリセット成功', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');

    await emailInput.fill('test@mentalbase.local');

    // ボタンのテキストが「送信中...」に変わることを確認
    await sendButton.click();
    await expect(sendButton).toContainText('送信中...');

    // ボタンが無効化されることを確認
    await expect(sendButton).toBeDisabled();

    // パスワードリセット成功画面に遷移することを確認
    await page.waitForURL('**/auth?view=password-reset-success', { timeout: 5000 });
    expect(page.url()).toContain('?view=password-reset-success');
  });

  test('E2E-AUTH-025: パスワードリセット失敗（メールアドレス未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const sendButton = page.locator('[data-testid="password-reset-send-button"]');
    await sendButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="password-reset-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('メールアドレスを入力してください');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=password-reset');
  });

  test('E2E-AUTH-026: パスワードリセット失敗（メールアドレス形式エラー）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');

    await emailInput.fill('invalid-email');
    await sendButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="password-reset-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('有効なメールアドレスを入力してください');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=password-reset');
  });

  test('E2E-AUTH-027: パスワードリセット失敗（存在しないメール）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');

    // 存在しないメールアドレスで送信を試みる
    await emailInput.fill('nonexistent@example.com');
    await sendButton.click();

    // エラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="password-reset-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('リセットリンクの送信に失敗しました');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=password-reset');
  });

  test('E2E-AUTH-028: パスワードリセットからログイン画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    // ログイン画面に戻るリンクをクリック
    const backToLoginLink = page.locator('[data-testid="password-reset-back-to-login-link"]');
    await backToLoginLink.click();

    // URLが/auth?view=loginになることを待機
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });

    // ログイン画面が表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();
    await expect(loginTitle).toContainText('ログイン');

    // URLが/auth?view=loginになることを確認
    expect(page.url()).toContain('?view=login');
  });

  test('E2E-AUTH-029: パスワードリセット成功画面の表示', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');

    await emailInput.fill('test@mentalbase.local');
    await sendButton.click();

    // パスワードリセット成功画面が表示されることを確認
    await page.waitForURL('**/auth?view=password-reset-success', { timeout: 5000 });

    // メール送信完了タイトルが表示されることを確認
    const successTitle = page.locator('[data-testid="password-reset-success-title"]');
    await expect(successTitle).toBeVisible();
    await expect(successTitle).toContainText('メール送信完了');

    // チェックアイコンが表示されることを確認
    const checkIcon = page.locator('[data-testid="password-reset-success-icon"]');
    await expect(checkIcon).toBeVisible();

    // 成功メッセージが表示されることを確認
    const successMessage = page.locator('[data-testid="password-reset-success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('パスワードリセット用のリンクをメールで送信しました');

    // ログイン画面に戻るリンクが表示されることを確認
    const backToLoginLink = page.locator('[data-testid="password-reset-success-back-to-login-link"]');
    await expect(backToLoginLink).toBeVisible();
  });

  test('E2E-AUTH-030: パスワードリセット成功画面からログイン画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=password-reset');

    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');

    await emailInput.fill('test@mentalbase.local');
    await sendButton.click();

    // パスワードリセット成功画面が表示されるのを待つ
    await page.waitForURL('**/auth?view=password-reset-success', { timeout: 5000 });

    // ログイン画面に戻るリンクをクリック
    const backToLoginLink = page.locator('[data-testid="password-reset-success-back-to-login-link"]');
    await backToLoginLink.click();

    // URLが/auth?view=loginになることを待機
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });

    // ログイン画面が表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();
    await expect(loginTitle).toContainText('ログイン');

    // URLが/auth?view=loginになることを確認
    expect(page.url()).toContain('?view=login');
  });
});
