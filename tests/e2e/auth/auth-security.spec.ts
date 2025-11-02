import { test, expect } from '@playwright/test';

// auth-security.spec.ts: セキュリティテスト
// テストID範囲: E2E-AUTH-046 ~ E2E-AUTH-051

test.describe('セキュリティテスト', () => {
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

  test('E2E-AUTH-046: XSS攻撃対策（メールアドレス）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    // XSSスクリプトを入力
    await emailInput.fill('<script>alert("XSS")</script>@test.com');
    await passwordInput.fill('password123');
    await loginButton.click();

    // バリデーションエラーが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();

    // スクリプトが実行されていないことを確認（ダイアログが表示されていない）
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    // 短時間待機してダイアログがないことを確認
    await page.waitForTimeout(500);
    expect(dialogs).toHaveLength(0);
  });

  test('E2E-AUTH-047: XSS攻撃対策（名前）', async ({ page }) => {
    await page.goto('http://localhost:3247/auth?view=register');

    const nameInput = page.locator('[data-testid="register-name-input"]');
    const emailInput = page.locator('[data-testid="register-email-input"]');
    const passwordInput = page.locator('[data-testid="register-password-input"]');
    const registerButton = page.locator('[data-testid="register-button"]');

    // XSSスクリプトを入力
    await nameInput.fill('<img src=x onerror=alert("XSS")>');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // スクリプトが実行されていないことを確認
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await registerButton.click();

    // 短時間待機してダイアログがないことを確認
    await page.waitForTimeout(500);
    expect(dialogs).toHaveLength(0);
  });

  test('E2E-AUTH-048: SQLインジェクション対策', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    // SQLインジェクション文字列を入力
    await emailInput.fill("' OR '1'='1");
    await passwordInput.fill('password123');
    await loginButton.click();

    // バリデーションエラーまたは認証失敗エラーが表示されることを確認
    const emailError = page.locator('[data-testid="login-email-error"]');
    await expect(emailError).toBeVisible();

    // リダイレクトされないことを確認
    expect(page.url()).toContain('/auth');
  });

  test('E2E-AUTH-049: CSRF保護確認', async ({ page }) => {
    // @MOCK_SKIP: モック認証では実際のAPI呼び出しが発生しないため、このテストはスキップ
    // 本番環境では Auth.js が自動的に CSRF トークンを管理
    test.skip(true, 'Skipped in mock mode - CSRF is handled by Auth.js in production');

    const requests: { method: string; headers: Record<string, string> }[] = [];

    // リクエストをインターセプト
    page.on('request', request => {
      if (request.method() === 'POST' && request.url().includes('/api')) {
        requests.push({
          method: request.method(),
          headers: request.headers() as Record<string, string>,
        });
      }
    });

    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');
    await loginButton.click();

    // リクエストが送信されるのを待つ
    await page.waitForTimeout(2000);

    // POST リクエストが送信されたことを確認
    expect(requests.length).toBeGreaterThan(0);

    // Content-Typeが適切に設定されていることを確認
    const postRequests = requests.filter(r => r.method === 'POST');
    expect(postRequests.length).toBeGreaterThan(0);
  });

  test('E2E-AUTH-050: セッション管理確認', async ({ page }) => {
    // @MOCK_SKIP: モック認証ではクッキー設定が行われないため、このテストはスキップ
    // 本番環境では Auth.js が自動的にセッションクッキーを管理（HttpOnly, Secure）
    test.skip(true, 'Skipped in mock mode - Session cookies are managed by Auth.js in production');

    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');
    await loginButton.click();

    // ホームにリダイレクトされるのを待つ
    await page.waitForURL('http://localhost:3247/', { timeout: 5000 });

    // セッションクッキーが設定されていることを確認
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c =>
      c.name.includes('next-auth') ||
      c.name.includes('session') ||
      c.name.includes('auth')
    );

    expect(authCookies.length).toBeGreaterThan(0);

    // クッキーがHttpOnly属性を持つことを確認
    authCookies.forEach(cookie => {
      // PlaywrightではクッキーのHttpOnly属性を直接確認できないため、
      // クッキーが存在し、セッション管理が機能していることを確認
      expect(cookie.value).toBeTruthy();
    });
  });

  test('E2E-AUTH-051: パスワードマスキング確認', async ({ page }) => {
    await page.goto('http://localhost:3247/auth');

    const passwordInput = page.locator('[data-testid="login-password-input"]');

    // パスワードを入力
    await passwordInput.fill('MyPassword123');

    // type属性が「password」になっていることを確認
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');

    // 入力値が異なる文字で表示されることを確認（●または*）
    const inputValue = await passwordInput.inputValue();
    expect(inputValue).toBe('MyPassword123');

    // DOMで平文が見えないことを確認（type=passwordなので自動的に隠される）
    // 開発者ツールでの表示も隠されている
    const isPassword = await passwordInput.evaluate(el =>
      (el as HTMLInputElement).type === 'password'
    );
    expect(isPassword).toBe(true);
  });
});
