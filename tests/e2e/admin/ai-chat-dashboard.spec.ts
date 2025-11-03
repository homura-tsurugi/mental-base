import { test, expect } from '@playwright/test';

test.describe('AIチャットダッシュボード', () => {
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
    await page.goto('/admin/ai-chat');

    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('AIチャットダッシュボード', { timeout: 10000 });

    // 統計カードの存在確認
    await expect(page.locator('text=総ユーザー数')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=総会話数')).toBeVisible();
    await expect(page.locator('text=総メッセージ数')).toBeVisible();
    await expect(page.locator('text=Claude API使用量')).toBeVisible();
  });

  test('統計カードに正しいデータが表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/ai-chat');

    // 総ユーザー数カード
    const userCard = page.locator('text=総ユーザー数').locator('..');
    await expect(userCard).toContainText('12人');
    await expect(userCard).toContainText('アクティブ: 10人');

    // 総会話数カード
    const conversationCard = page.locator('text=総会話数').locator('..');
    await expect(conversationCard).toContainText('347件');
    await expect(conversationCard).toContainText('今週: 28件');

    // 総メッセージ数カード
    const messageCard = page.locator('text=総メッセージ数').locator('..');
    await expect(messageCard).toContainText('1,542件');
    await expect(messageCard).toContainText('平均: 4.4メッセージ/会話');

    // API使用量カード
    const apiCard = page.locator('text=Claude API使用量').locator('..');
    await expect(apiCard).toContainText('245K');
    await expect(apiCard).toContainText('推定コスト: $8.50');
  });

  test('Dify管理カードが正常に表示される', async ({ page }) => {
    await login(page);
    await page.goto('/admin/ai-chat');

    // 5つのショートカットカードが存在することを確認
    await expect(page.locator('text=Dify管理')).toBeVisible();
    await expect(page.locator('text=ナレッジベース')).toBeVisible();
    await expect(page.locator('text=プロンプト編集')).toBeVisible();
    await expect(page.locator('text=API管理')).toBeVisible();
    await expect(page.locator('text=ログ')).toBeVisible();
    await expect(page.locator('text=統計')).toBeVisible();
  });

  test('外部リンクが正しく設定されている', async ({ page }) => {
    await login(page);
    await page.goto('/admin/ai-chat');

    // ナレッジベースのリンク確認
    const knowledgeLink = page.locator('text=ナレッジベース').locator('..').locator('a');
    await expect(knowledgeLink).toHaveAttribute('href', /datasets/);
    await expect(knowledgeLink).toHaveAttribute('target', '_blank');
  });

  test('レスポンシブデザインが正常に動作する', async ({ page }) => {
    await login(page);
    await page.goto('/admin/ai-chat');

    // デスクトップ表示
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // タブレット表示
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // モバイル表示
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('ナビゲーションからアクセスできる', async ({ page }) => {
    await login(page);
    await page.goto('/admin');

    // サイドバーの「AIチャット」をクリック
    await page.click('text=AIチャット');

    // ページ遷移確認
    await page.waitForURL('/admin/ai-chat');
    await expect(page.locator('h1')).toContainText('AIチャットダッシュボード');
  });
});
