import { test, expect } from '@playwright/test';

// auth-login.spec.ts: ログイン機能テスト
// テストID範囲: E2E-AUTH-001 ~ E2E-AUTH-011

test.describe('ログイン機能', () => {
  test.beforeEach(async ({ page }) => {
    // ブラウザストレージをクリア
    await page.context().clearCookies();
    // localStorageとsessionStorageのクリアは実際のページ遷移後に行う
    await page.goto('http://localhost:3247/auth');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // about:blankなどでアクセスできない場合は無視
      }
    });
  });

  test('E2E-AUTH-001: ログイン画面の初期表示', async ({ page }) => {
    // beforeEachで既にページ遷移済み

    // ロゴ「COM:PASS」が表示されることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('COM:PASS');

    // サブテキストが表示されることを確認
    const subtitle = page.locator('[data-testid="auth-subtitle"]');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('ライフ・ワークガバナンス プラットフォーム');

    // ログインタイトルが表示されることを確認
    const title = page.locator('[data-testid="login-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('ログイン');

    // メールアドレス入力欄が表示されることを確認
    const emailInput = page.locator('[data-testid="login-email-input"]');
    await expect(emailInput).toBeVisible();

    // パスワード入力欄が表示されることを確認
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    await expect(passwordInput).toBeVisible();

    // ログインボタンが表示されることを確認
    const loginButton = page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toContainText('ログイン');

    // パスワードを忘れた場合リンクが表示されることを確認
    const forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    await expect(forgotPasswordLink).toBeVisible();

    // 新規登録リンクが表示されることを確認
    const registerLink = page.locator('[data-testid="login-register-link"]');
    await expect(registerLink).toBeVisible();
  });

  test('E2E-AUTH-002: URLパラメータでログイン画面表示', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=login');

    // ログイン画面が表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();
    await expect(loginTitle).toContainText('ログイン');
  });

  test('E2E-AUTH-003: ログイン成功', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // メールアドレスとパスワードを入力
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');

    // ボタンのテキストが「ログイン中...」に変わることを確認
    await loginButton.click();
    await expect(loginButton).toContainText('ログイン中...');

    // ボタンが無効化されることを確認
    await expect(loginButton).toBeDisabled();

    // ホーム(/)にリダイレクトされることを確認
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:3247/');
  });

  test('E2E-AUTH-004: ログイン失敗（メールアドレス未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // パスワードのみ入力
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await passwordInput.fill('password123');
    await loginButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('メールアドレスを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-005: ログイン失敗（パスワード未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // メールアドレスのみ入力
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@example.com');
    await loginButton.click();

    // パスワード欄の下にエラーメッセージが表示されることを確認
    const passwordError = page.locator('[data-testid="login-password-error"]');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText('パスワードを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-006: ログイン失敗（両方未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // メールアドレス欄にエラーが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();

    // パスワード欄にエラーが表示されることを確認
    const passwordError = page.locator('[data-testid="login-password-error"]');
    await expect(passwordError).toBeVisible();

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-007: ログイン失敗（メールアドレス形式エラー）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await loginButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('有効なメールアドレスを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-008: ログイン失敗（パスワード文字数不足）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('pass'); // 4文字
    await loginButton.click();

    // パスワード欄の下にエラーメッセージが表示されることを確認
    const passwordError = page.locator('[data-testid="login-password-error"]');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText('パスワードは8文字以上で入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-009: ログイン失敗（API認証エラー）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    // 存在しないメールアドレスで認証を試みる
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('password123');
    await loginButton.click();

    // エラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('ログインに失敗しました');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-010: 新規登録画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // 新規登録リンクをクリック
    const registerLink = page.locator('[data-testid="login-register-link"]');
    await registerLink.click();

    // URLが/auth?view=registerになることを待機
    await page.waitForURL('**/auth?view=register', { timeout: 5000 });

    // 新規登録画面が表示されることを確認
    const registerTitle = page.locator('[data-testid="register-title"]');
    await expect(registerTitle).toBeVisible();
    await expect(registerTitle).toContainText('新規登録');

    // URLが/auth?view=registerになることを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-011: パスワードリセット画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // パスワードを忘れた場合リンクをクリック
    const forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    await forgotPasswordLink.click();

    // URLが/auth?view=password-resetになることを待機
    await page.waitForURL('**/auth?view=password-reset', { timeout: 5000 });

    // パスワードリセット画面が表示されることを確認
    const passwordResetTitle = page.locator('[data-testid="password-reset-title"]');
    await expect(passwordResetTitle).toBeVisible();
    await expect(passwordResetTitle).toContainText('パスワードリセット');

    // URLが/auth?view=password-resetになることを確認
    expect(page.url()).toContain('?view=password-reset');
  });
});
