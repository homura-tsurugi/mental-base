/**
 * COM:PASS進捗APIテスト
 * GET /api/compass/progress
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

const baseUrl = 'http://localhost:3247';

describe('GET /api/compass/progress', () => {
  let authCookie: string;
  let userId: string;
  const testEmail = `compass-test-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Compass Test User';

  beforeEach(async () => {
    // テストユーザーを作成
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: testPassword, // 本来はハッシュ化が必要だが、Auth.jsがハッシュ化する
      },
    });
    userId = user.id;

    // 認証Cookieを取得
    authCookie = await getAuthCookie(testEmail, testPassword);
  });

  afterAll(async () => {
    // テストデータを削除
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'compass-test-',
        },
      },
    });
  });

  it('認証済みユーザーのCOM:PASS進捗を取得できる', async () => {
    const response = await fetch(`${baseUrl}/api/compass/progress`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('planProgress');
    expect(data).toHaveProperty('doProgress');
    expect(data).toHaveProperty('checkProgress');
    expect(data).toHaveProperty('actionProgress');

    // 進捗率は0～100の範囲
    expect(data.planProgress).toBeGreaterThanOrEqual(0);
    expect(data.planProgress).toBeLessThanOrEqual(100);
    expect(data.doProgress).toBeGreaterThanOrEqual(0);
    expect(data.doProgress).toBeLessThanOrEqual(100);
    expect(data.checkProgress).toBeGreaterThanOrEqual(0);
    expect(data.checkProgress).toBeLessThanOrEqual(100);
    expect(data.actionProgress).toBeGreaterThanOrEqual(0);
    expect(data.actionProgress).toBeLessThanOrEqual(100);
  });

  it('目標作成後、PLAN進捗が更新される', async () => {
    // 目標を作成
    await prisma.goal.create({
      data: {
        userId,
        title: 'テスト目標',
        status: 'active',
      },
    });

    const response = await fetch(`${baseUrl}/api/compass/progress`, {
      headers: {
        Cookie: authCookie,
      },
    });

    const data = await response.json();
    expect(data.planProgress).toBeGreaterThan(0);
  });

  it('タスク完了後、DO進捗が更新される', async () => {
    // タスクを作成
    const task1 = await prisma.task.create({
      data: {
        userId,
        title: 'タスク1',
        priority: 'medium',
        status: 'pending',
      },
    });

    const task2 = await prisma.task.create({
      data: {
        userId,
        title: 'タスク2',
        priority: 'medium',
        status: 'completed',
        completedAt: new Date(),
      },
    });

    const response = await fetch(`${baseUrl}/api/compass/progress`, {
      headers: {
        Cookie: authCookie,
      },
    });

    const data = await response.json();
    // 2タスク中1つ完了 = 50%
    expect(data.doProgress).toBe(50);
  });

  it('ログ記録後、CHECK進捗が更新される', async () => {
    // ログを作成
    await prisma.log.create({
      data: {
        userId,
        content: 'テストログ',
        type: 'daily',
      },
    });

    const response = await fetch(`${baseUrl}/api/compass/progress`, {
      headers: {
        Cookie: authCookie,
      },
    });

    const data = await response.json();
    expect(data.checkProgress).toBeGreaterThan(0);
  });

  it('アクションプラン完了後、ACTION進捗が更新される', async () => {
    // アクションプランを作成
    await prisma.actionPlan.create({
      data: {
        userId,
        title: 'テストアクションプラン',
        description: 'テスト',
        actionItems: ['アイテム1'],
        status: 'completed',
      },
    });

    const response = await fetch(`${baseUrl}/api/compass/progress`, {
      headers: {
        Cookie: authCookie,
      },
    });

    const data = await response.json();
    expect(data.actionProgress).toBe(100); // 1/1 = 100%
  });

  it('未認証の場合、401エラーを返す', async () => {
    const response = await fetch(`${baseUrl}/api/compass/progress`);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('認証が必要です');
  });
});
