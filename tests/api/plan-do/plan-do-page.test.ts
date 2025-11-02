import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * Plan-Do Page Data API 統合テスト
 *
 * テスト対象:
 * - GET /api/plan-do (ページ統合データ取得)
 *
 * 仕様書: docs/api-specs/plan-do-api.md
 */

describe('Plan-Do Page Data API Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  beforeAll(async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const email = `test-plando-${uniqueId}@mentalbase.local`;
    const password = 'TestPassword123!';

    // テストユーザー登録
    const registerResponse = await fetch('http://localhost:3247/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'PlanDo Test User',
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
    // 各テスト前にテストデータをクリーンアップ
    if (testUser) {
      await prisma.task.deleteMany({ where: { userId: testUser.id } });
      await prisma.goal.deleteMany({ where: { userId: testUser.id } });
    }
  });

  describe('GET /api/plan-do - ページ統合データ取得', () => {
    it('すべてのページデータが正しい形式で取得される', async () => {
      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('activeTab');
      expect(data).toHaveProperty('goals');
      expect(data).toHaveProperty('todayTasks');
      expect(data).toHaveProperty('emotionOptions');

      expect(Array.isArray(data.goals)).toBe(true);
      expect(Array.isArray(data.todayTasks)).toBe(true);
      expect(Array.isArray(data.emotionOptions)).toBe(true);
    });

    it('activeTabがクエリパラメータで指定できる', async () => {
      const response = await fetch('http://localhost:3247/api/plan-do?activeTab=do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(data.activeTab).toBe('do');
    });

    it('activeTabがデフォルトで"plan"になる', async () => {
      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(data.activeTab).toBe('plan');
    });

    it('目標データに進捗率が含まれる', async () => {
      // テスト目標を作成
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '進捗テスト目標',
          status: 'active',
        },
      });

      // タスクを作成（5つ中2つ完了）
      await prisma.task.createMany({
        data: [
          { userId: testUser.id, goalId: goal.id, title: 'タスク1', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク2', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク3', status: 'pending', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク4', status: 'pending', priority: 'medium' },
          { userId: testUser.id, goalId: goal.id, title: 'タスク5', status: 'pending', priority: 'medium' },
        ],
      });

      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const testGoal = data.goals.find((g: any) => g.id === goal.id);

      expect(testGoal).toBeDefined();
      expect(testGoal.totalTasks).toBe(5);
      expect(testGoal.completedTasks).toBe(2);
      expect(testGoal.progressPercentage).toBe(40); // 2/5 = 40%
    });

    it('今日のタスクのみが取得される', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

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

      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(data.todayTasks.length).toBe(1);
      expect(data.todayTasks[0].title).toBe('今日のタスク');
    });

    it('今日のタスクに目標名が結合される', async () => {
      const goal = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: 'テスト目標',
          status: 'active',
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.task.create({
        data: {
          userId: testUser.id,
          goalId: goal.id,
          title: '目標付きタスク',
          priority: 'medium',
          status: 'pending',
          dueDate: today,
        },
      });

      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const taskWithGoal = data.todayTasks.find((t: any) => t.title === '目標付きタスク');

      expect(taskWithGoal).toBeDefined();
      expect(taskWithGoal.goalName).toBe('テスト目標');
    });

    it('感情選択肢が定義されている', async () => {
      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      expect(data.emotionOptions.length).toBeGreaterThan(0);
      expect(data.emotionOptions[0]).toHaveProperty('value');
      expect(data.emotionOptions[0]).toHaveProperty('emoji');
      expect(data.emotionOptions[0]).toHaveProperty('label');

      // 必須の感情が含まれているか確認
      const emotionValues = data.emotionOptions.map((e: any) => e.value);
      expect(emotionValues).toContain('happy');
      expect(emotionValues).toContain('neutral');
      expect(emotionValues).toContain('sad');
      expect(emotionValues).toContain('anxious');
    });

    it('アーカイブされた目標は含まれない', async () => {
      await prisma.goal.createMany({
        data: [
          {
            userId: testUser.id,
            title: 'アクティブ目標',
            status: 'active',
          },
          {
            userId: testUser.id,
            title: 'アーカイブ目標',
            status: 'archived',
          },
        ],
      });

      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      const goalTitles = data.goals.map((g: any) => g.title);

      expect(goalTitles).toContain('アクティブ目標');
      expect(goalTitles).not.toContain('アーカイブ目標');
    });

    it('認証なしの場合、401エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });

    it('複数の目標と今日のタスクが正しく取得される（統合シナリオ）', async () => {
      // 複数の目標を作成
      const goal1 = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '英語学習',
          description: 'TOEIC対策',
          status: 'active',
        },
      });

      const goal2 = await prisma.goal.create({
        data: {
          userId: testUser.id,
          title: '運動習慣',
          status: 'active',
        },
      });

      // 今日のタスクを作成
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.task.createMany({
        data: [
          {
            userId: testUser.id,
            goalId: goal1.id,
            title: '英単語30個暗記',
            priority: 'high',
            scheduledTime: '09:00',
            status: 'pending',
            dueDate: today,
          },
          {
            userId: testUser.id,
            goalId: goal2.id,
            title: 'ランニング30分',
            priority: 'medium',
            scheduledTime: '07:00',
            status: 'pending',
            dueDate: today,
          },
          {
            userId: testUser.id,
            goalId: goal1.id,
            title: 'リスニング練習',
            priority: 'high',
            scheduledTime: '20:00',
            status: 'completed',
            completedAt: new Date(),
            dueDate: today,
          },
        ],
      });

      // 進捗計算用のタスク（今日ではない）
      await prisma.task.createMany({
        data: [
          { userId: testUser.id, goalId: goal1.id, title: 'タスクA', status: 'completed', priority: 'medium' },
          { userId: testUser.id, goalId: goal1.id, title: 'タスクB', status: 'pending', priority: 'medium' },
        ],
      });

      const response = await fetch('http://localhost:3247/api/plan-do', {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();

      // 目標データの確認
      expect(data.goals.length).toBe(2);
      const englishGoal = data.goals.find((g: any) => g.id === goal1.id);
      expect(englishGoal.totalTasks).toBe(4); // 今日のタスク2（英単語、リスニング） + 追加2（タスクA、タスクB）
      expect(englishGoal.completedTasks).toBe(2); // リスニング練習 + タスクA

      // 今日のタスクの確認
      expect(data.todayTasks.length).toBe(3);

      // 優先度と時間順にソートされているか確認
      expect(data.todayTasks[0].title).toBe('英単語30個暗記'); // high, 09:00
      expect(data.todayTasks[0].goalName).toBe('英語学習');

      // 全体データ構造の確認
      expect(data.activeTab).toBe('plan');
      expect(data.emotionOptions.length).toBeGreaterThan(0);
    });
  });
});
