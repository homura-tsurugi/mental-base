import { test, expect } from '@playwright/test';

// auth-new-password.spec.ts: 新しいパスワード設定機能テスト
// テストID範囲: E2E-AUTH-031 ~ E2E-AUTH-038

test.describe('新しいパスワード設定機能', () => {
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

  test('E2E-AUTH-031: 新しいパスワード設定画面の初期表示', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    // ロゴ「COM:PASS」が表示されることを確認
    const logo = page.locator('[data-testid="auth-logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('COM:PASS');

    // 新しいパスワード設定タイトルが表示されることを確認
    const title = page.locator('[data-testid="new-password-title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('新しいパスワード設定');

    // 新しいパスワード入力欄が表示されることを確認
    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    await expect(newPasswordInput).toBeVisible();
    await expect(newPasswordInput).toHaveAttribute('placeholder', '8文字以上、英数字混在推奨');

    // パスワード確認入力欄が表示されることを確認
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    await expect(confirmPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toHaveAttribute('placeholder', 'もう一度入力してください');

    // パスワード変更ボタンが表示されることを確認
    const changeButton = page.locator('[data-testid="new-password-change-button"]');
    await expect(changeButton).toBeVisible();
    await expect(changeButton).toContainText('パスワードを変更');

    // ログイン画面に戻るリンクが表示されることを確認
    const backToLoginLink = page.locator('[data-testid="new-password-back-to-login-link"]');
    await expect(backToLoginLink).toBeVisible();
  });

  test('E2E-AUTH-032: 新しいパスワード設定成功', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await newPasswordInput.fill('NewPassword123');
    await confirmPasswordInput.fill('NewPassword123');

    // ボタンのテキストが「変更中...」に変わることを確認
    await changeButton.click();
    await expect(changeButton).toContainText('変更中...');

    // ボタンが無効化されることを確認
    await expect(changeButton).toBeDisabled();

    // ログイン画面にリダイレクトされることを確認
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });
    expect(page.url()).toContain('?view=login');
  });

  test('E2E-AUTH-033: 新しいパスワード設定失敗（新しいパスワード未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await confirmPasswordInput.fill('password123');
    await changeButton.click();

    // 新しいパスワード欄の下にエラーメッセージが表示されることを確認
    const newPasswordError = page.locator('[data-testid="new-password-error"]');
    await expect(newPasswordError).toBeVisible();
    await expect(newPasswordError).toContainText('パスワードを入力してください');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=new-password');
  });

  test('E2E-AUTH-034: 新しいパスワード設定失敗（確認用パスワード未入力）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await newPasswordInput.fill('password123');
    await changeButton.click();

    // パスワード確認欄の下にエラーメッセージが表示されることを確認
    const confirmPasswordError = page.locator('[data-testid="new-password-confirm-error"]');
    await expect(confirmPasswordError).toBeVisible();
    await expect(confirmPasswordError).toContainText('確認用パスワードを入力してください');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=new-password');
  });

  test('E2E-AUTH-035: 新しいパスワード設定失敗（パスワード不一致）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await newPasswordInput.fill('password123');
    await confirmPasswordInput.fill('password456');
    await changeButton.click();

    // パスワード確認欄の下にエラーメッセージが表示されることを確認
    const confirmPasswordError = page.locator('[data-testid="new-password-confirm-error"]');
    await expect(confirmPasswordError).toBeVisible();
    await expect(confirmPasswordError).toContainText('パスワードが一致しません');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=new-password');
  });

  test('E2E-AUTH-036: 新しいパスワード設定失敗（パスワード文字数不足）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await newPasswordInput.fill('pass12'); // 6文字
    await confirmPasswordInput.fill('pass12');
    await changeButton.click();

    // 新しいパスワード欄の下にエラーメッセージが表示されることを確認
    const newPasswordError = page.locator('[data-testid="new-password-error"]');
    await expect(newPasswordError).toBeVisible();
    await expect(newPasswordError).toContainText('パスワードは8文字以上で入力してください');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=new-password');
  });

  test('E2E-AUTH-037: 新しいパスワード設定失敗（無効なトークン）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=invalid');

    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    const changeButton = page.locator('[data-testid="new-password-change-button"]');

    await newPasswordInput.fill('password123');
    await confirmPasswordInput.fill('password123');
    await changeButton.click();

    // 新しいパスワード欄の下にエラーメッセージが表示されることを確認
    const newPasswordError = page.locator('[data-testid="new-password-error"]');
    await expect(newPasswordError).toBeVisible();
    await expect(newPasswordError).toContainText('パスワードの変更に失敗しました');

    // 画面遷移しないことを確認
    expect(page.url()).toContain('?view=new-password');
  });

  test('E2E-AUTH-038: 新しいパスワード設定からログイン画面への遷移', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    // ログイン画面に戻るリンクをクリック
    const backToLoginLink = page.locator('[data-testid="new-password-back-to-login-link"]');
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
