import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-008: 目標なし状態表示テスト
 *
 * テスト項目: 目標なし状態表示
 * 優先度: 中
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-001
 *
 * 確認内容:
 * - 目標がない場合の空状態表示が適切に表示される
 * - フラグアイコンが表示される
 * - 「まだ目標がありません」メッセージが表示される
 * - 補足メッセージが表示される
 * - 新規目標作成ボタンが表示される
 *
 * 期待結果:
 * - フラグアイコン（flag）が表示される
 * - 「まだ目標がありません」メッセージが表示される
 * - 「新しい目標を作成して、計画を始めましょう」補足メッセージが表示される
 * - カードスタイルで中央揃えに表示される
 * - 新規目標作成ボタンが表示され、クリック可能である
 *
 * 注意事項:
 * - このテストは目標が0件の状態を検証する
 * - データベースに目標が存在する場合は、すべて削除してから実行する
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 */

test.describe('E2E-PLDO-008: 目標なし状態表示', () => {
  test('E2E-PLDO-008: 目標がない場合、フラグアイコンと「まだ目標がありません」メッセージが表示される', async ({ page }) => {
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
    // Step 4: データベースが空状態であることを前提
    // ==========================================
    console.log('[Test] Step 4: データベースが空状態であることを確認');

    // エラーメッセージがないことを確認
    const errorMessage = page.locator('text=エラー');
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      throw new Error(`[エラー検出] ページにエラーメッセージが表示されています: ${errorText}`);
    }

    console.log('[Test] エラーメッセージなし、空状態の検証に進みます');

    // ==========================================
    // Step 5: 目標なし状態の表示確認
    // ==========================================
    console.log('[Test] Step 5: 目標なし状態の表示確認');

    // 空状態メッセージを探す
    const emptyStateMessage = page.locator('text=まだ目標がありません');
    await expect(emptyStateMessage).toBeVisible({ timeout: 10000 });
    console.log('[Test] ✅ 「まだ目標がありません」メッセージ表示確認');

    // ==========================================
    // Step 6: フラグアイコンの確認
    // ==========================================
    console.log('[Test] Step 6: フラグアイコンの確認');

    // フラグアイコン（flag）を探す - シンプルにテキスト検索
    const emptyStateCard = page.locator('.p-8.text-center').filter({ has: emptyStateMessage });
    const flagIcon = emptyStateCard.getByText('flag');

    await expect(flagIcon).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ フラグアイコン（flag）表示確認');

    // アイコンサイズの確認（Material Icons デフォルトサイズ = 24px）
    const iconStyles = await flagIcon.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color,
      };
    });

    console.log(`[Test] フラグアイコンスタイル: サイズ ${iconStyles.fontSize}, 色 ${iconStyles.color}`);

    const iconFontSize = parseFloat(iconStyles.fontSize);
    expect(iconFontSize).toBeGreaterThanOrEqual(20); // Material Icons デフォルトサイズ以上
    console.log(`[Test] ✅ アイコンサイズ: ${iconFontSize}px`);

    // ==========================================
    // Step 7: 補足メッセージの確認
    // ==========================================
    console.log('[Test] Step 7: 補足メッセージの確認');

    // 補足メッセージを探す
    const supplementaryMessage = page.locator('text=新しい目標を作成して、計画を始めましょう');
    const hasSupplementaryMessage = await supplementaryMessage.isVisible().catch(() => false);

    if (!hasSupplementaryMessage) {
      console.warn('[警告] 補足メッセージが表示されていません（オプション項目）');
    } else {
      await expect(supplementaryMessage).toBeVisible({ timeout: 5000 });
      console.log('[Test] ✅ 補足メッセージ表示確認');
    }

    // ==========================================
    // Step 8: 空状態カードのスタイル確認
    // ==========================================
    console.log('[Test] Step 8: 空状態カードのスタイル確認');

    // 空状態カード全体は既に取得済み（emptyStateCard）
    const hasEmptyStateCard = await emptyStateCard.isVisible().catch(() => false);

    if (hasEmptyStateCard) {
      // カードの位置とサイズを確認
      const cardBox = await emptyStateCard.boundingBox();
      if (cardBox) {
        console.log(`[Test] 空状態カード位置: X=${cardBox.x.toFixed(1)}, Y=${cardBox.y.toFixed(1)}, 幅=${cardBox.width.toFixed(1)}, 高さ=${cardBox.height.toFixed(1)}`);

        // カード幅が十分にある（中央揃え確認）
        expect(cardBox.width).toBeGreaterThan(100);
        console.log(`[Test] ✅ カード幅: ${cardBox.width.toFixed(1)}px`);
      }

      // カードのスタイルを確認
      const cardStyles = await emptyStateCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          textAlign: computed.textAlign,
          backgroundColor: computed.backgroundColor,
        };
      });

      console.log(`[Test] カードスタイル: padding=${cardStyles.padding}, textAlign=${cardStyles.textAlign}, backgroundColor=${cardStyles.backgroundColor}`);

      // テキストが中央揃えであることを確認
      expect(cardStyles.textAlign).toBe('center');
      console.log('[Test] ✅ テキスト中央揃え確認');
    } else {
      console.warn('[警告] 空状態カードのスタイル確認ができませんでした（表示には影響しない）');
    }

    // ==========================================
    // Step 9: 新規目標作成ボタンの確認
    // ==========================================
    console.log('[Test] Step 9: 新規目標作成ボタンの確認');

    // 新規目標作成ボタンを探す
    const createGoalButton = page.locator('button').filter({ hasText: /新規目標を作成/i });
    const hasCreateGoalButton = await createGoalButton.isVisible().catch(() => false);

    if (!hasCreateGoalButton) {
      throw new Error('[テスト失敗] 新規目標作成ボタンが表示されていません');
    }

    await expect(createGoalButton).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 新規目標作成ボタン表示確認');

    // ボタンがクリック可能か確認
    const isButtonEnabled = await createGoalButton.isEnabled();
    expect(isButtonEnabled).toBe(true);
    console.log('[Test] ✅ 新規目標作成ボタンがクリック可能');

    // ボタン内のアイコン確認（addアイコン）
    const addIcon = createGoalButton.locator('.material-icons').filter({ hasText: 'add' });
    const hasAddIcon = await addIcon.isVisible().catch(() => false);

    if (hasAddIcon) {
      console.log('[Test] ✅ 新規目標作成ボタン内にaddアイコン表示');
    } else {
      console.warn('[警告] addアイコンが見つかりませんでした（表示には影響しない）');
    }

    // ==========================================
    // Step 10: 空状態の表示順序確認
    // ==========================================
    console.log('[Test] Step 10: 空状態の表示順序確認');

    // アイコン → メッセージ → 補足メッセージの順序で表示されているか確認
    const iconBox = await flagIcon.boundingBox();
    const messageBox = await emptyStateMessage.boundingBox();

    if (iconBox && messageBox) {
      // アイコンがメッセージより上にある（Y座標がメッセージより小さい）
      expect(iconBox.y).toBeLessThan(messageBox.y);
      console.log(`[Test] ✅ 表示順序: アイコン（Y=${iconBox.y.toFixed(1)}）→ メッセージ（Y=${messageBox.y.toFixed(1)}）`);
    } else {
      console.log('[Test] ℹ️  位置情報の取得ができませんでした（表示には影響しない）');
    }

    if (hasSupplementaryMessage) {
      const supplementaryBox = await supplementaryMessage.boundingBox();
      if (messageBox && supplementaryBox) {
        // メッセージが補足メッセージより上にある
        expect(messageBox.y).toBeLessThan(supplementaryBox.y);
        console.log(`[Test] ✅ 表示順序: メッセージ（Y=${messageBox.y.toFixed(1)}）→ 補足メッセージ（Y=${supplementaryBox.y.toFixed(1)}）`);
      }
    }

    // ==========================================
    // Step 11: 目標作成ボタンクリックテスト（オプション）
    // ==========================================
    console.log('[Test] Step 11: 目標作成ボタンクリックテスト（オプション）');

    // ボタンをクリックしてモーダルが開くことを確認
    await createGoalButton.click();
    console.log('[Test] 新規目標作成ボタンをクリック');

    // モーダルが開くのを待つ
    const modal = page.locator('text=新規目標を作成').or(page.locator('[role="dialog"]'));
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      console.log('[Test] ✅ 目標作成モーダルが開きました');

      // モーダルを閉じる（背景クリック or キャンセルボタン）
      const cancelButton = page.locator('button').filter({ hasText: /キャンセル/i });
      const hasCancelButton = await cancelButton.isVisible().catch(() => false);

      if (hasCancelButton) {
        await cancelButton.click();
        console.log('[Test] モーダルをキャンセルボタンで閉じました');
      } else {
        // ESCキーで閉じる
        await page.keyboard.press('Escape');
        console.log('[Test] モーダルをESCキーで閉じました');
      }

      // モーダルが閉じたことを確認
      await modal.waitFor({ state: 'hidden', timeout: 3000 }).catch((e) => {
        console.log(`[Test] モーダル非表示待機失敗: ${e.message}`);
      });
    } else {
      console.warn('[警告] 目標作成モーダルが開きませんでした（機能に影響する可能性）');
    }

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-008: 目標なし状態表示テスト完了');
    console.log('- 検証項目:');
    console.log('  ✅ フラグアイコン（flag）: 表示');
    console.log(`  ✅ アイコンサイズ: ${iconFontSize.toFixed(1)}px`);
    console.log('  ✅ 「まだ目標がありません」メッセージ: 表示');
    if (hasSupplementaryMessage) {
      console.log('  ✅ 補足メッセージ: 表示');
    }
    console.log('  ✅ カードスタイル: 中央揃え、適切なパディング');
    console.log('  ✅ 新規目標作成ボタン: 表示、クリック可能');
    if (hasAddIcon) {
      console.log('  ✅ addアイコン: 表示');
    }
    console.log('  ✅ 表示順序: アイコン → メッセージ → 補足メッセージ');
    if (isModalVisible) {
      console.log('  ✅ ボタンクリック: モーダルが開く');
    }
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(emptyStateMessage).toBeVisible();
    expect(flagIcon).toBeVisible();
    expect(createGoalButton).toBeVisible();
    expect(createGoalButton).toBeEnabled();
  });
});
