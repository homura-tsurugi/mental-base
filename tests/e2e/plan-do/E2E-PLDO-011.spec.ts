import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-011: 目標作成フォーム表示テスト
 *
 * テスト項目: 目標作成フォーム表示
 * 優先度: 高
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-010
 *
 * 確認内容:
 * - モーダル内にタイトル入力フィールドが表示される
 * - モーダル内に説明入力フィールドが表示される
 * - モーダル内に期限選択フィールドが表示される
 * - 各フィールドに適切なラベルが設定されている
 * - 各フィールドに適切なプレースホルダーが設定されている
 *
 * 期待結果:
 * - タイトル入力フィールド（#goal-title）が表示される
 * - 説明入力フィールド（#goal-description）が表示される
 * - 期限選択フィールド（#goal-deadline）が表示される
 * - タイトルラベル「目標タイトル」が表示される
 * - 説明ラベル「説明」が表示される
 * - 期限ラベル「期限」が表示される
 * - タイトルプレースホルダー「例: 英語力を向上させる」が表示される
 * - 説明プレースホルダー「目標の詳細を入力...」が表示される
 *
 * 注意事項:
 * - このテストはE2E-PLDO-010に依存する
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 */

test.describe('E2E-PLDO-011: 目標作成フォーム表示', () => {
  test('E2E-PLDO-011: モーダル内にタイトル入力、説明入力、期限選択フィールドが表示される', async ({ page }) => {
    // ==========================================
    // Step 1: ログイン処理
    // ==========================================
    console.log('[Test] Step 1: ログイン処理開始');

    // コンソールログを監視
    const consoleLogs: Array<{type: string, text: string}> = [];
    page.on('console', (msg) => {
      const logEntry = { type: msg.type(), text: msg.text() };
      consoleLogs.push(logEntry);
      console.log(`[Browser Console] ${logEntry.type}: ${logEntry.text}`);
    });

    // ネットワークリクエストを監視
    const networkRequests: Array<{method: string, url: string}> = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        const entry = { method: request.method(), url: request.url() };
        networkRequests.push(entry);
        console.log(`[API Request] ${entry.method} ${entry.url}`);
      }
    });

    // ネットワークレスポンスを監視
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log(`[API Response] ${response.status()} ${response.url()}`);
        if (!response.ok()) {
          try {
            const body = await response.text();
            console.log(`[API Error Body] ${body}`);
          } catch (e) {
            console.log('[API Error] Could not read response body');
          }
        }
      }
    });

    // ログインページにアクセス
    await page.goto('http://localhost:3247/auth');

    // ログイン処理
    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');
    await loginButton.click();

    // ホームページへのリダイレクトを待機
    await page.waitForURL('http://localhost:3247/', { timeout: 10000 });
    console.log('[Test] ログイン成功、ホームページにリダイレクト完了');

    // ==========================================
    // Step 2: Plan-Doページへ移動
    // ==========================================
    console.log('[Test] Step 2: Plan-Doページへ移動');

    await page.goto('http://localhost:3247/plan-do');

    // ページの読み込み完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('[Test] ネットワークアイドル待機タイムアウト（10秒）');
    });

    // ローディングが完了するのを待つ
    const loadingSpinner = page.locator('text=読み込み中');
    const isLoadingVisible = await loadingSpinner.isVisible().catch(() => false);
    if (isLoadingVisible) {
      console.log('[Test] ローディング中... 完了を待機');
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch((e) => {
        console.log(`[Test] ローディング非表示待機失敗: ${e.message}`);
      });
    }

    // ==========================================
    // Step 3: Planタブがアクティブであることを確認
    // ==========================================
    console.log('[Test] Step 3: Planタブがアクティブであることを確認');

    const planTab = page.locator('button').filter({ hasText: /Plan\(計画\)/i });
    await expect(planTab).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ Planタブ表示確認完了');

    // Planタブがアクティブであることを確認（青色背景）
    const planTabClasses = await planTab.getAttribute('class');
    console.log(`[Test] Planタブのクラス: ${planTabClasses}`);

    // アクティブクラスが含まれているか確認
    const isPlanTabActive = planTabClasses?.includes('bg-[var(--primary)]') ||
                            planTabClasses?.includes('text-white');

    if (!isPlanTabActive) {
      console.warn('[警告] Planタブがアクティブでない可能性があります。クリックしてアクティブ化します。');
      await planTab.click();
      await page.waitForTimeout(500); // 状態変更を待つ
    }

    console.log('[Test] ✅ Planタブがアクティブ状態');

    // ==========================================
    // Step 4: モック検出チェック
    // ==========================================
    console.log('[Test] Step 4: モック検出チェック');

    // URLにモック識別子がないか確認
    const currentUrl = page.url();
    if (currentUrl.includes('mock') || currentUrl.includes('stub')) {
      throw new Error(`[モック検出] URLにモック識別子が含まれています: ${currentUrl}`);
    }

    // コンソールログにモック識別子がないか確認
    const mockInConsole = consoleLogs.find(log =>
      log.text.toLowerCase().includes('mock') ||
      log.text.toLowerCase().includes('stub') ||
      log.text.toLowerCase().includes('fake')
    );
    if (mockInConsole) {
      throw new Error(`[モック検出] コンソールログにモック識別子: ${mockInConsole.text}`);
    }

    console.log('[Test] ✅ モック検出なし');

    // ==========================================
    // Step 5: 新規目標作成ボタンをクリックしてモーダルを開く
    // ==========================================
    console.log('[Test] Step 5: 新規目標作成ボタンをクリックしてモーダルを開く');

    const createGoalButton = page.locator('button').filter({ hasText: /新規目標を作成/i });

    await expect(createGoalButton).toBeVisible({ timeout: 10000 });
    console.log('[Test] ✅ 「新規目標を作成」ボタン表示確認');

    await createGoalButton.click();
    console.log('[Test] 「新規目標を作成」ボタンをクリック');

    // モーダルが開くのを待つ
    await page.waitForTimeout(500);

    // モーダルタイトルが表示されることを確認
    const modalTitle = page.locator('h2').filter({ hasText: /新規目標を作成/i });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ モーダルタイトル「新規目標を作成」が表示');

    // ==========================================
    // Step 6: タイトル入力フィールドの確認
    // ==========================================
    console.log('[Test] Step 6: タイトル入力フィールドの確認');

    const titleInput = page.locator('#goal-title');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ タイトル入力フィールド（#goal-title）が表示');

    // タイトルラベルの確認
    const titleLabel = page.locator('label[for="goal-title"]');
    await expect(titleLabel).toBeVisible({ timeout: 3000 });
    const titleLabelText = await titleLabel.textContent();
    console.log(`[Test] タイトルラベルテキスト: "${titleLabelText}"`);
    expect(titleLabelText).toContain('目標タイトル');
    console.log('[Test] ✅ タイトルラベル「目標タイトル」が表示');

    // タイトルプレースホルダーの確認
    const titlePlaceholder = await titleInput.getAttribute('placeholder');
    console.log(`[Test] タイトルプレースホルダー: "${titlePlaceholder}"`);
    expect(titlePlaceholder).toContain('例: 英語力を向上させる');
    console.log('[Test] ✅ タイトルプレースホルダー「例: 英語力を向上させる」が設定');

    // タイトル入力フィールドの属性確認
    const titleType = await titleInput.getAttribute('type');
    console.log(`[Test] タイトルフィールドtype: "${titleType}"`);

    const isTitleEnabled = await titleInput.isEnabled();
    expect(isTitleEnabled).toBe(true);
    console.log('[Test] ✅ タイトル入力フィールドが入力可能');

    // ==========================================
    // Step 7: 説明入力フィールドの確認
    // ==========================================
    console.log('[Test] Step 7: 説明入力フィールドの確認');

    const descriptionInput = page.locator('#goal-description');
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 説明入力フィールド（#goal-description）が表示');

    // 説明ラベルの確認
    const descriptionLabel = page.locator('label[for="goal-description"]');
    await expect(descriptionLabel).toBeVisible({ timeout: 3000 });
    const descriptionLabelText = await descriptionLabel.textContent();
    console.log(`[Test] 説明ラベルテキスト: "${descriptionLabelText}"`);
    expect(descriptionLabelText).toContain('説明');
    console.log('[Test] ✅ 説明ラベル「説明」が表示');

    // 説明プレースホルダーの確認
    const descriptionPlaceholder = await descriptionInput.getAttribute('placeholder');
    console.log(`[Test] 説明プレースホルダー: "${descriptionPlaceholder}"`);
    expect(descriptionPlaceholder).toContain('目標の詳細を入力');
    console.log('[Test] ✅ 説明プレースホルダー「目標の詳細を入力...」が設定');

    // 説明入力フィールドがtextareaであることを確認
    const descriptionTagName = await descriptionInput.evaluate((el) => el.tagName.toLowerCase());
    console.log(`[Test] 説明フィールドタグ名: "${descriptionTagName}"`);
    expect(descriptionTagName).toBe('textarea');
    console.log('[Test] ✅ 説明入力フィールドがtextarea要素');

    const isDescriptionEnabled = await descriptionInput.isEnabled();
    expect(isDescriptionEnabled).toBe(true);
    console.log('[Test] ✅ 説明入力フィールドが入力可能');

    // ==========================================
    // Step 8: 期限選択フィールドの確認
    // ==========================================
    console.log('[Test] Step 8: 期限選択フィールドの確認');

    const deadlineInput = page.locator('#goal-deadline');
    await expect(deadlineInput).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 期限選択フィールド（#goal-deadline）が表示');

    // 期限ラベルの確認
    const deadlineLabel = page.locator('label[for="goal-deadline"]');
    await expect(deadlineLabel).toBeVisible({ timeout: 3000 });
    const deadlineLabelText = await deadlineLabel.textContent();
    console.log(`[Test] 期限ラベルテキスト: "${deadlineLabelText}"`);
    expect(deadlineLabelText).toContain('期限');
    console.log('[Test] ✅ 期限ラベル「期限」が表示');

    // 期限フィールドの型がdateであることを確認
    const deadlineType = await deadlineInput.getAttribute('type');
    console.log(`[Test] 期限フィールドtype: "${deadlineType}"`);
    expect(deadlineType).toBe('date');
    console.log('[Test] ✅ 期限フィールドがdate型');

    const isDeadlineEnabled = await deadlineInput.isEnabled();
    expect(isDeadlineEnabled).toBe(true);
    console.log('[Test] ✅ 期限選択フィールドが入力可能');

    // ==========================================
    // Step 9: フォーム要素のレイアウト確認
    // ==========================================
    console.log('[Test] Step 9: フォーム要素のレイアウト確認');

    // 各要素の位置関係を確認
    const titleBox = await titleInput.boundingBox();
    const descriptionBox = await descriptionInput.boundingBox();
    const deadlineBox = await deadlineInput.boundingBox();

    if (titleBox && descriptionBox && deadlineBox) {
      console.log(`[Test] タイトルフィールド位置: Y=${titleBox.y.toFixed(1)}`);
      console.log(`[Test] 説明フィールド位置: Y=${descriptionBox.y.toFixed(1)}`);
      console.log(`[Test] 期限フィールド位置: Y=${deadlineBox.y.toFixed(1)}`);

      // フィールドが上から順に配置されていることを確認
      expect(titleBox.y).toBeLessThan(descriptionBox.y);
      expect(descriptionBox.y).toBeLessThan(deadlineBox.y);
      console.log('[Test] ✅ フィールドが上から順に配置（タイトル → 説明 → 期限）');
    } else {
      console.warn('[警告] フィールドの位置情報取得に失敗');
    }

    // ==========================================
    // Step 10: フィールドの初期値確認
    // ==========================================
    console.log('[Test] Step 10: フィールドの初期値確認');

    // タイトル初期値が空であることを確認
    const titleInitialValue = await titleInput.inputValue();
    console.log(`[Test] タイトル初期値: "${titleInitialValue}"`);
    expect(titleInitialValue).toBe('');
    console.log('[Test] ✅ タイトル初期値が空');

    // 説明初期値が空であることを確認
    const descriptionInitialValue = await descriptionInput.inputValue();
    console.log(`[Test] 説明初期値: "${descriptionInitialValue}"`);
    expect(descriptionInitialValue).toBe('');
    console.log('[Test] ✅ 説明初期値が空');

    // 期限初期値が空であることを確認
    const deadlineInitialValue = await deadlineInput.inputValue();
    console.log(`[Test] 期限初期値: "${deadlineInitialValue}"`);
    expect(deadlineInitialValue).toBe('');
    console.log('[Test] ✅ 期限初期値が空');

    // ==========================================
    // Step 11: フィールドへの入力テスト（動作確認）
    // ==========================================
    console.log('[Test] Step 11: フィールドへの入力テスト（動作確認）');

    // タイトル入力
    await titleInput.fill('テスト目標タイトル');
    const titleValue = await titleInput.inputValue();
    console.log(`[Test] タイトル入力後の値: "${titleValue}"`);
    expect(titleValue).toBe('テスト目標タイトル');
    console.log('[Test] ✅ タイトル入力が正常動作');

    // 説明入力
    await descriptionInput.fill('テスト目標の説明文です。');
    const descriptionValue = await descriptionInput.inputValue();
    console.log(`[Test] 説明入力後の値: "${descriptionValue}"`);
    expect(descriptionValue).toBe('テスト目標の説明文です。');
    console.log('[Test] ✅ 説明入力が正常動作');

    // 期限入力
    await deadlineInput.fill('2025-12-31');
    const deadlineValue = await deadlineInput.inputValue();
    console.log(`[Test] 期限入力後の値: "${deadlineValue}"`);
    expect(deadlineValue).toBe('2025-12-31');
    console.log('[Test] ✅ 期限入力が正常動作');

    // ==========================================
    // Step 12: フォームボタンの確認
    // ==========================================
    console.log('[Test] Step 12: フォームボタンの確認');

    // モーダル内のボタンを特定（モーダルコンテンツ内に限定）
    const modalContent = page.locator('div.bg-\\[var\\(--bg-primary\\)\\].rounded-xl').first();
    const cancelButton = modalContent.locator('button').filter({ hasText: /キャンセル/i });
    const submitButton = modalContent.locator('button').filter({ hasText: /作成/i }).or(modalContent.locator('button').filter({ hasText: /更新/i }));

    await expect(cancelButton).toBeVisible({ timeout: 3000 });
    await expect(submitButton).toBeVisible({ timeout: 3000 });
    console.log('[Test] ✅ キャンセルボタンと作成ボタンが表示');

    // 作成ボタンが有効であることを確認（タイトルが入力されているため）
    const isSubmitButtonEnabled = await submitButton.isEnabled();
    expect(isSubmitButtonEnabled).toBe(true);
    console.log('[Test] ✅ 作成ボタンが有効（タイトル入力済み）');

    // ==========================================
    // Step 13: モーダルを閉じる
    // ==========================================
    console.log('[Test] Step 13: モーダルを閉じる');

    await cancelButton.click();
    console.log('[Test] キャンセルボタンをクリック');

    await page.waitForTimeout(500);

    const isModalVisibleAfterClose = await modalTitle.isVisible().catch(() => false);
    expect(isModalVisibleAfterClose).toBe(false);
    console.log('[Test] ✅ モーダルが閉じた');

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-011: 目標作成フォーム表示テスト完了');
    console.log('- 検証項目:');
    console.log('  ✅ モーダルタイトル「新規目標を作成」: 表示');
    console.log('  ✅ タイトル入力フィールド（#goal-title）: 表示');
    console.log('  ✅ タイトルラベル「目標タイトル」: 表示');
    console.log('  ✅ タイトルプレースホルダー「例: 英語力を向上させる」: 設定');
    console.log('  ✅ 説明入力フィールド（#goal-description）: 表示');
    console.log('  ✅ 説明ラベル「説明」: 表示');
    console.log('  ✅ 説明プレースホルダー「目標の詳細を入力...」: 設定');
    console.log('  ✅ 説明フィールドがtextarea要素: 確認');
    console.log('  ✅ 期限選択フィールド（#goal-deadline）: 表示');
    console.log('  ✅ 期限ラベル「期限」: 表示');
    console.log('  ✅ 期限フィールドがdate型: 確認');
    console.log('  ✅ フィールド配置順序（タイトル → 説明 → 期限）: 確認');
    console.log('  ✅ 全フィールドの初期値が空: 確認');
    console.log('  ✅ 全フィールドへの入力動作: 正常');
    console.log('  ✅ キャンセルボタン・作成ボタン: 表示');
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(true).toBe(true);
  });
});
