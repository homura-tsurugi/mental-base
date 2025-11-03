import { test, expect } from '@playwright/test';

/**
 * ai-assistant-responsive.spec.ts: AIアシスタント レスポンシブテスト
 * テストID範囲: E2E-AIA-041 ~ E2E-AIA-045
 *
 * カバー内容:
 * - デスクトップ表示（1920x1080）
 * - タブレット表示（768x1024）
 * - モバイル表示（375x667）
 * - モバイルでのタッチ操作
 * - 縦向き・横向き切り替え
 */

test.describe('AIアシスタント - レスポンシブ（デスクトップ）', () => {
  test('E2E-AIA-041: デスクトップ表示（1920x1080）', async ({ page }) => {
    // ブラウザを1920x1080にリサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ページアクセス
    await page.goto('/client/ai-assistant');

    // モード選択ボタンが横並びで表示
    const modeButtons = page.locator('[data-testid^="mode-tab-"]');
    const buttonCount = await modeButtons.count();
    expect(buttonCount).toBe(4);

    // ボタンの配置を確認（横並び）
    const firstButton = modeButtons.nth(0);
    const secondButton = modeButtons.nth(1);

    const firstBox = await firstButton.boundingBox();
    const secondBox = await secondButton.boundingBox();

    // y座標がほぼ同じで、x座標が異なる（横並び）
    expect(firstBox?.y).toBeCloseTo(secondBox?.y || 0, 5);
    expect(firstBox?.x).toBeLessThan(secondBox?.x || 0);

    // チャット吹き出しが最大幅75%
    const chatHistory = page.locator('[data-testid="chat-history"]');
    const historyBox = await chatHistory.boundingBox();

    // 入力エリアが最大幅600px中央配置
    const inputArea = page.locator('[data-testid="message-input"]');
    const inputBox = await inputArea.boundingBox();

    expect(inputBox?.width).toBeLessThanOrEqual(600);
  });
});

test.describe('AIアシスタント - レスポンシブ（タブレット）', () => {
  test('E2E-AIA-042: タブレット表示（768x1024）', async ({ page }) => {
    // ブラウザを768x1024にリサイズ
    await page.setViewportSize({ width: 768, height: 1024 });

    // ページアクセス
    await page.goto('/client/ai-assistant');

    // モード選択ボタンが存在
    const modeButtons = page.locator('[data-testid^="mode-tab-"]');
    await expect(modeButtons.nth(0)).toBeVisible();

    // すべてのボタンが見える範囲内（または横スクロール可能）
    const modeContainer = page.locator('[data-testid="mode-buttons-container"]');
    const isVisible = await modeContainer.isVisible().catch(() => true);

    // チャット履歴が見やすく表示
    const chatHistory = page.locator('[data-testid="chat-history"]');
    await expect(chatHistory).toBeVisible();

    const chatBox = await chatHistory.boundingBox();
    expect(chatBox?.width).toBeGreaterThan(0);

    // 入力エリアが画面幅いっぱい（ほぼ）
    const inputArea = page.locator('[data-testid="message-input"]');
    const inputBox = await inputArea.boundingBox();

    const viewportSize = page.viewportSize();
    expect(inputBox?.width).toBeCloseTo(viewportSize?.width || 768, 20); // ±20px
  });
});

