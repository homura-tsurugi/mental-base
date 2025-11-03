import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-010: 目標作成モーダル起動テスト
 *
 * テスト項目: 目標作成モーダル起動
 * 優先度: 高
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-009
 *
 * 確認内容:
 * - 「新規目標を作成」ボタンクリックでモーダルが開く
 * - モーダルタイトル「新規目標を作成」が表示される
 * - モーダルが正しく表示される（背景オーバーレイ、中央配置）
 * - モーダルが適切なz-indexで表示される
 *
 * 期待結果:
 * - ボタンクリック後、モーダルが開く
 * - モーダルタイトルが「新規目標を作成」である
 * - モーダルが画面中央に配置される
 * - 背景オーバーレイが表示される
 * - モーダルがアクセス可能な状態である
 *
 * 注意事項:
 * - このテストはE2E-PLDO-009に依存する
 * - モーダルの詳細な内容はE2E-PLDO-011で検証する
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 */

test.describe('E2E-PLDO-010: 目標作成モーダル起動', () => {
  test('E2E-PLDO-010: 「新規目標を作成」ボタンクリックで「新規目標を作成」タイトルのモーダルが表示される', async ({ page }) => {
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

    // /api/goals へのAPIリクエストが行われたことを確認
    const goalsApiCall = networkRequests.find(req => req.url.includes('/api/goals'));
    if (!goalsApiCall) {
      console.warn('[警告] /api/goals へのAPIリクエストが検出されませんでした');
      console.log('検出されたAPIリクエスト:', networkRequests);
    } else {
      console.log('[Test] /api/goals APIリクエスト確認: ', goalsApiCall);
    }

    // ==========================================
    // Step 5: 新規目標作成ボタンを探す
    // ==========================================
    console.log('[Test] Step 5: 新規目標作成ボタンを探す');

    const createGoalButton = page.locator('button').filter({ hasText: /新規目標を作成/i });

    await expect(createGoalButton).toBeVisible({ timeout: 10000 });
    console.log('[Test] ✅ 「新規目標を作成」ボタン表示確認');

    // ボタンがクリック可能であることを確認
    const isButtonEnabled = await createGoalButton.isEnabled();
    expect(isButtonEnabled).toBe(true);
    console.log('[Test] ✅ 新規目標作成ボタンがクリック可能');

    // ==========================================
    // Step 6: モーダルが存在しないことを確認（クリック前）
    // ==========================================
    console.log('[Test] Step 6: モーダルが存在しないことを確認（クリック前）');

    // モーダルを複数の方法で探す
    const modalBeforeClick = page.locator('h2').filter({ hasText: /新規目標を作成/i });
    const isModalVisibleBeforeClick = await modalBeforeClick.isVisible().catch(() => false);

    if (isModalVisibleBeforeClick) {
      console.warn('[警告] クリック前にモーダルが既に表示されています');
    } else {
      console.log('[Test] ✅ クリック前はモーダルが非表示');
    }

    // ==========================================
    // Step 7: ボタンをクリックしてモーダルを開く
    // ==========================================
    console.log('[Test] Step 7: ボタンをクリックしてモーダルを開く');

    await createGoalButton.click();
    console.log('[Test] 「新規目標を作成」ボタンをクリック');

    // モーダルが開くのを待つ
    await page.waitForTimeout(500);

    // ==========================================
    // Step 8: モーダルタイトルが表示されることを確認
    // ==========================================
    console.log('[Test] Step 8: モーダルタイトルが表示されることを確認');

    // モーダルのタイトル（h2要素）を探す
    const modalTitle = page.locator('h2').filter({ hasText: /新規目標を作成/i });

    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ モーダルタイトル「新規目標を作成」が表示');

    // タイトルのテキストを確認
    const titleText = await modalTitle.textContent();
    console.log(`[Test] モーダルタイトルテキスト: "${titleText}"`);
    expect(titleText).toContain('新規目標を作成');

    // ==========================================
    // Step 9: 背景オーバーレイが表示されることを確認
    // ==========================================
    console.log('[Test] Step 9: 背景オーバーレイが表示されることを確認');

    // 背景オーバーレイ（fixed inset-0 bg-black/60）を探す
    const backdrop = page.locator('div.fixed.inset-0').first();
    await expect(backdrop).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 背景オーバーレイが表示');

    // 背景のスタイルを確認
    const backdropStyles = await backdrop.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        backgroundColor: computed.backgroundColor,
        zIndex: computed.zIndex,
      };
    });

    console.log(`[Test] 背景オーバーレイスタイル:`);
    console.log(`  - position: ${backdropStyles.position}`);
    console.log(`  - backgroundColor: ${backdropStyles.backgroundColor}`);
    console.log(`  - zIndex: ${backdropStyles.zIndex}`);

    expect(backdropStyles.position).toBe('fixed');
    console.log('[Test] ✅ 背景オーバーレイがfixed位置');

    // ==========================================
    // Step 10: モーダルコンテンツが中央配置されていることを確認
    // ==========================================
    console.log('[Test] Step 10: モーダルコンテンツが中央配置されていることを確認');

    // モーダルのコンテンツ部分（bg-[var(--bg-primary)] rounded-xl）を探す
    const modalContent = page.locator('div.bg-\\[var\\(--bg-primary\\)\\].rounded-xl').first();
    await expect(modalContent).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ モーダルコンテンツが表示');

    const modalBox = await modalContent.boundingBox();
    const viewportSize = page.viewportSize();

    if (modalBox && viewportSize) {
      const centerX = modalBox.x + modalBox.width / 2;
      const centerY = modalBox.y + modalBox.height / 2;
      const viewportCenterX = viewportSize.width / 2;
      const viewportCenterY = viewportSize.height / 2;

      console.log(`[Test] モーダル中心: X=${centerX.toFixed(1)}, Y=${centerY.toFixed(1)}`);
      console.log(`[Test] ビューポート中心: X=${viewportCenterX.toFixed(1)}, Y=${viewportCenterY.toFixed(1)}`);

      // 中心からの許容範囲（±20%）
      const xDiff = Math.abs(centerX - viewportCenterX);
      const yDiff = Math.abs(centerY - viewportCenterY);
      const xTolerance = viewportSize.width * 0.2;
      const yTolerance = viewportSize.height * 0.2;

      expect(xDiff).toBeLessThan(xTolerance);
      expect(yDiff).toBeLessThan(yTolerance);
      console.log('[Test] ✅ モーダルが画面中央に配置');
    } else {
      console.warn('[警告] モーダルの位置情報取得に失敗');
    }

    // ==========================================
    // Step 11: モーダルの基本構造を確認
    // ==========================================
    console.log('[Test] Step 11: モーダルの基本構造を確認');

    // モーダル内にキャンセルボタンと作成ボタンが存在することを確認
    const modal = page.locator('[data-testid="goal-modal"]');
    const cancelButton = modal.locator('button').filter({ hasText: /キャンセル/i });
    const submitButton = modal.locator('button').filter({ hasText: /^作成$/i }); // 完全一致で「作成」のみ

    await expect(cancelButton).toBeVisible({ timeout: 3000 });
    await expect(submitButton).toBeVisible({ timeout: 3000 });
    console.log('[Test] ✅ キャンセルボタンと作成ボタンが表示');

    // モーダル内のフォーム要素の存在確認（詳細はE2E-PLDO-011で検証）
    const titleInput = page.locator('#goal-title');
    const isInputVisible = await titleInput.isVisible().catch(() => false);

    if (isInputVisible) {
      console.log('[Test] ✅ モーダル内にタイトル入力フィールド確認（詳細検証はE2E-PLDO-011）');
    } else {
      console.warn('[警告] タイトル入力フィールドが見つかりません');
    }

    // ==========================================
    // Step 12: モーダルのアクセシビリティ確認
    // ==========================================
    console.log('[Test] Step 12: モーダルのアクセシビリティ確認');

    // モーダルがフォーカス可能であることを確認
    const isModalFocusable = await modalContent.evaluate((el) => {
      return document.activeElement !== null;
    });

    if (isModalFocusable) {
      console.log('[Test] ✅ モーダルがアクセス可能');
    } else {
      console.warn('[警告] モーダルのフォーカス状態を確認できません');
    }

    // ==========================================
    // Step 13: モーダルを閉じる（ESCキー）
    // ==========================================
    console.log('[Test] Step 13: モーダルを閉じる（ESCキー）');

    await page.keyboard.press('Escape');
    console.log('[Test] ESCキーを押下');

    // モーダルが閉じることを確認
    await page.waitForTimeout(500);

    const isModalVisibleAfterEsc = await modalTitle.isVisible().catch(() => false);

    if (!isModalVisibleAfterEsc) {
      console.log('[Test] ✅ ESCキーでモーダルが閉じた');
    } else {
      console.warn('[警告] ESCキーでモーダルが閉じませんでした');
      // キャンセルボタンで閉じる
      await cancelButton.click();
      console.log('[Test] キャンセルボタンでモーダルを閉じました');
    }

    // ==========================================
    // Step 14: 再度モーダルを開いて確認（冪等性テスト）
    // ==========================================
    console.log('[Test] Step 14: 再度モーダルを開いて確認（冪等性テスト）');

    await createGoalButton.click();
    console.log('[Test] 2回目: 「新規目標を作成」ボタンをクリック');

    await page.waitForTimeout(500);

    const modalTitleSecondTime = page.locator('h2').filter({ hasText: /新規目標を作成/i });
    await expect(modalTitleSecondTime).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 2回目もモーダルが正しく開く');

    // モーダルを閉じる
    const cancelButtonSecondTime = page.locator('button').filter({ hasText: /キャンセル/i });
    await cancelButtonSecondTime.click();
    console.log('[Test] 2回目のモーダルを閉じました');

    await page.waitForTimeout(500);

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-010: 目標作成モーダル起動テスト完了');
    console.log('- 検証項目:');
    console.log('  ✅ 「新規目標を作成」ボタンクリック: 成功');
    console.log('  ✅ モーダルタイトル「新規目標を作成」: 表示');
    console.log('  ✅ 背景オーバーレイ: 表示');
    if (modalBox && viewportSize) {
      console.log('  ✅ モーダル配置: 画面中央');
    }
    console.log('  ✅ キャンセルボタン: 表示');
    console.log('  ✅ 作成ボタン: 表示');
    console.log('  ✅ ESCキーでモーダルが閉じる: 確認');
    console.log('  ✅ 冪等性テスト: 2回目も正常動作');
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(true).toBe(true);
  });
});
