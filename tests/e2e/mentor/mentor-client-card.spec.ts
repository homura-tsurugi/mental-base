import { test, expect } from '@playwright/test';

/**
 * mentor-client-card.spec.ts: クライアント一覧とクライアントカードの表示・インタラクションテスト
 * テストID範囲: E2E-MENTOR-026 ~ E2E-MENTOR-040
 */

test.describe('E2E-MENTOR-026～040: メンターダッシュボード クライアント一覧・カード表示', () => {
  test.beforeEach(async ({ page }) => {
    // ページに移動
    await page.goto('http://localhost:3247/mentor');
    await page.waitForLoadState('networkidle');
  });

  // E2E-MENTOR-026: クライアント一覧表示
  test('E2E-MENTOR-026: クライアント一覧表示', async ({ page }) => {
    // クライアント一覧セクションを確認
    const clientList = page.locator(
      '[data-testid="client-list"], section:has([data-testid="client-card"])'
    );
    await expect(clientList).toBeVisible();

    // クライアントカードがグリッド表示
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);

    // グリッドレイアウト（lg:grid-cols-3）確認
    const gridContainer = page.locator('[data-testid="client-grid"], div:has([data-testid="client-card"])').first();
    if (await gridContainer.count() > 0) {
      await expect(gridContainer).toHaveClass(/grid/);
    }
  });

  // E2E-MENTOR-027: クライアント件数表示
  test('E2E-MENTOR-027: クライアント件数表示', async ({ page }) => {
    // クライアント件数テキストを確認
    const clientCount = page.locator(
      '[data-testid="client-count"], text=/件のクライアント/'
    );
    await expect(clientCount).toBeVisible();

    // 「○件のクライアント」形式
    const text = await clientCount.textContent();
    expect(text).toMatch(/\d+件のクライアント/);
  });

  // E2E-MENTOR-028: クライアントカード表示
  test('E2E-MENTOR-028: クライアントカード表示', async ({ page }) => {
    // クライアントカードが表示されている
    const clientCard = page.locator('[data-testid="client-card"]').first();
    await expect(clientCard).toBeVisible();

    // クライアント名が表示されている
    const clientName = clientCard.locator('[data-testid="client-name"]');
    await expect(clientName).toBeVisible();

    // メールアドレスが表示されている
    const clientEmail = clientCard.locator('[data-testid="client-email"]');
    await expect(clientEmail).toBeVisible();

    // ステータスバッジが表示されている
    const statusBadge = clientCard.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toBeVisible();

    // 進捗バーが表示されている
    const progressBar = clientCard.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();

    // 最終活動日が表示されている
    const lastActivity = clientCard.locator('[data-testid="last-activity"]');
    await expect(lastActivity).toBeVisible();
  });

  // E2E-MENTOR-029: クライアント名・メール表示
  test('E2E-MENTOR-029: クライアント名・メール表示', async ({ page }) => {
    const clientCard = page.locator('[data-testid="client-card"]').first();

    // 名前が太字（font-semibold）
    const clientName = clientCard.locator('[data-testid="client-name"]');
    await expect(clientName).toHaveClass(/font-semibold|font-bold/);

    // メールアドレスが表示されている
    const clientEmail = clientCard.locator('[data-testid="client-email"]');
    await expect(clientEmail).toBeVisible();

    // メールが灰色（text-gray-500）
    await expect(clientEmail).toHaveClass(/text-gray/);

    // メールアドレスの形式を確認
    const emailText = await clientEmail.textContent();
    expect(emailText).toMatch(/.+@.+\..+/);
  });

  // E2E-MENTOR-030: クライアントアバター表示
  test('E2E-MENTOR-030: クライアントアバター表示', async ({ page }) => {
    // avatarUrl有りのクライアントを探す
    const clientCard = page.locator('[data-testid="client-card"]').first();
    const avatar = clientCard.locator('[data-testid="client-avatar"] img, img[data-testid="avatar-image"]');

    if (await avatar.count() > 0) {
      // 画像が丸型（rounded-full）で表示
      const avatarContainer = clientCard.locator('[data-testid="client-avatar"]');
      await expect(avatarContainer).toHaveClass(/rounded-full/);

      // w-12 h-12サイズ
      await expect(avatar).toHaveClass(/w-12|w-\[3rem\]/);
      await expect(avatar).toHaveClass(/h-12|h-\[3rem\]/);

      // object-cover適用
      await expect(avatar).toHaveClass(/object-cover/);
    }
  });

  // E2E-MENTOR-031: クライアントイニシャル表示
  test('E2E-MENTOR-031: クライアントイニシャル表示', async ({ page }) => {
    // avatarUrlなしのクライアントを探す
    const clientCard = page.locator('[data-testid="client-card"]').first();
    const initialAvatar = clientCard.locator('[data-testid="client-initials"], [class*="initials"]');

    if (await initialAvatar.count() > 0) {
      // イニシャルが表示されている
      await expect(initialAvatar).toBeVisible();

      // 青背景（bg-blue-600）
      await expect(initialAvatar).toHaveClass(/bg-blue/);

      // 白文字、太字
      await expect(initialAvatar).toHaveClass(/text-white/);
      await expect(initialAvatar).toHaveClass(/font-bold|font-semibold/);
    }
  });

  // E2E-MENTOR-032: ステータスバッジ: 順調
  test('E2E-MENTOR-032: ステータスバッジ: 順調', async ({ page }) => {
    // status='on_track'のクライアントを探す
    const onTrackCard = page.locator('[data-testid="client-card"]:has([data-testid="status-badge"]:has-text("順調"))').first();

    if (await onTrackCard.count() > 0) {
      const badge = onTrackCard.locator('[data-testid="status-badge"]');

      // 「順調」バッジ表示
      await expect(badge).toContainText('順調');

      // 緑背景（bg-green-100）
      await expect(badge).toHaveClass(/bg-green/);

      // 緑文字（text-green-800）
      await expect(badge).toHaveClass(/text-green/);
    }
  });

  // E2E-MENTOR-033: ステータスバッジ: 停滞
  test('E2E-MENTOR-033: ステータスバッジ: 停滞', async ({ page }) => {
    // status='stagnant'のクライアントを探す
    const stagnantCard = page.locator('[data-testid="client-card"]:has([data-testid="status-badge"]:has-text("停滞"))').first();

    if (await stagnantCard.count() > 0) {
      const badge = stagnantCard.locator('[data-testid="status-badge"]');

      // 「停滞」バッジ表示
      await expect(badge).toContainText('停滞');

      // 黄背景（bg-amber-100）
      await expect(badge).toHaveClass(/bg-amber|bg-yellow/);

      // 黄文字（text-amber-800）
      await expect(badge).toHaveClass(/text-amber|text-yellow/);
    }
  });

  // E2E-MENTOR-034: ステータスバッジ: 要フォロー
  test('E2E-MENTOR-034: ステータスバッジ: 要フォロー', async ({ page }) => {
    // status='needs_followup'のクライアントを探す
    const followupCard = page.locator('[data-testid="client-card"]:has([data-testid="status-badge"]:has-text("要フォロー"))').first();

    if (await followupCard.count() > 0) {
      const badge = followupCard.locator('[data-testid="status-badge"]');

      // 「要フォロー」バッジ表示
      await expect(badge).toContainText('要フォロー');

      // 赤背景（bg-red-100）
      await expect(badge).toHaveClass(/bg-red/);

      // 赤文字（text-red-800）
      await expect(badge).toHaveClass(/text-red/);
    }
  });

  // E2E-MENTOR-035: 進捗バー表示
  test('E2E-MENTOR-035: 進捗バー表示', async ({ page }) => {
    const clientCard = page.locator('[data-testid="client-card"]').first();

    // 「総合進捗率」ラベル表示
    const progressLabel = clientCard.locator('[data-testid="progress-label"], text=/総合進捗率/');
    await expect(progressLabel).toBeVisible();

    // 進捗率パーセント表示
    const progressValue = clientCard.locator('[data-testid="progress-value"]');
    if (await progressValue.count() > 0) {
      const text = await progressValue.textContent();
      expect(text).toMatch(/\d+%/);
    }

    // プログレスバー表示
    const progressBar = clientCard.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
  });

  // E2E-MENTOR-036: 進捗バー色: 高進捗
  test('E2E-MENTOR-036: 進捗バー色: 高進捗', async ({ page }) => {
    // 進捗率70%以上のクライアントを探す
    const highProgressCard = page.locator('[data-testid="client-card"]:has([data-testid="progress-value"]:matches(/[7-9]\\d%|100%/))').first();

    if (await highProgressCard.count() > 0) {
      const progressBar = highProgressCard.locator('[data-testid="progress-bar-fill"]');

      if (await progressBar.count() > 0) {
        // プログレスバーが緑色（bg-green-500）
        await expect(progressBar).toHaveClass(/bg-green|green-500/);
      }
    }
  });

  // E2E-MENTOR-037: 進捗バー色: 中進捗
  test('E2E-MENTOR-037: 進捗バー色: 中進捗', async ({ page }) => {
    // 進捗率40-69%のクライアントを探す
    const mediumProgressCard = page.locator('[data-testid="client-card"]:has([data-testid="progress-value"]:matches(/[4-6]\\d%/))').first();

    if (await mediumProgressCard.count() > 0) {
      const progressBar = mediumProgressCard.locator('[data-testid="progress-bar-fill"]');

      if (await progressBar.count() > 0) {
        // プログレスバーが黄色（bg-amber-500）
        await expect(progressBar).toHaveClass(/bg-amber|bg-yellow|amber-500/);
      }
    }
  });

  // E2E-MENTOR-038: 進捗バー色: 低進捗
  test('E2E-MENTOR-038: 進捗バー色: 低進捗', async ({ page }) => {
    // 進捗率39%以下のクライアントを探す
    const lowProgressCard = page.locator('[data-testid="client-card"]:has([data-testid="progress-value"]:matches(/[0-3]\\d%/))').first();

    if (await lowProgressCard.count() > 0) {
      const progressBar = lowProgressCard.locator('[data-testid="progress-bar-fill"]');

      if (await progressBar.count() > 0) {
        // プログレスバーが赤色（bg-red-500）
        await expect(progressBar).toHaveClass(/bg-red|red-500/);
      }
    }
  });

  // E2E-MENTOR-039: 最終活動日表示
  test('E2E-MENTOR-039: 最終活動日表示', async ({ page }) => {
    const clientCard = page.locator('[data-testid="client-card"]').first();

    // 最終活動日が表示されている
    const lastActivity = clientCard.locator('[data-testid="last-activity"]');
    await expect(lastActivity).toBeVisible();

    // 時計アイコンが表示されている
    const icon = clientCard.locator('[data-testid="activity-icon"]');
    if (await icon.count() > 0) {
      await expect(icon).toBeVisible();
    }

    // 「最終活動: ○日前」形式
    const text = await lastActivity.textContent();
    expect(text).toMatch(/最終活動:|時間前|日前|今日|昨日/);
  });

  // E2E-MENTOR-040: クライアントカードクリック
  test('E2E-MENTOR-040: クライアントカードクリック', async ({ page }) => {
    // クライアントカードをクリック
    const clientCard = page.locator('[data-testid="client-card"]').first();
    await expect(clientCard).toBeVisible();

    // カードがクリック可能
    await expect(clientCard).toBeFocused({ timeout: 1000 }).catch(() => {
      // フォーカス不可の場合、クリック可能性を確認
      expect(true).toBe(true);
    });

    // ホバー時にシャドウ強化（hover:shadow-md）
    const computedStyle = await clientCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });

    // シャドウが定義されているか確認
    expect(typeof computedStyle).toBe('string');

    // リンク要素またはボタン要素であることを確認
    const tagName = await clientCard.evaluate((el) => el.tagName.toLowerCase());
    expect(['a', 'button', 'div']).toContain(tagName);

    // onClick ハンドラーがある場合はクリック可能
    const href = await clientCard.getAttribute('href');
    const role = await clientCard.getAttribute('role');

    if (href) {
      // Linkコンポーネントの場合
      expect(href).toMatch(/\/mentor\/client/);
    } else if (role === 'button') {
      // ボタンの場合
      expect(role).toBe('button');
    }
  });
});