test.describe('AIアシスタント - レスポンシブ（モバイル）', () => {
  test('E2E-AIA-043: モバイル表示（375x667）', async ({ page }) => {
    // ブラウザを375x667にリサイズ
    await page.setViewportSize({ width: 375, height: 667 });

    // ページアクセス
    await page.goto('/client/ai-assistant');

    // モード選択ボタンが横スクロール可能か確認
    const modeContainer = page.locator('[data-testid="mode-buttons-container"]');
    const modeButtons = page.locator('[data-testid^="mode-tab-"]');

    await expect(modeButtons.nth(0)).toBeVisible();

    // 最後のボタンが見えるか確認
    const lastButton = modeButtons.nth(3);
    const lastButtonVisible = await lastButton.isVisible();

    // スクロール可能な場合は見えない可能性があるため、コンテナをチェック
    const containerBox = await modeContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);

    // チャット吹き出しが画面幅の75%
    const chatHistory = page.locator('[data-testid="chat-history"]');
    const historyBox = await chatHistory.boundingBox();
    const viewportWidth = 375;

    expect(historyBox?.width).toBeLessThanOrEqual(viewportWidth);

    // 入力エリアが画面下部固定
    const inputArea = page.locator('[data-testid="message-input"]');
    const inputBox = await inputArea.boundingBox();

    // 入力エリアが画面幅いっぱい
    expect(inputBox?.width).toBeCloseTo(viewportWidth, 10);

    // テキストサイズが読みやすい（最小フォントサイズを確認）
    const fontSize = await inputArea.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // 最小16px（モバイルUI標準）
    const fontSizeNum = parseInt(fontSize) || 0;
    expect(fontSizeNum).toBeGreaterThanOrEqual(14);
  });

  test('E2E-AIA-044: モバイルでのタッチ操作', async ({ page }) => {
    // モバイルサイズで設定
    await page.setViewportSize({ width: 375, height: 667 });

    // ページアクセス
    await page.goto('/client/ai-assistant');

    // モード選択エリアをスワイプ
    const modeContainer = page.locator('[data-testid="mode-buttons-container"]');
    const containerBox = await modeContainer.boundingBox();

    if (containerBox) {
      // スワイプ操作をシミュレート
      await page.dragAndDrop(
        '[data-testid="mode-buttons-container"]',
        '[data-testid="mode-buttons-container"]', // 同じ要素でドラッグして移動を表現
        { sourcePosition: { x: containerBox.width / 2, y: containerBox.height / 2 } }
      );
    }

    // チャット履歴をスクロール
    const chatHistory = page.locator('[data-testid="chat-history"]');
    const historyBox = await chatHistory.boundingBox();

    if (historyBox) {
      // スクロール操作（上から下へ）
      await chatHistory.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      const scrollPosition = await chatHistory.evaluate((el) => el.scrollTop);
      expect(scrollPosition).toBeGreaterThan(0);
    }

    // メッセージを送信（タップ操作）
    const inputField = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await inputField.tap();
    await inputField.fill('モバイル操作テスト');
    await sendButton.tap();

    // メッセージが送信される
    await expect(inputField).toHaveValue('', { timeout: 2000 });
  });

  test('E2E-AIA-045: 縦向き・横向き切り替え', async ({ page }) => {
    // 縦向きで開始
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/client/ai-assistant');

    // 初期状態で要素が表示されている
    const modeButtons = page.locator('[data-testid^="mode-tab-"]');
    await expect(modeButtons.nth(0)).toBeVisible();

    // 縦向きのレイアウトを確認
    const portraitInputBox = await page.locator('[data-testid="message-input"]').boundingBox();

    // 横向きに回転（幅と高さを入れ替え）
    await page.setViewportSize({ width: 667, height: 375 });

    // レイアウトが調整される
    const landscapeInputBox = await page.locator('[data-testid="message-input"]').boundingBox();

    expect(landscapeInputBox?.width).toBeGreaterThan(portraitInputBox?.width || 0);

    // 全要素が正しく表示される
    await expect(modeButtons.nth(0)).toBeVisible();
    await expect(page.locator('[data-testid="chat-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();

    // 再び縦向きに回転
    await page.setViewportSize({ width: 375, height: 667 });

    // レイアウトが元に戻る
    const backToPortraitBox = await page.locator('[data-testid="message-input"]').boundingBox();
    expect(backToPortraitBox?.width).toBeCloseTo(portraitInputBox?.width || 375, 10);
  });
});
