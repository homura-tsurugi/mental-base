import { test, expect } from '@playwright/test';

// auth-register.spec.ts: 新規登録機能テスト
// テストID範囲: E2E-AUTH-012 ~ E2E-AUTH-022

test.describe('新規登録機能', () => {
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

  test('E2E-AUTH-012: 新規登録画面の初期表示', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    // ロゴ「COM:PASS」が表示されることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('COM:PASS');

    // 新規登録タイトルが表示されることを確認
    const registerTitle = page.locator('[data-testid="register-title"]');
    await expect(registerTitle).toBeVisible();
    await expect(registerTitle).toContainText('新規登録');

    // お名前入力欄が表示されることを確認
    const nameInput = page.locator('[data-testid="register-name-input"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('placeholder', '山田 太郎');

    // メールアドレス入力欄が表示されることを確認
    const emailInput = page.locator('[data-testid="register-email-input"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('placeholder', 'example@email.com');

    // パスワード入力欄が表示されることを確認
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('placeholder', '8文字以上、英数字混在推奨');

    // 登録ボタンが表示されることを確認
    const registerButton = page.locator('[data-testid="register-button"]');
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toContainText('登録してはじめる');

    // ログインリンクが表示されることを確認
    const loginLink = page.locator('[data-testid="register-login-link"]');
    await expect(loginLink).toBeVisible();
  });

  test('E2E-AUTH-013: 新規登録成功', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    // ユーザー情報を入力
    await nameInput.fill('山田太郎');
    await emailInput.fill('newuser@example.com');
    await passwordInput.fill('Password123');

    // ボタンのテキストが「登録中...」に変わることを確認
    await registerButton.click();
    await expect(registerButton).toContainText('登録中...');

    // ボタンが無効化されることを確認
    await expect(registerButton).toBeDisabled();

    // ホーム(/)にリダイレクトされることを確認
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:3247/');
  });

  test('E2E-AUTH-014: 新規登録失敗（名前未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();

    // お名前欄の下にエラーメッセージが表示されることを確認
    const nameError = page.locator('[data-testid="register-name-error"]');
    await expect(nameError).toBeVisible();
    await expect(nameError).toContainText('名前を入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-015: 新規登録失敗（名前2文字未満）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await nameInput.fill('A'); // 1文字
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await registerButton.click();

    // お名前欄の下にエラーメッセージが表示されることを確認
    const nameError = page.locator('[data-testid="register-name-error"]');
    await expect(nameError).toBeVisible();
    await expect(nameError).toContainText('名前は2文字以上で入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-016: 新規登録失敗（メールアドレス未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await nameInput.fill('山田太郎');
    await passwordInput.fill('password123');
    await registerButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('メールアドレスを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-017: 新規登録失敗（メールアドレス形式エラー）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await nameInput.fill('山田太郎');
    await emailInput.fill('invalid@');
    await passwordInput.fill('password123');
    await registerButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('有効なメールアドレスを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-018: 新規登録失敗（パスワード未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await nameInput.fill('山田太郎');
    await emailInput.fill('test@example.com');
    await registerButton.click();

    // パスワード欄の下にエラーメッセージが表示されることを確認
    const passwordError = page.locator('[data-testid="register-password-error"]');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText('パスワードを入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-019: 新規登録失敗（パスワード文字数不足）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    await nameInput.fill('山田太郎');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('pass12'); // 6文字
    await registerButton.click();

    // パスワード欄の下にエラーメッセージが表示されることを確認
    const passwordError = page.locator('[data-testid="register-password-error"]');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText('パスワードは8文字以上で入力してください');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-020: 新規登録失敗（全フィールド未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const registerButton = page.locator('[data-testid="register-button"]');
    await registerButton.click();

    // お名前欄にエラーが表示されることを確認
    const nameError = page.locator('[data-testid="register-name-error"]');
    await expect(nameError).toBeVisible();

    // メールアドレス欄にエラーが表示されることを確認
    const emailError = page.locator('[data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();

    // パスワード欄にエラーが表示されることを確認
    const passwordError = page.locator('[data-testid="register-password-error"]');
    await expect(passwordError).toBeVisible();

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-021: 新規登録失敗（メールアドレス重複）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    // 既存メールアドレスで登録を試みる
    await nameInput.fill('山田太郎');
    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('password123');
    await registerButton.click();

    // メールアドレス欄の下にエラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('登録に失敗しました');

    // リダイレクトされないことを確認
    expect(page.url()).toContain('?view=register');
  });

  test('E2E-AUTH-022: 新規登録からログイン画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    // ログインリンクをクリック
    const loginLink = page.locator('[data-testid="register-login-link"]');
    await loginLink.click();

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
