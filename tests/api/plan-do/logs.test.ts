import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * Logs API 統合テスト
 *
 * テスト対象:
 * - POST /api/logs (ログ記録)
 *
 * 仕様書: docs/api-specs/plan-do-api.md
 */

describe('Logs API Integration Tests', () => {
  let testUser: any;
  let authCookie: string;
  let testTask: any;

  beforeAll(async () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const email = `test-logs-${uniqueId}@mentalbase.local`;
    const password = 'TestPassword123!';

    // テストユーザー登録
    const registerResponse = await fetch('http://localhost:3247/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Logs Test User',
        email,
        password,
      }),
    });

    const registerData = await registerResponse.json();
    testUser = registerData.user;

    // 認証Cookieを取得
    authCookie = await getAuthCookie(email, password);

    // テスト用のタスクを作成
    testTask = await prisma.task.create({
      data: {
        userId: testUser.id,
        title: 'ログテスト用タスク',
        priority: 'medium',
        status: 'pending',
      },
    });
  });

  beforeEach(async () => {
    // 各テスト前にテストユーザーのログを削除
    if (testUser) {
      await prisma.log.deleteMany({ where: { userId: testUser.id } });
    }
  });

  describe('POST /api/logs - ログ記録', () => {
    it('有効なデータでログ記録が成功する', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: '今日は集中して英単語学習ができた。30個すべて暗記できて達成感がある。',
          emotion: 'happy',
          state: 'focused',
          type: 'daily',
          taskId: testTask.id,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.content).toBe('今日は集中して英単語学習ができた。30個すべて暗記できて達成感がある。');
      expect(data.emotion).toBe('happy');
      expect(data.state).toBe('focused');
      expect(data.type).toBe('daily');
      expect(data.taskId).toBe(testTask.id);
      expect(data.userId).toBe(testUser.id);

      // データベース確認
      const log = await prisma.log.findUnique({ where: { id: data.id } });
      expect(log).toBeDefined();
    });

    it('emotion, state, taskIdがオプションであることを確認', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: 'シンプルなログ',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.emotion).toBeNull();
      expect(data.state).toBeNull();
      expect(data.taskId).toBeNull();
      expect(data.type).toBe('daily'); // デフォルト値
    });

    it('内容が空の場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: '',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('内容が5000文字を超える場合、400エラーを返す', async () => {
      const longContent = 'あ'.repeat(5001);
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: longContent,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('無効なemotionの場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: 'テストログ',
          emotion: 'invalid_emotion',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('無効なstateの場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: 'テストログ',
          state: 'invalid_state',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('無効なtypeの場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: 'テストログ',
          type: 'invalid_type',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('存在しないtaskIdの場合、404エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          content: 'テストログ',
          taskId: 'non-existent-task-id',
        }),
      });

      expect(response.status).toBe(404);
    });

    it('すべての有効なemotion値でログ記録が成功する', async () => {
      const validEmotions = ['happy', 'neutral', 'sad', 'anxious', 'excited', 'tired'];

      for (const emotion of validEmotions) {
        const response = await fetch('http://localhost:3247/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            content: `${emotion}のテスト`,
            emotion,
          }),
        });

        expect(response.status).toBe(201);
      }
    });

    it('すべての有効なstate値でログ記録が成功する', async () => {
      const validStates = ['energetic', 'tired', 'focused', 'distracted', 'calm', 'stressed'];

      for (const state of validStates) {
        const response = await fetch('http://localhost:3247/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            content: `${state}のテスト`,
            state,
          }),
        });

        expect(response.status).toBe(201);
      }
    });

    it('すべての有効なtype値でログ記録が成功する', async () => {
      const validTypes = ['daily', 'reflection', 'insight'];

      for (const type of validTypes) {
        const response = await fetch('http://localhost:3247/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: authCookie,
          },
          body: JSON.stringify({
            content: `${type}のテスト`,
            type,
          }),
        });

        expect(response.status).toBe(201);
      }
    });
  });
});
