import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * Tasks API 統合テスト
 *
 * テスト対象:
 * - POST /api/tasks (タスク作成)
 * - PATCH /api/tasks/{id}/toggle (完了状態切り替え)
 * - DELETE /api/tasks/{id} (タスク削除)
 * - GET /api/tasks/today (今日のタスク取得 + Goal名結合)
 *
 * 仕様書: docs/api-specs/plan-do-api.md
 */

describe('Tasks API Integration Tests', () => {
  let testUser: any;
  let authCookie: string;
  let testGoal: any;

  beforeAll(async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const email = `test-tasks-${uniqueId}@mentalbase.local`;
    const password = 'TestPassword123!';

    // テストユーザー登録
    const registerResponse = await fetch('http://localhost:3247/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tasks Test User',
        email,
        password,
      }),
    });

    const registerData = await registerResponse.json();
    testUser = registerData.user;

    // 認証Cookieを取得
    authCookie = await getAuthCookie(email, password);

    // テスト用の目標を作成
    testGoal = await prisma.goal.create({
      data: {
        userId: testUser.id,
        title: 'タスクテスト用目標',
        status: 'active',
      },
    });
  });

  beforeEach(async () => {
    // 各テスト前にテストユーザーのタスクを削除
    if (testUser) {
      await prisma.task.deleteMany({ where: { userId: testUser.id } });
    }
  });

  describe('POST /api/tasks - タスク作成', () => {
    it('有効なデータでタスク作成が成功する', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '英単語30個を暗記',
          description: 'TOEIC頻出単語を中心に',
          goalId: testGoal.id,
          dueDate: '2025-11-01T00:00:00.000Z',
          scheduledTime: '09:00',
          priority: 'high',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.title).toBe('英単語30個を暗記');
      expect(data.goalId).toBe(testGoal.id);
      expect(data.priority).toBe('high');
      expect(data.status).toBe('pending');
      expect(data.userId).toBe(testUser.id);
    });

    it('goalIdなしでタスク作成が成功する', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '独立したタスク',
          priority: 'medium',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.goalId).toBeNull();
    });

    it('タイトルが空の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '',
          priority: 'medium',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('優先度が無効な場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: 'テストタスク',
          priority: 'invalid',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('scheduledTimeの形式が無効な場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: 'テストタスク',
          priority: 'medium',
          scheduledTime: '25:99', // 無効な時刻
        }),
      });

      expect(response.status).toBe(400);
    });

    it('存在しないgoalIdの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: 'テストタスク',
          priority: 'medium',
          goalId: 'non-existent-goal-id',
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/tasks/{id}/toggle - 完了状態切り替え', () => {
    it('pendingからcompletedに切り替わる', async () => {
      const task = await prisma.task.create({
        data: {
          userId: testUser.id,
          title: 'テストタスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      const response = await fetch(`http://localhost:3247/api/tasks/${task.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.completedAt).toBeDefined();
    });

    it('completedからpendingに切り替わる', async () => {
      const task = await prisma.task.create({
        data: {
          userId: testUser.id,
          title: 'テストタスク',
          priority: 'medium',
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const response = await fetch(`http://localhost:3247/api/tasks/${task.id}/toggle`, {
        method: 'PATCH',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending');
      expect(data.completedAt).toBeNull();
    });

    it('存在しないタスクIDの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks/non-existent-id/toggle', {
        method: 'PATCH',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/{id} - タスク削除', () => {
    it('タスク削除が成功する', async () => {
      const task = await prisma.task.create({
        data: {
          userId: testUser.id,
          title: '削除予定タスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      const response = await fetch(`http://localhost:3247/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(204);

      // データベースから削除されたことを確認
      const deletedTask = await prisma.task.findUnique({ where: { id: task.id } });
      expect(deletedTask).toBeNull();
    });

    it('存在しないタスクIDの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/tasks/non-existent-id', {
        method: 'DELETE',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tasks/today - 今日のタスク取得（Goal名結合）', () => {
    it('今日のタスクのみ取得される', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 今日、昨日、明日のタスクを作成
      await prisma.task.createMany({
        data: [
          {
            userId: testUser.id,
            title: '今日のタスク',
            priority: 'high',
            status: 'pending',
            dueDate: today,
          },
          {
            userId: testUser.id,
            title: '昨日のタスク',
            priority: 'medium',
            status: 'pending',
            dueDate: yesterday,
          },
          {
            userId: testUser.id,
            title: '明日のタスク',
            priority: 'low',
            status: 'pending',
            dueDate: tomorrow,
          },
        ],
      });

      const response = await fetch('http://localhost:3247/api/tasks/today', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      const titles = data.map((task: any) => task.title);
      expect(titles).toContain('今日のタスク');
      expect(titles).not.toContain('昨日のタスク');
      expect(titles).not.toContain('明日のタスク');
    });

    it('目標名が結合される', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.task.create({
        data: {
          userId: testUser.id,
          goalId: testGoal.id,
          title: '目標付きタスク',
          priority: 'medium',
          status: 'pending',
          dueDate: today,
        },
      });

      const response = await fetch('http://localhost:3247/api/tasks/today', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const taskWithGoal = data.find((t: any) => t.title === '目標付きタスク');

      expect(taskWithGoal).toBeDefined();
      expect(taskWithGoal.goalName).toBe('タスクテスト用目標');
    });

    it('優先度と時間順にソートされる', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.task.createMany({
        data: [
          {
            userId: testUser.id,
            title: '低優先度・早い時間',
            priority: 'low',
            scheduledTime: '08:00',
            status: 'pending',
            dueDate: today,
          },
          {
            userId: testUser.id,
            title: '高優先度・遅い時間',
            priority: 'high',
            scheduledTime: '18:00',
            status: 'pending',
            dueDate: today,
          },
          {
            userId: testUser.id,
            title: '高優先度・早い時間',
            priority: 'high',
            scheduledTime: '09:00',
            status: 'pending',
            dueDate: today,
          },
        ],
      });

      const response = await fetch('http://localhost:3247/api/tasks/today', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const titles = data.map((t: any) => t.title);

      // 高優先度が先、その中で早い時間が先
      expect(titles[0]).toBe('高優先度・早い時間');
      expect(titles[1]).toBe('高優先度・遅い時間');
    });
  });
});
