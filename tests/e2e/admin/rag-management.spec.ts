import { test, expect } from '@playwright/test';

test.describe('RAG管理ページ', () => {
  // 認証ヘルパー関数
  async function login(page: any) {
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'mentor@mentalbase.local');
    await page.fill('input[name="password"]', 'MentalBase2025!Dev');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
  }

  test('ページが正常に表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('RAG管理', { timeout: 10000 });

    // ユーザー一覧カードの存在確認
    await expect(page.locator('text=クライアント一覧')).toBeVisible({ timeout: 5000 });
  });

  test('ユーザー一覧が正常に表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // 3人のユーザーが表示されることを確認
    await expect(page.locator('text=クライアント1')).toBeVisible();
    await expect(page.locator('text=クライアント2')).toBeVisible();
    await expect(page.locator('text=クライアント3')).toBeVisible();

    // ユーザー情報が正しく表示されることを確認
    await expect(page.locator('text=client1@rag-base.local')).toBeVisible();
    await expect(page.locator('text=5会話')).toBeVisible();
    await expect(page.locator('text=47メッセージ')).toBeVisible();
  });

  test('ユーザー選択時に会話履歴が表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // クライアント1を選択
    await page.click('text=クライアント1');

    // 会話履歴カードが表示されることを確認
    await expect(page.locator('text=会話履歴')).toBeVisible();
    await expect(page.locator('text=RAG構築')).toBeVisible();

    // 会話一覧が表示されることを確認
    await expect(page.locator('text=目標設定についての相談')).toBeVisible();
    await expect(page.locator('text=進捗確認とフィードバック')).toBeVisible();
  });

  test('会話要約モーダルが正常に動作する', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // クライアント1を選択
    await page.click('text=クライアント1');

    // 要約ありの会話の「要約を見る」ボタンをクリック
    await page.click('button:has-text("要約を見る")').first();

    // モーダルが表示されることを確認
    await expect(page.locator('text=会話要約')).toBeVisible();
    await expect(page.locator('text=💬 話題')).toBeVisible();
    await expect(page.locator('text=⚠️ 問題・課題')).toBeVisible();
    await expect(page.locator('text=💡 提供されたアドバイス')).toBeVisible();
    await expect(page.locator('text=✨ 気づき')).toBeVisible();
    await expect(page.locator('text=📌 次のステップ')).toBeVisible();

    // モーダルを閉じる
    await page.click('button:has-text("閉じる")');
    await expect(page.locator('text=会話要約')).not.toBeVisible();
  });

  test('RAG構築ボタンが正常に動作する', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // クライアント1を選択
    await page.click('text=クライアント1');

    // RAG構築ボタンをクリック
    page.on('dialog', dialog => dialog.accept()); // アラートを自動承認
    await page.click('button:has-text("RAG構築")');
  });

  test('未選択時に適切なメッセージが表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // ユーザー未選択の状態でメッセージが表示されることを確認
    await expect(page.locator('text=クライアントを選択してください')).toBeVisible();
  });

  test('レスポンシブデザインが正常に動作する', async ({ page }) => {
    await login(page);
    await page.goto('/admin/rag-management');

    // デスクトップ表示
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('text=クライアント一覧')).toBeVisible();

    // モバイル表示
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('text=クライアント一覧')).toBeVisible();
  });

  test('ナビゲーションからアクセスできる', async ({ page }) => {
    await login(page);
    await page.goto('/admin');

    // サイドバーの「RAG管理」をクリック
    await page.click('text=RAG管理');

    // ページ遷移確認
    await page.waitForURL('/admin/rag-management');
    await expect(page.locator('h1')).toContainText('RAG管理');
  });
});
