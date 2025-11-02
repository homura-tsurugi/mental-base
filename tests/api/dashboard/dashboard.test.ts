/**
 * ダッシュボード統合APIテスト
 * GET /api/dashboard
 * GET /api/notifications
 * GET /api/activities/recent
 * PATCH /api/tasks/[id]/complete
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

const baseUrl = 'http://localhost:3247';

describe('Dashboard API Tests', () => {
  let authCookie: string;
  let userId: string;
  const testEmail = `dashboard-test-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Dashboard Test User';

  beforeEach(async () => {
    // テストユーザーを作成
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: testName,
        password: testPassword,
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
          contains: 'dashboard-test-',
        },
      },
    });
  });

  describe('GET /api/dashboard', () => {
    it('ダッシュボード統合データを取得できる', async () => {
      const response = await fetch(`${baseUrl}/api/dashboard`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('compassSummary');
      expect(data).toHaveProperty('todayTasks');
      expect(data).toHaveProperty('recentActivities');
      expect(data).toHaveProperty('notifications');

      // compassSummaryの検証
      expect(data.compassSummary).toHaveProperty('planProgress');
      expect(data.compassSummary).toHaveProperty('doProgress');
      expect(data.compassSummary).toHaveProperty('checkProgress');
      expect(data.compassSummary).toHaveProperty('actionProgress');

      // 配列型の検証
      expect(Array.isArray(data.todayTasks)).toBe(true);
      expect(Array.isArray(data.recentActivities)).toBe(true);
      expect(Array.isArray(data.notifications)).toBe(true);
    });

    it('今日のタスクが正しく含まれる', async () => {
      // 今日の日付
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 今日のタスクを作成
      await prisma.task.create({
        data: {
          userId,
          title: '今日のタスク',
          priority: 'high',
          status: 'pending',
          dueDate: today,
        },
      });

      const response = await fetch(`${baseUrl}/api/dashboard`, {
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      expect(data.todayTasks.length).toBeGreaterThan(0);
      expect(data.todayTasks[0].title).toBe('今日のタスク');
    });

    it('未認証の場合、401エラーを返す', async () => {
      const response = await fetch(`${baseUrl}/api/dashboard`);

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('認証が必要です');
    });
  });

  describe('GET /api/notifications', () => {
    it('通知一覧を取得できる', async () => {
      // 通知を作成
      await prisma.notification.create({
        data: {
          userId,
          type: 'reminder',
          title: 'テスト通知',
          message: 'これはテスト通知です',
          read: false,
        },
      });

      const response = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('message');
      expect(data[0]).toHaveProperty('read');
    });

    it('未読通知のみを取得できる（デフォルト）', async () => {
      // 未読通知を作成
      await prisma.notification.create({
        data: {
          userId,
          type: 'reminder',
          title: '未読通知',
          message: 'これは未読です',
          read: false,
        },
      });

      // 既読通知を作成
      await prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: '既読通知',
          message: 'これは既読です',
          read: true,
        },
      });

      const response = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      // 未読のみが返される
      expect(data.every((n: any) => n.read === false)).toBe(true);
    });

    it('全ての通知を取得できる（unreadOnly=false）', async () => {
      // 未読通知を作成
      await prisma.notification.create({
        data: {
          userId,
          type: 'reminder',
          title: '未読通知',
          message: 'これは未読です',
          read: false,
        },
      });

      // 既読通知を作成
      await prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: '既読通知',
          message: 'これは既読です',
          read: true,
        },
      });

      const response = await fetch(`${baseUrl}/api/notifications?unreadOnly=false`, {
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      // 未読・既読両方が返される
      expect(data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/activities/recent', () => {
    it('最近のアクティビティを取得できる', async () => {
      // タスク完了アクティビティを作成
      await prisma.task.create({
        data: {
          userId,
          title: '完了タスク',
          priority: 'high',
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const response = await fetch(`${baseUrl}/api/activities/recent`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('type');
      expect(data[0]).toHaveProperty('description');
      expect(data[0]).toHaveProperty('timestamp');
    });

    it('limit パラメータで取得件数を制限できる', async () => {
      // 複数のタスクを作成
      for (let i = 0; i < 5; i++) {
        await prisma.task.create({
          data: {
            userId,
            title: `タスク ${i}`,
            priority: 'medium',
            status: 'pending',
          },
        });
      }

      const response = await fetch(`${baseUrl}/api/activities/recent?limit=3`, {
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      expect(data.length).toBeLessThanOrEqual(3);
    });

    it('無効な limit 値の場合、400エラーを返す', async () => {
      const response = await fetch(`${baseUrl}/api/activities/recent?limit=101`, {
        headers: {
          Cookie: authCookie,
        },
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('1～100');
    });
  });

  describe('PATCH /api/tasks/[id]/complete', () => {
    it('タスクを完了状態に更新できる', async () => {
      // タスクを作成
      const task = await prisma.task.create({
        data: {
          userId,
          title: 'テストタスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({ completed: true }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('completed');
      expect(data.completedAt).not.toBeNull();
    });

    it('タスクを未完了状態に戻すことができる', async () => {
      // 完了タスクを作成
      const task = await prisma.task.create({
        data: {
          userId,
          title: '完了タスク',
          priority: 'medium',
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({ completed: false }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('pending');
      expect(data.completedAt).toBeNull();
    });

    it('存在しないタスクの場合、404エラーを返す', async () => {
      const response = await fetch(`${baseUrl}/api/tasks/nonexistent-id/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({ completed: true }),
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('見つかりません');
    });

    it('他のユーザーのタスクの場合、403エラーを返す', async () => {
      // 他のユーザーを作成
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@test.com`,
          name: 'Other User',
          password: 'Password123!',
        },
      });

      // 他のユーザーのタスクを作成
      const task = await prisma.task.create({
        data: {
          userId: otherUser.id,
          title: '他人のタスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({ completed: true }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('権限がありません');
    });

    it('completed が boolean でない場合、400エラーを返す', async () => {
      const task = await prisma.task.create({
        data: {
          userId,
          title: 'テストタスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({ completed: 'yes' }), // 無効な値
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('boolean型');
    });
  });
});
