import { test, expect } from '@playwright/test';

/**
 * E2E-PLDO-002: 初期タブ状態（Plan）テスト
 *
 * テスト項目: 初期タブ状態（Plan）
 * 依存テストID: E2E-PLDO-001
 * 優先度: 高
 * テスト分類: 正常系
 *
 * 確認内容:
 * - Planタブがアクティブ状態（青色背景）で表示される
 * - Doタブが非アクティブ状態で表示される
 *
 * 期待結果:
 * - Planタブがアクティブ（青色背景）
 * - Doタブが非アクティブ
 *
 * 注意事項:
 * - E2E-PLDO-001（初期アクセステスト）に依存
 * - モック検出時は即座にテストを中止する
 * - 実際のデータベース接続が必要
 */

test.describe('E2E-PLDO-002: 初期タブ状態（Plan）', () => {
  test.only('E2E-PLDO-002: Planタブがアクティブ、Doタブが非アクティブ', async ({ page }) => {
    console.log('[Test Start] E2E-PLDO-002: 初期タブ状態（Plan）テスト開始');

    // コンソールログを監視（モック検出用）
    let mockDetected = false;
    page.on('console', (msg) => {
      const text = msg.text();
      console.log('[Browser Console]', msg.type(), text);
      if (text.toLowerCase().includes('mock') || text.toLowerCase().includes('stub') || text.toLowerCase().includes('fake')) {
        console.error('[モック検出] コンソールログにモック識別子: ' + text);
        mockDetected = true;
      }
    });

    // ネットワークリクエストを監視
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
        console.log('[API Request]', request.method(), url);
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        console.log('[API Response]', response.status(), response.url());
        if (!response.ok()) {
          try {
            const body = await response.text();
            console.log('[API Error Body]', body);
          } catch (e) {
            console.log('[API Error]', 'Could not read response body');
          }
        }
      }
    });

    // ステップ1: ログイン処理
    console.log('[Test] Step 1: ログインページにアクセス');
    await page.goto('http://localhost:3247/auth');

    const emailInput = page.locator('[data-testid="login-email-input"]');
    const passwordInput = page.locator('[data-testid="login-password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');

    await emailInput.fill('test@mentalbase.local');
    await passwordInput.fill('MentalBase2025!Dev');
    await loginButton.click();

    // ホームページへのリダイレクトを待機
    await page.waitForURL('http://localhost:3247/', { timeout: 10000 });
    console.log('[Test] ログイン成功、ホームページにリダイレクト');

    // ステップ2: Plan-Doページにアクセス
    console.log('[Test] Step 2: Plan-Doページにアクセス');
    await page.goto('http://localhost:3247/plan-do');

    // ローディングが完了するのを待つ
    const loadingSpinner = page.locator('text=読み込み中');
    const isLoadingVisible = await loadingSpinner.isVisible().catch(() => false);
    if (isLoadingVisible) {
      console.log('[Test] ローディング中... 完了を待機');
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 }).catch((e) => {
        console.log('[Test] ローディングスピナーが消えませんでした:', e.message);
      });
    }

    // ページが表示されることを確認
    const pageTitle = page.locator('h1').filter({ hasText: '計画・実行' });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    console.log('[Test] ページタイトル確認完了');

    // ステップ3: Planタブがアクティブであることを確認
    console.log('[Test] Step 3: Planタブのアクティブ状態を確認');
    const planTab = page.locator('button').filter({ hasText: /Plan\(計画\)/i });
    await expect(planTab).toBeVisible({ timeout: 5000 });

    // Planタブがアクティブ状態（青色背景）であることを確認
    // アクティブな場合、bg-[var(--primary)] クラスまたは bg-blue などのクラスが適用される
    const planTabClasses = await planTab.getAttribute('class');
    console.log('[Test] Planタブのクラス:', planTabClasses);

    // アクティブクラスの確認: bg-[var(--primary)] または bg-blue を含むことを確認
    const isPlanTabActive = planTabClasses?.includes('bg-[var(--primary)]') ||
                           planTabClasses?.includes('text-white');

    if (!isPlanTabActive) {
      throw new Error('[Test Failed] Planタブがアクティブ状態ではありません。クラス: ' + planTabClasses);
    }
    console.log('[Test] ✓ Planタブがアクティブ状態（青色背景）であることを確認');

    // ステップ4: Doタブが非アクティブであることを確認
    console.log('[Test] Step 4: Doタブの非アクティブ状態を確認');
    const doTab = page.locator('button').filter({ hasText: /Do\(実行\)/i });
    await expect(doTab).toBeVisible({ timeout: 5000 });

    // Doタブが非アクティブ状態であることを確認
    const doTabClasses = await doTab.getAttribute('class');
    console.log('[Test] Doタブのクラス:', doTabClasses);

    // 非アクティブクラスの確認: text-[var(--text-secondary)] を含むことを確認
    const isDoTabInactive = doTabClasses?.includes('text-[var(--text-secondary)]') ||
                           !doTabClasses?.includes('text-white');

    if (!isDoTabInactive) {
      throw new Error('[Test Failed] Doタブが非アクティブ状態ではありません。クラス: ' + doTabClasses);
    }
    console.log('[Test] ✓ Doタブが非アクティブ状態であることを確認');

    // ステップ5: Planタブのコンテンツが表示されることを確認
    console.log('[Test] Step 5: Planタブのコンテンツ表示を確認');

    // 目標作成ボタンが表示されている（Planタブのコンテンツ）
    const createGoalButton = page.locator('button').filter({ hasText: '新規目標を作成' });
    await expect(createGoalButton).toBeVisible({ timeout: 5000 });
    console.log('[Test] ✓ 新規目標作成ボタンが表示されている');

    // Doタブのコンテンツが表示されていない
    const createTaskButton = page.locator('button').filter({ hasText: '新規タスクを作成' });
    const isTaskButtonVisible = await createTaskButton.isVisible().catch(() => false);
    if (isTaskButtonVisible) {
      throw new Error('[Test Failed] Doタブのコンテンツ（新規タスク作成ボタン）が表示されています');
    }
    console.log('[Test] ✓ Doタブのコンテンツは表示されていない');

    // ステップ6: モック検出チェック
    console.log('[Test] Step 6: モック検出チェック');

    // URL確認
    const currentUrl = page.url();
    if (currentUrl.includes('mock') || currentUrl.includes('stub')) {
      throw new Error('[モック検出] URLにモック識別子が含まれています: ' + currentUrl);
    }

    // APIリクエスト確認
    const hasPlanDoApiCall = apiRequests.some(url => url.includes('/api/plan-do') || url.includes('/api/goals'));
    if (!hasPlanDoApiCall) {
      console.warn('[警告] Plan-Do関連のAPIリクエストが検出されませんでした');
      console.log('検出されたAPIリクエスト:', apiRequests);
    }

    // コンソールログでのモック検出
    if (mockDetected) {
      throw new Error('[モック検出] テストを中止します。モック実装が使用されている可能性があります。');
    }

    // テスト成功
    console.log('[テスト成功] E2E-PLDO-002: 初期タブ状態（Plan）テスト完了');
    console.log('✓ Planタブ: アクティブ状態（青色背景）');
    console.log('✓ Doタブ: 非アクティブ状態');
    console.log('✓ Planタブコンテンツ: 表示確認');
    console.log('✓ Doタブコンテンツ: 非表示確認');
    console.log('✓ モック検出: なし');
  });
});
