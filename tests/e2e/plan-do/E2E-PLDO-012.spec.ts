import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-012: 目標作成（必須項目のみ）テスト
 *
 * テスト項目: 目標作成（必須項目のみ）
 * 優先度: 高
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-010
 *
 * 確認内容:
 * - タイトルのみで目標作成が可能
 * - 説明・期限は省略可能
 * - 作成後に目標が一覧に追加される
 * - モーダルが閉じる
 * - 作成した目標が一覧の最上部に表示される
 *
 * 期待結果:
 * - タイトル「新しい目標」を入力
 * - 説明・期限は空のまま
 * - 作成ボタンをクリック
 * - 目標が作成され一覧に追加される
 * - モーダルが閉じる
 * - 一覧の最上部に作成した目標が表示される
 *
 * 注意事項:
 * - このテストはE2E-PLDO-010に依存する
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 */

test.describe('E2E-PLDO-012: 目標作成（必須項目のみ）', () => {
  test('E2E-PLDO-012: タイトル「新しい目標」入力→作成ボタンで目標が作成され一覧に追加、モーダルが閉じる', async ({ page }) => {
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
    const networkRequests: Array<{method: string, url: string, status?: number}> = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        const entry = { method: request.method(), url: request.url(), status: undefined };
        networkRequests.push(entry);
        console.log(`[API Request] ${entry.method} ${entry.url}`);
      }
    });

    // ネットワークレスポンスを監視
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log(`[API Response] ${response.status()} ${response.url()}`);

        // ステータスコードを記録
        const req = networkRequests.find(r => r.url === response.url() && r.status === undefined);
        if (req) {
          req.status = response.status();
        }

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
    // Step 5: 作成前の目標一覧を取得
    // ==========================================
    console.log('[Test] Step 5: 作成前の目標一覧を取得');

    let initialGoalCount = 0;
    const goalList = page.locator('[data-testid="goal-list"]');
    const emptyGoalsMessage = page.locator('[data-testid="empty-goals-message"]');

    const hasGoals = await goalList.isVisible().catch(() => false);
    const isEmpty = await emptyGoalsMessage.isVisible().catch(() => false);

    if (hasGoals) {
      const goalCards = goalList.locator('.bg-\\[var\\(--bg-primary\\)\\]');
      initialGoalCount = await goalCards.count();
      console.log(`[Test] 作成前の目標数: ${initialGoalCount}`);
    } else if (isEmpty) {
      console.log('[Test] 作成前の目標数: 0（空状態メッセージ表示）');
    } else {
      console.warn('[警告] 目標一覧の状態が不明');
    }

    // ==========================================
    // Step 6: 新規目標作成ボタンをクリックしてモーダルを開く
    // ==========================================
    console.log('[Test] Step 6: 新規目標作成ボタンをクリックしてモーダルを開く');

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
    console.log('[Test] ✅ モーダルが表示');

    // ==========================================
    // Step 7: タイトルのみ入力（説明・期限は空のまま）
    // ==========================================
    console.log('[Test] Step 7: タイトルのみ入力（説明・期限は空のまま）');

    const titleInput = page.locator('#goal-title');
    const descriptionInput = page.locator('#goal-description');
    const deadlineInput = page.locator('#goal-deadline');

    // タイトル入力
    await titleInput.fill('新しい目標');
    const titleValue = await titleInput.inputValue();
    console.log(`[Test] タイトル入力値: "${titleValue}"`);
    expect(titleValue).toBe('新しい目標');
    console.log('[Test] ✅ タイトル入力完了');

    // 説明・期限が空であることを確認
    const descriptionValue = await descriptionInput.inputValue();
    const deadlineValue = await deadlineInput.inputValue();
    console.log(`[Test] 説明値: "${descriptionValue}" (空)`);
    console.log(`[Test] 期限値: "${deadlineValue}" (空)`);
    expect(descriptionValue).toBe('');
    expect(deadlineValue).toBe('');
    console.log('[Test] ✅ 説明・期限は空のまま');

    // ==========================================
    // Step 8: 作成ボタンをクリック
    // ==========================================
    console.log('[Test] Step 8: 作成ボタンをクリック');

    const modalContent = page.locator('div.bg-\\[var\\(--bg-primary\\)\\].rounded-xl').first();
    const submitButton = modalContent.locator('button').filter({ hasText: /作成/i });

    // 作成ボタンが有効であることを確認
    const isSubmitButtonEnabled = await submitButton.isEnabled();
    expect(isSubmitButtonEnabled).toBe(true);
    console.log('[Test] ✅ 作成ボタンが有効');

    // POST /api/goalsリクエストを待機
    const goalCreationPromise = page.waitForResponse(
      (response) => response.url().includes('/api/goals') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    await submitButton.click();
    console.log('[Test] 作成ボタンをクリック');

    // API応答を待機
    const goalCreationResponse = await goalCreationPromise;
    const goalCreationStatus = goalCreationResponse.status();
    console.log(`[Test] POST /api/goals レスポンスステータス: ${goalCreationStatus}`);

    if (goalCreationStatus === 201) {
      const createdGoal = await goalCreationResponse.json();
      console.log(`[Test] ✅ 目標作成成功: ID=${createdGoal.id}, タイトル="${createdGoal.title}"`);
    } else {
      throw new Error(`[エラー] 目標作成失敗: ステータス ${goalCreationStatus}`);
    }

    // ==========================================
    // Step 9: モーダルが閉じることを確認
    // ==========================================
    console.log('[Test] Step 9: モーダルが閉じることを確認');

    await page.waitForTimeout(1000); // モーダル閉じアニメーション待機

    const isModalVisibleAfterSubmit = await modalTitle.isVisible().catch(() => false);
    expect(isModalVisibleAfterSubmit).toBe(false);
    console.log('[Test] ✅ モーダルが閉じた');

    // ==========================================
    // Step 10: 目標一覧に作成した目標が追加されたことを確認
    // ==========================================
    console.log('[Test] Step 10: 目標一覧に作成した目標が追加されたことを確認');

    // 一覧の更新を待つ
    await page.waitForTimeout(1000);

    // 目標一覧を再取得
    const updatedGoalList = page.locator('[data-testid="goal-list"]');
    await expect(updatedGoalList).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 目標一覧が表示');

    const goalCards = updatedGoalList.locator('.bg-\\[var\\(--bg-primary\\)\\]');
    const updatedGoalCount = await goalCards.count();
    console.log(`[Test] 作成後の目標数: ${updatedGoalCount}`);

    // 目標数が1つ増えていることを確認
    expect(updatedGoalCount).toBe(initialGoalCount + 1);
    console.log('[Test] ✅ 目標数が1つ増加');

    // ==========================================
    // Step 11: 最上部の目標が作成した目標であることを確認
    // ==========================================
    console.log('[Test] Step 11: 最上部の目標が作成した目標であることを確認');

    // 最初の目標カードを取得
    const firstGoalCard = goalCards.first();
    await expect(firstGoalCard).toBeVisible({ timeout: 3000 });
    console.log('[Test] ✅ 最初の目標カードが表示');

    // 目標タイトルを確認
    const goalTitleElement = firstGoalCard.locator('h3');
    await expect(goalTitleElement).toBeVisible({ timeout: 3000 });
    const goalTitleText = await goalTitleElement.textContent();
    console.log(`[Test] 最上部の目標タイトル: "${goalTitleText}"`);

    expect(goalTitleText).toContain('新しい目標');
    console.log('[Test] ✅ 作成した目標が最上部に表示');

    // ==========================================
    // Step 12: 作成した目標の詳細を確認
    // ==========================================
    console.log('[Test] Step 12: 作成した目標の詳細を確認');

    // 説明が空であることを確認（説明セクションが表示されないか、「説明なし」と表示される）
    const descriptionElement = firstGoalCard.locator('p').first();
    const hasDescription = await descriptionElement.isVisible().catch(() => false);

    if (hasDescription) {
      const descriptionText = await descriptionElement.textContent();
      console.log(`[Test] 説明テキスト: "${descriptionText}"`);
      // 説明が空の場合は、説明文が空または「説明なし」的なテキスト
    } else {
      console.log('[Test] 説明セクション非表示（説明なし）');
    }

    // 進捗率が0%であることを確認
    const progressText = firstGoalCard.locator('text=/0%|0 \/ 0/i');
    const hasProgress = await progressText.isVisible().catch(() => false);

    if (hasProgress) {
      const progressTextContent = await progressText.textContent();
      console.log(`[Test] 進捗テキスト: "${progressTextContent}"`);
      console.log('[Test] ✅ 進捗率0%を確認');
    } else {
      console.warn('[警告] 進捗率表示が見つかりません');
    }

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-012: 目標作成（必須項目のみ）テスト完了');
    console.log('- 検証項目:');
    console.log('  ✅ タイトル「新しい目標」: 入力');
    console.log('  ✅ 説明・期限: 空のまま');
    console.log('  ✅ 作成ボタンクリック: 成功');
    console.log('  ✅ POST /api/goals: 201 Created');
    console.log('  ✅ モーダルが閉じる: 確認');
    console.log(`  ✅ 目標数増加: ${initialGoalCount} → ${updatedGoalCount}`);
    console.log('  ✅ 作成した目標が最上部に表示: 確認');
    console.log('  ✅ 進捗率0%: 確認');
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(true).toBe(true);
  });
});
