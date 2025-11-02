import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * Goals API 統合テスト
 *
 * テスト対象:
 * - GET /api/goals (目標一覧取得 + 進捗率計算)
 * - POST /api/goals (目標作成)
 * - PUT /api/goals/{id} (目標更新)
 * - DELETE /api/goals/{id} (目標削除 + カスケード削除)
 *
 * 仕様書: docs/api-specs/plan-do-api.md
 */

describe('Goals API Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  // テストユーザー作成とログイン
  beforeAll(async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const email = `test-goals-${uniqueId}@mentalbase.local`;
    const password = 'TestPassword123!';

    // テストユーザー登録
    const registerResponse = await fetch('http://localhost:3247/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Goals Test User',
        email,
        password,
      }),
    });

    const registerData = await registerResponse.json();
    testUser = registerData.user;

    // 認証Cookieを取得
    authCookie = await getAuthCookie(email, password);
  });

  beforeEach(async () => {
    // 各テスト前にテストユーザーの目標とタスクを削除
    if (testUser) {
      await prisma.task.deleteMany({ where: { userId: testUser.id } });
      await prisma.goal.deleteMany({ where: { userId: testUser.id } });
    }
  });

  describe('POST /api/goals - 目標作成', () => {
    it('有効なデータで目標作成が成功する', async () => {
      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '英語力を向上させる',
          description: 'TOEICスコア800点を目指す',
          deadline: '2025-12-31T00:00:00.000Z',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.title).toBe('英語力を向上させる');
      expect(data.description).toBe('TOEICスコア800点を目指す');
      expect(data.status).toBe('active');
      expect(data.userId).toBe(testUser.id);

      // データベース確認
      const goal = await prisma.goal.findUnique({ where: { id: data.id } });
      expect(goal).toBeDefined();
      expect(goal?.title).toBe('英語力を向上させる');
    });

    it('descriptionとdeadlineがオプションであることを確認', async () => {
      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: 'シンプルな目標',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.description).toBeNull();
      expect(data.deadline).toBeNull();
    });

    it('タイトルが空の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('タイトルが200文字を超える場合、400エラーを返す', async () => {
      const longTitle = 'あ'.repeat(201);
      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: longTitle,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/goals - 目標一覧取得（進捗率付き）', () => {
    it('目標一覧を進捗率付きで取得できる', async () => {
      // テスト目標を作成
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: 'テスト目標',
          status: 'active',
        },
      });

      // タスクを作成（5つ中3つ完了）
      await prisma.task.createMany({
        data: [
          { userId: testUser.id, goalId: goal.id, title: 'タスク1', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク2', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク3', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク4', status: 'pending', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク5', status: 'pending', priority: 'medium' },
        ],
      });

      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);

      const goalWithProgress = data.find((g: any) => g.id === goal.id);
      expect(goalWithProgress).toBeDefined();
      expect(goalWithProgress.totalTasks).toBe(5);
      expect(goalWithProgress.completedTasks).toBe(3);
      expect(goalWithProgress.progressPercentage).toBe(60); // 3/5 = 60%
    });

    it('タスクがない目標の進捗率は0%になる', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: 'タスクなし目標',
          status: 'active',
        },
      });

      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const goalWithProgress = data.find((g: any) => g.id === goal.id);

      expect(goalWithProgress.totalTasks).toBe(0);
      expect(goalWithProgress.completedTasks).toBe(0);
      expect(goalWithProgress.progressPercentage).toBe(0);
    });

    it('アーカイブされた目標は取得されない', async () => {
      await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: 'アーカイブ目標',
          status: 'archived',
        },
      });

      const response = await fetch('http://localhost:3247/api/goals', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const archivedGoal = data.find((g: any) => g.title === 'アーカイブ目標');

      expect(archivedGoal).toBeUndefined();
    });
  });

  describe('PUT /api/goals/{id} - 目標更新', () => {
    it('目標の更新が成功する', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '元のタイトル',
          description: '元の説明',
          status: 'active',
        },
      });

      const response = await fetch(`http://localhost:3247/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '更新されたタイトル',
          description: '更新された説明',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('更新されたタイトル');
      expect(data.description).toBe('更新された説明');
    });

    it('部分更新が可能である', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '元のタイトル',
          description: '元の説明',
          status: 'active',
        },
      });

      const response = await fetch(`http://localhost:3247/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '新しいタイトルのみ',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('新しいタイトルのみ');
      expect(data.description).toBe('元の説明'); // 変更されていない
    });

    it('存在しない目標IDの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/goals/non-existent-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          title: '更新',
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/goals/{id} - 目標削除（カスケード削除）', () => {
    it('目標削除が成功する', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '削除予定の目標',
          status: 'active',
        },
      });

      const response = await fetch(`http://localhost:3247/api/goals/${goal.id}`, {
        method: 'DELETE',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(204);

      // データベースから削除されたことを確認
      const deletedGoal = await prisma.goal.findUnique({ where: { id: goal.id } });
      expect(deletedGoal).toBeNull();
    });

    it('目標削除時に関連タスクもカスケード削除される', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '削除予定の目標',
          status: 'active',
        },
      });

      // 関連タスクを作成
      const task = await prisma.task.create({
        data: {
          userId: testUser.id,
          goalId: goal.id,
          title: '関連タスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      await fetch(`http://localhost:3247/api/goals/${goal.id}`, {
        method: 'DELETE',
        headers: {
          Cookie: authCookie,
        },
      });

      // タスクも削除されたことを確認
      const deletedTask = await prisma.task.findUnique({ where: { id: task.id } });
      expect(deletedTask).toBeNull();
    });

    it('存在しない目標IDの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/goals/non-existent-id', {
        method: 'DELETE',
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
