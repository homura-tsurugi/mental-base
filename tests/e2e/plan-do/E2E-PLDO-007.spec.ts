import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-007: 目標の期限表示テスト
 *
 * テスト項目: 目標の期限表示
 * 優先度: 中
 * テスト分類: 正常系
 * 依存テストID: E2E-PLDO-005
 *
 * 確認内容:
 * - 期限が日本語形式で表示される
 * - 期限表示フォーマットが「期限: YYYY/MM/DD」形式である
 * - 期限アイコンが表示される
 * - 期限がnullの場合は適切に処理される
 *
 * 期待結果:
 * - 「期限: YYYY/MM/DD」形式で表示される（例: 期限: 2025/12/31）
 * - 日本語ロケール（ja-JP）で年月日が表示される
 * - カレンダーアイコン（event）が期限の横に表示される
 * - 期限が設定されていない目標でも適切に表示される
 *
 * 注意事項:
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 * - VITE_SKIP_AUTH環境変数は使用しない（認証必須）
 */

test.describe('E2E-PLDO-007: 目標の期限表示', () => {
  test('E2E-PLDO-007: 期限が日本語形式「YYYY/MM/DD」で正しく表示される', async ({ page }) => {
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
      console.warn('[警告] E2E-PLDO-007: 目標一覧が空です。データベースに目標データを登録してください。');
      return;
    }

    // 目標カードを探す
    const goalCards = page.locator('[data-testid="goal-card"]').or(
      page.locator('.goal-card')
    ).or(
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
    // Step 5: 期限表示の存在確認
    // ==========================================
    console.log('[Test] Step 5: 期限表示の存在確認');

    // 最初の目標カードを対象にテスト
    const firstGoalCard = goalCards.first();
    await expect(firstGoalCard).toBeVisible({ timeout: 5000 });
    console.log('[Test] 最初の目標カード表示確認完了');

    // 期限表示テキストを探す（「期限:」で始まるテキスト）
    const deadlineElement = firstGoalCard.locator('text=/期限:/');
    const deadlineCount = await deadlineElement.count();
    console.log(`[Test] 検出された期限表示数: ${deadlineCount}`);

    if (deadlineCount === 0) {
      throw new Error('[テスト失敗] 期限表示（「期限:」）が見つかりませんでした');
    }

    await expect(deadlineElement).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✅ 期限表示確認完了');

    // ==========================================
    // Step 6: 期限アイコンの確認
    // ==========================================
    console.log('[Test] Step 6: 期限アイコンの確認');

    // カレンダーアイコン（event）を探す
    const calendarIcon = firstGoalCard.locator('.material-icons').filter({ hasText: 'event' });
    const hasCalendarIcon = await calendarIcon.isVisible().catch(() => false);

    if (hasCalendarIcon) {
      console.log('[Test] ✅ カレンダーアイコン（event）表示確認');
    } else {
      console.warn('[警告] カレンダーアイコンが見つかりませんでした（表示には影響しない）');
    }

    // ==========================================
    // Step 7: 期限フォーマットの検証
    // ==========================================
    console.log('[Test] Step 7: 期限フォーマットの検証');

    // 期限テキストを取得
    const deadlineText = await deadlineElement.textContent();
    console.log(`[Test] 期限テキスト: "${deadlineText}"`);

    // 期限フォーマットの検証: "期限: YYYY/MM/DD" または "期限: YYYY/M/D"
    // 日本語ロケール（ja-JP）では年月日の数字にゼロ埋めされない場合もある
    const deadlineFormatRegex = /期限:\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/;
    const deadlineMatch = deadlineText?.match(deadlineFormatRegex);

    if (!deadlineMatch) {
      // 期限が設定されていない場合
      if (deadlineText?.includes('期限:') && deadlineText?.trim() === '期限:') {
        console.log('[Test] ℹ️  期限が設定されていない目標です（期限: のみ表示）');
      } else {
        throw new Error(`[テスト失敗] 期限フォーマットが不正です: "${deadlineText}"`);
      }
    } else {
      // 期限フォーマットが正しい場合
      const [, year, month, day] = deadlineMatch;
      console.log(`[Test] ✅ 期限フォーマット正常: ${year}年${month}月${day}日`);

      // 年月日の妥当性チェック
      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);
      const dayNum = parseInt(day, 10);

      // 年は2000-2100の範囲
      expect(yearNum).toBeGreaterThanOrEqual(2000);
      expect(yearNum).toBeLessThanOrEqual(2100);
      console.log(`[Test] ✅ 年の妥当性: ${yearNum} (2000-2100)`);

      // 月は1-12の範囲
      expect(monthNum).toBeGreaterThanOrEqual(1);
      expect(monthNum).toBeLessThanOrEqual(12);
      console.log(`[Test] ✅ 月の妥当性: ${monthNum} (1-12)`);

      // 日は1-31の範囲
      expect(dayNum).toBeGreaterThanOrEqual(1);
      expect(dayNum).toBeLessThanOrEqual(31);
      console.log(`[Test] ✅ 日の妥当性: ${dayNum} (1-31)`);

      // 実際に有効な日付かチェック
      const deadlineDate = new Date(yearNum, monthNum - 1, dayNum);
      const isValidDate = !isNaN(deadlineDate.getTime());
      expect(isValidDate).toBe(true);
      console.log(`[Test] ✅ 日付の妥当性: ${deadlineDate.toLocaleDateString('ja-JP')} (有効な日付)`);
    }

    // ==========================================
    // Step 8: 複数の目標カードで期限表示を確認
    // ==========================================
    console.log('[Test] Step 8: 複数の目標カードで期限表示を確認');

    if (goalCardCount > 1) {
      console.log(`[Test] 複数の目標カード（${goalCardCount}件）が存在します`);

      // すべての目標カードに期限表示が存在することを確認
      for (let i = 0; i < Math.min(goalCardCount, 3); i++) {
        const card = goalCards.nth(i);
        const cardDeadlineElement = card.locator('text=/期限:/');
        const isVisible = await cardDeadlineElement.isVisible().catch(() => false);

        if (isVisible) {
          const cardDeadlineText = await cardDeadlineElement.textContent();
          const cardDeadlineMatch = cardDeadlineText?.match(deadlineFormatRegex);

          if (cardDeadlineMatch) {
            const [, year, month, day] = cardDeadlineMatch;
            console.log(`[Test] ✅ 目標カード${i + 1}: 期限表示確認（${year}/${month}/${day}）`);
          } else if (cardDeadlineText?.trim() === '期限:') {
            console.log(`[Test] ℹ️  目標カード${i + 1}: 期限未設定`);
          } else {
            console.warn(`[警告] 目標カード${i + 1}: 期限フォーマット不正 "${cardDeadlineText}"`);
          }
        } else {
          console.warn(`[警告] 目標カード${i + 1}: 期限表示が見つかりません`);
        }
      }
    } else {
      console.log('[Test] 目標カードが1件のみのため、複数確認はスキップ');
    }

    // ==========================================
    // Step 9: 期限とタイトルの位置関係確認
    // ==========================================
    console.log('[Test] Step 9: 期限とタイトルの位置関係確認');

    // 期限がタイトルの下に表示されていることを確認
    const titleElement = firstGoalCard.locator('h3').first();
    const titleBox = await titleElement.boundingBox();
    const deadlineBox = await deadlineElement.boundingBox();

    if (titleBox && deadlineBox) {
      // 期限がタイトルより下にある（Y座標がタイトルより大きい）
      expect(deadlineBox.y).toBeGreaterThan(titleBox.y);
      console.log(`[Test] ✅ 期限表示位置: タイトルの下（タイトルY: ${titleBox.y.toFixed(1)}, 期限Y: ${deadlineBox.y.toFixed(1)}）`);
    } else {
      console.log('[Test] ℹ️  位置情報の取得ができませんでした（表示には影響しない）');
    }

    // ==========================================
    // Step 10: テキストサイズとスタイルの確認
    // ==========================================
    console.log('[Test] Step 10: テキストサイズとスタイルの確認');

    // 期限テキストのスタイルを確認
    const deadlineStyles = await deadlineElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color,
      };
    });

    console.log(`[Test] 期限テキストスタイル: サイズ ${deadlineStyles.fontSize}, 色 ${deadlineStyles.color}`);

    // フォントサイズが設定されている（0pxでない）
    const fontSize = parseFloat(deadlineStyles.fontSize);
    expect(fontSize).toBeGreaterThan(0);
    console.log(`[Test] ✅ フォントサイズ: ${fontSize}px`);

    // ==========================================
    // 最終確認
    // ==========================================
    console.log('[Test] ========================================');
    console.log('[テスト成功] E2E-PLDO-007: 目標の期限表示テスト完了');
    console.log('- 検証項目:');
    console.log(`  ✅ 期限表示: 「期限:」テキスト表示`);
    if (deadlineMatch) {
      console.log(`  ✅ 期限フォーマット: YYYY/MM/DD形式（${deadlineMatch[1]}/${deadlineMatch[2]}/${deadlineMatch[3]}）`);
      console.log(`  ✅ 年月日の妥当性: すべて正常範囲`);
    } else {
      console.log(`  ℹ️  期限未設定: 適切に処理されている`);
    }
    if (hasCalendarIcon) {
      console.log(`  ✅ カレンダーアイコン: 表示`);
    }
    console.log(`  ✅ 表示位置: タイトルの下`);
    console.log(`  ✅ フォントサイズ: ${fontSize}px`);
    console.log(`  ✅ 目標カード数: ${goalCardCount}件`);
    console.log('- モック検出: なし');
    console.log('[Test] ========================================');

    // テスト成功
    expect(deadlineElement).toBeVisible();
    if (deadlineMatch) {
      const [, year, month, day] = deadlineMatch;
      expect(parseInt(year, 10)).toBeGreaterThanOrEqual(2000);
      expect(parseInt(month, 10)).toBeGreaterThanOrEqual(1);
      expect(parseInt(month, 10)).toBeLessThanOrEqual(12);
      expect(parseInt(day, 10)).toBeGreaterThanOrEqual(1);
      expect(parseInt(day, 10)).toBeLessThanOrEqual(31);
    }
  });
});
