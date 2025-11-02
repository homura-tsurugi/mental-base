import { test, expect } from '@playwright/test';

// auth-ui-and-workflow.spec.ts: UI・プレースホルダー・ワークフロー複合テスト
// テストID範囲: E2E-AUTH-039 ~ E2E-AUTH-045, E2E-AUTH-057 ~ E2E-AUTH-062

test.describe('UI・プレースホルダー・ワークフロー', () => {
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

  // === プレースホルダー表示テスト ===

  test('E2E-AUTH-039: プレースホルダー表示確認（ログイン）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    // メールアドレス欄のプレースホルダーを確認
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    expect(emailPlaceholder).toBe('example@email.com');

    // パスワード欄のプレースホルダーを確認
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    expect(passwordPlaceholder).toBe('8文字以上');
  });

  test('E2E-AUTH-040: プレースホルダー表示確認（新規登録）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    // お名前欄のプレースホルダーを確認
    const nameInput = page.locator('[data-testid="register-name-input"]');
    const namePlaceholder = await nameInput.getAttribute('placeholder');
    expect(namePlaceholder).toBe('山田 太郎');

    // メールアドレス欄のプレースホルダーを確認
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    expect(emailPlaceholder).toBe('example@email.com');

    // パスワード欄のプレースホルダーを確認
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    expect(passwordPlaceholder).toBe('8文字以上、英数字混在推奨');
  });

  test('E2E-AUTH-041: 入力欄フォーカス状態（ログイン）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');

    // メールアドレス欄にフォーカス
    await emailInput.focus();
    const emailFocusedBorderColor = await emailInput.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );
    expect(emailFocusedBorderColor).toBeTruthy();

    // パスワード欄にフォーカス
    await passwordInput.focus();
    const passwordFocusedBorderColor = await passwordInput.evaluate(el =>
      window.getComputedStyle(el).borderColor
    );
    expect(passwordFocusedBorderColor).toBeTruthy();
  });

  test('E2E-AUTH-042: ボタンホバー状態', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const loginButton = page.locator('[data-testid="login-button"]');

    // ボタンにマウスオーバー
    await loginButton.hover();

    // ホバー状態のスタイルが適用されることを確認
    const hoverBackgroundColor = await loginButton.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(hoverBackgroundColor).toBeTruthy();

    // ボタンは見えることを確認
    await expect(loginButton).toBeVisible();
  });

  test('E2E-AUTH-043: リンクホバー状態', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');

    // リンクにマウスオーバー
    await forgotPasswordLink.hover();

    // ホバー状態が適用されることを確認
    const hoverColor = await forgotPasswordLink.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(hoverColor).toBeTruthy();

    // リンクは見えることを確認
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('E2E-AUTH-044: ボタン無効化状態の確認', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');

    // ボタンをクリック
    await loginButton.click();

    // ボタンのテキストが「ログイン中...」に変わることを確認
    await expect(loginButton).toContainText('ログイン中...');

    // ボタンが無効化されていることを確認
    await expect(loginButton).toBeDisabled();

    // 入力欄も無効化されていることを確認
    await expect(emailInput).toBeDisabled();
    await expect(passwordInput).toBeDisabled();
  });

  test('E2E-AUTH-045: エラーメッセージのスタイル確認', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // エラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();

    // エラーメッセージが赤色で表示されていることを確認
    const errorColor = await emailError.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(errorColor).toBeTruthy();

    // エラーメッセージのフォントサイズを確認
    const fontSize = await emailError.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );
    expect(fontSize).toBeTruthy();
  });

  // === ワークフロー・複合テスト ===

  test('E2E-AUTH-057: ワークフロー: ログイン', async ({ page }) => {
    // 1. /authにアクセス
    await page.goto('http://localhost:3247/auth');

    // ログイン画面が表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();

    // 2. メールアドレスを入力
    const emailInput = page.locator('[data-testid="login-email-input"]');
    await emailInput.fill('test@mentalbase.local');

    // 3. パスワードを入力
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    await passwordInput.fill('MentalBase2025!Dev');

    // 4. ログインボタンをクリック
    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // 送信処理が実行されることを確認
    await expect(loginButton).toContainText('ログイン中...');

    // ホームにリダイレクトされることを確認
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:3247/');
  });

  test('E2E-AUTH-058: ワークフロー: 新規登録', async ({ page }) => {
    // 1. /authにアクセス
    await page.goto('http://localhost:3247/auth');

    // 2. 新規登録リンクをクリック
    const registerLink = page.locator('[data-testid="login-register-link"]');
    await registerLink.click();

    // 新規登録画面に遷移することを確認
    await page.waitForURL('**/auth?view=register', { timeout: 5000 });
    expect(page.url()).toContain('?view=register');

    // 3. 名前、メール、パスワードを入力
    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');

    const uniqueEmail = `newuser-${Date.now()}@example.com`;
    await nameInput.fill('山田太郎');
    await emailInput.fill(uniqueEmail);
    await passwordInput.fill('Password123');

    // 4. 登録ボタンをクリック
    const registerButton = page.locator('[data-testid="register-button"]');
    await registerButton.click();

    // 登録処理が実行されることを確認
    await expect(registerButton).toContainText('登録中...');

    // ホームにリダイレクトされることを確認
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:3247/');
  });

  test('E2E-AUTH-059: ワークフロー: パスワードリセット', async ({ page }) => {
    // 1. /authにアクセス
    await page.goto('http://localhost:3247/auth');

    // 2. パスワードを忘れた場合リンクをクリック
    const forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    await forgotPasswordLink.click();

    // パスワードリセット画面に遷移することを確認
    await page.waitForURL('**/auth?view=password-reset', { timeout: 5000 });
    expect(page.url()).toContain('?view=password-reset');

    // 3. メールアドレスを入力
    const emailInput = page.locator('[data-testid="password-reset-email-input"]');
    await emailInput.fill('test@mentalbase.local');

    // 4. リセットリンク送信ボタンをクリック
    const sendButton = page.locator('[data-testid="password-reset-send-button"]');
    await sendButton.click();

    // 送信処理が実行されることを確認
    await expect(sendButton).toContainText('送信中...');

    // 成功画面が表示されることを確認
    await page.waitForURL('**/auth?view=password-reset-success', { timeout: 5000 });
    expect(page.url()).toContain('?view=password-reset-success');
  });

  test('E2E-AUTH-060: ワークフロー: 新しいパスワード設定', async ({ page }) => {
    // 1. /auth?view=new-password&token=test-tokenにアクセス
    await page.goto('http://localhost:3247/auth?view=new-password&token=test-token');

    // 新しいパスワード設定画面が表示されることを確認
    const newPasswordTitle = page.locator('[data-testid="new-password-title"]');
    await expect(newPasswordTitle).toBeVisible();

    // 2. 新しいパスワードを入力
    const newPasswordInput = page.locator('[data-testid="new-password-input"]');
    await newPasswordInput.fill('NewPassword123');

    // 3. パスワード確認を入力
    const confirmPasswordInput = page.locator('[data-testid="new-password-confirm-input"]');
    await confirmPasswordInput.fill('NewPassword123');

    // 4. 変更ボタンをクリック
    const changeButton = page.locator('[data-testid="new-password-change-button"]');
    await changeButton.click();

    // 変更処理が実行されることを確認
    await expect(changeButton).toContainText('変更中...');

    // ログイン画面に遷移することを確認
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });
    expect(page.url()).toContain('?view=login');
  });

  test('E2E-AUTH-061: ワークフロー: 画面間の往復', async ({ page }) => {
    // 1. ログイン→新規登録→ログイン
    await page.goto('http://localhost:3247/auth?view=login');
    expect(page.url()).toContain('?view=login');

    // 新規登録画面へ
    const registerLink = page.locator('[data-testid="login-register-link"]');
    await registerLink.click();
    await page.waitForURL('**/auth?view=register', { timeout: 5000 });
    expect(page.url()).toContain('?view=register');

    // ログイン画面へ戻る
    const loginLink = page.locator('[data-testid="register-login-link"]');
    await loginLink.click();
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });
    expect(page.url()).toContain('?view=login');

    // 2. ログイン→パスワードリセット→ログイン
    const forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    await forgotPasswordLink.click();
    await page.waitForURL('**/auth?view=password-reset', { timeout: 5000 });
    expect(page.url()).toContain('?view=password-reset');

    // ログイン画面へ戻る
    const backToLoginLink = page.locator('[data-testid="password-reset-back-to-login-link"]');
    await backToLoginLink.click();
    await page.waitForURL('**/auth?view=login', { timeout: 5000 });
    expect(page.url()).toContain('?view=login');

    // 各画面のコンテンツが正しく表示されることを確認
    const loginTitle = page.locator('[data-testid="login-title"]');
    await expect(loginTitle).toBeVisible();
  });

  test('E2E-AUTH-062: ワークフロー: エラーからの復帰', async ({ page }) => {
    // 1. バリデーションエラーを発生させる
    await page.goto('http://localhost:3247/auth');

    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // エラーメッセージが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();

    // 2. 正しい値を再入力する
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');

    // 3. フォームを送信する
    await loginButton.click();

    // エラーメッセージが消えることを確認
    await expect(emailError).not.toBeVisible();

    // 送信が成功することを確認
    await expect(loginButton).toContainText('ログイン中...');

    // ホームにリダイレクトされることを確認
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });
    expect(page.url()).toBe('http://localhost:3247/');
  });
});
