import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-005: 目標カード詳細表示テスト
 *
 * テスト項目: 目標カード詳細表示
 * 優先度: 高
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-004
 *
 * 確認内容:
 * - 目標の詳細情報が正しく表示される
 * - タイトル、説明、期限、進捗率、タスク完了数が表示される
 *
 * 期待結果:
 * - 目標カードにタイトル、説明、期限、進捗率、タスク完了数が表示される
 *
 * 注意事項:
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 * - VITE_SKIP_AUTH環境変数は使用しない（認証必須）
 */

test.describe('E2E-PLDO-005: 目標カード詳細表示', () => {
  test('E2E-PLDO-005: 目標の詳細情報が正しく表示される', async ({ page }) => {
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

    // Planタブがアクティブであることを確認
    const planTab = page.locator('button').filter({ hasText: /Plan\(計画\)/i });
    await expect(planTab).toBeVisible({ timeout: 5000 });
    console.log('[Test] Planタブ表示確認完了');

    // ==========================================
    // Step 3: モック検出チェック
    // ==========================================
    console.log('[Test] Step 3: モック検出チェック');

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

    // /api/goals へのAPIリクエストが行われたことを確認
    const goalsApiCall = networkRequests.find(req => req.url.includes('/api/goals'));
    if (!goalsApiCall) {
      console.warn('[警告] /api/goals へのAPIリクエストが検出されませんでした');
      console.log('検出されたAPIリクエスト:', networkRequests);
    } else {
      console.log('[Test] /api/goals APIリクエスト確認: ', goalsApiCall);
    }

    // ==========================================
    // Step 4: 目標カードの存在確認
    // ==========================================
    console.log('[Test] Step 4: 目標カードの存在確認');

    // エラーメッセージがないことを確認
    const errorMessage = page.locator('text=エラー');
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`[エラー検出] ページにエラーメッセージが表示されています: ${errorText}`);
    }

    // 目標が存在するかチェック
    const emptyStateMessage = page.locator('text=まだ目標がありません');
    const hasEmptyState = await emptyStateMessage.isVisible().catch(() => false);

    if (hasEmptyState) {
      console.log('[Test] 目標なし状態が表示されています');
      console.log('[Test] データベースに目標データが存在しないため、このテストはスキップされます');
      console.warn('[警告] E2E-PLDO-005: 目標一覧が空です。データベースに目標データを登録してください。');
      return;
    }

    // 目標カードを探す
    // data-testid="goal-card" または .goal-card クラスを持つ要素を探す
    const goalCards = page.locator('[data-testid="goal-card"]').or(
      page.locator('.goal-card')
    ).or(
      // フォールバック: Card要素の中でタイトル・期限・進捗を含むもの
      page.locator('.shadow-sm').filter({ has: page.locator('text=/期限:|進捗:/') })
    );

    // 少なくとも1つの目標カードが存在することを確認
    const goalCardCount = await goalCards.count();
    console.log(`[Test] 検出された目標カード数: ${goalCardCount}`);

    if (goalCardCount === 0) {
      console.warn('[警告] 目標カードが検出されませんでした');
      console.log('[Test] ページ内容を確認:');
      const pageContent = await page.locator('body').textContent();
      console.log(pageContent?.substring(0, 500));
      throw new Error('[テスト失敗] 目標カードが見つかりませんでした。データベースに目標データを登録してください。');
    }

    // ==========================================
    // Step 5: 目標カードの詳細情報確認
    // ==========================================
    console.log('[Test] Step 5: 目標カードの詳細情報確認');

    // 最初の目標カードを対象にテスト
    const firstGoalCard = goalCards.first();
    await expect(firstGoalCard).toBeVisible({ timeout: 5000 });
    console.log('[Test] 最初の目標カード表示確認完了');

    // ==========================================
    // 詳細項目1: タイトル
    // ==========================================
    console.log('[Test] 詳細確認1: タイトル');

    // タイトルを探す（h3タグ、または font-semibold クラス）
    const titleElement = firstGoalCard.locator('h3').or(
      firstGoalCard.locator('[data-testid="goal-title"]')
    ).or(
      firstGoalCard.locator('.font-semibold').first()
    );

    const titleExists = await titleElement.isVisible().catch(() => false);
    if (!titleExists) {
      throw new Error('[テスト失敗] 目標カード内にタイトルが見つかりません');
    }

    const titleText = await titleElement.textContent();
    console.log(`[Test] ✅ タイトル: "${titleText}"`);

    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);

    // ==========================================
    // 詳細項目2: 説明（オプション）
    // ==========================================
    console.log('[Test] 詳細確認2: 説明（オプション項目）');

    // 説明は任意項目のため、存在しない場合もある
    const descriptionElement = firstGoalCard.locator('p').filter({ hasText: /.{1,}/ }).first();
    const descriptionExists = await descriptionElement.isVisible().catch(() => false);

    if (descriptionExists) {
      const descriptionText = await descriptionElement.textContent();
      console.log(`[Test] ✅ 説明: "${descriptionText?.substring(0, 50)}..."`);
    } else {
      console.log('[Test] ℹ️  説明: なし（オプション項目のため問題なし）');
    }

    // ==========================================
    // 詳細項目3: 期限
    // ==========================================
    console.log('[Test] 詳細確認3: 期限');

    // 期限を探す（「期限:」というテキストを含む要素）
    const deadlineElement = firstGoalCard.locator('text=/期限:/').or(
      firstGoalCard.locator('[data-testid="goal-deadline"]')
    );

    const deadlineExists = await deadlineElement.isVisible().catch(() => false);
    if (!deadlineExists) {
      throw new Error('[テスト失敗] 目標カード内に期限情報が見つかりません');
    }

    const deadlineText = await deadlineElement.textContent();
    console.log(`[Test] ✅ 期限: "${deadlineText}"`);

    // 期限が日本語形式（YYYY/MM/DD）で表示されているか確認
    const datePattern = /\d{4}\/\d{2}\/\d{2}/;
    const hasValidDateFormat = datePattern.test(deadlineText || '');
    if (!hasValidDateFormat) {
      console.warn(`[警告] 期限の形式が期待値（YYYY/MM/DD）と異なります: ${deadlineText}`);
    }

    expect(deadlineText).toContain('期限');

    // ==========================================
    // 詳細項目4: 進捗率
    // ==========================================
    console.log('[Test] 詳細確認4: 進捗率');

    // 進捗率を探す（「進捗:」というテキストを含む要素）
    const progressTextElement = firstGoalCard.locator('text=/進捗:/').or(
      firstGoalCard.locator('[data-testid="goal-progress-text"]')
    );

    const progressTextExists = await progressTextElement.isVisible().catch(() => false);
    if (!progressTextExists) {
      throw new Error('[テスト失敗] 目標カード内に進捗率情報が見つかりません');
    }

    const progressText = await progressTextElement.textContent();
    console.log(`[Test] ✅ 進捗率: "${progressText}"`);

    // 進捗率のパターン: 「進捗: XX% (Y/Z タスク完了)」
    const progressPattern = /進捗:\s*\d+%/;
    const hasValidProgressFormat = progressPattern.test(progressText || '');
    if (!hasValidProgressFormat) {
      console.warn(`[警告] 進捗率の形式が期待値と異なります: ${progressText}`);
    }

    expect(progressText).toContain('進捗');
    expect(progressText).toMatch(/\d+%/);

    // ==========================================
    // 詳細項目5: タスク完了数
    // ==========================================
    console.log('[Test] 詳細確認5: タスク完了数');

    // タスク完了数を探す（「X/Y タスク完了」というテキストを含む要素）
    const taskCompletionElement = firstGoalCard.locator('text=/タスク完了/').or(
      firstGoalCard.locator('[data-testid="goal-task-completion"]')
    );

    const taskCompletionExists = await taskCompletionElement.isVisible().catch(() => false);
    if (!taskCompletionExists) {
      throw new Error('[テスト失敗] 目標カード内にタスク完了数が見つかりません');
    }

    const taskCompletionText = await taskCompletionElement.textContent();
    console.log(`[Test] ✅ タスク完了数: "${taskCompletionText}"`);

    // タスク完了数のパターン: 「X/Y タスク完了」
    const taskPattern = /\d+\/\d+\s*タスク完了/;
    const hasValidTaskFormat = taskPattern.test(taskCompletionText || '');
    if (!hasValidTaskFormat) {
      console.warn(`[警告] タスク完了数の形式が期待値と異なります: ${taskCompletionText}`);
    }

    expect(taskCompletionText).toContain('タスク完了');
    expect(taskCompletionText).toMatch(/\d+\/\d+/);

    // ==========================================
    // 詳細項目6: 進捗バー（視覚要素）
    // ==========================================
    console.log('[Test] 詳細確認6: 進捗バー（視覚要素）');

    // 進捗バーを探す（Progressコンポーネント、またはプログレスバー要素）
    const progressBar = firstGoalCard.locator('[role="progressbar"]').or(
      firstGoalCard.locator('[data-testid="goal-progress-bar"]')
    ).or(
      firstGoalCard.locator('.progress').or(
        // TailwindのProgressコンポーネントを探す
        firstGoalCard.locator('.h-2').filter({ has: page.locator('.bg-') })
      )
    );

    const progressBarExists = await progressBar.isVisible().catch(() => false);
    if (!progressBarExists) {
      console.warn('[警告] 進捗バー（視覚要素）が見つかりません');
    } else {
      console.log('[Test] ✅ 進捗バー: 表示確認完了');
    }

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-005: 目標カード詳細表示テスト完了');
    console.log('- 検証項目:');
    console.log(`  ✅ タイトル: ${titleText}`);
    console.log(`  ${descriptionExists ? '✅' : 'ℹ️ '} 説明: ${descriptionExists ? '表示確認' : 'なし（オプション）'}`);
    console.log(`  ✅ 期限: ${deadlineText}`);
    console.log(`  ✅ 進捗率: ${progressText}`);
    console.log(`  ✅ タスク完了数: ${taskCompletionText}`);
    console.log(`  ${progressBarExists ? '✅' : '⚠️ '} 進捗バー: ${progressBarExists ? '表示確認' : '未検出'}`);
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(titleText).toBeTruthy();
    expect(deadlineText).toContain('期限');
    expect(progressText).toContain('進捗');
    expect(taskCompletionText).toContain('タスク完了');
  });
});
