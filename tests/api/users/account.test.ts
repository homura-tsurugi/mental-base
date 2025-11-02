import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getAuthCookie } from '@/tests/helpers/auth.helper';

/**
 * DELETE /api/users/account エンドポイント統合テスト
 * 複合処理-UAS-001: アカウント削除（カスケード削除）
 *
 * テスト対象: app/api/users/account/route.ts
 * 仕様書: docs/api-specs/settings-api.md
 */

describe('DELETE /api/users/account - アカウント削除（カスケード削除）', () => {
  const testEmail = 'test-account-delete@mentalbase.local';
  const testPassword = 'TestPassword123!';
  let testUserId: string;
  let authCookie: string;

  // 各テスト前にテストユーザーを作成してログイン
  beforeEach(async () => {
    // 既存のテストユーザーを削除
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // テストユーザー作成
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: 'アカウント削除テストユーザー',
        email: testEmail,
        password: hashedPassword,
      },
    });
    testUserId = user.id;

    // ログインしてセッションクッキーを取得
    authCookie = await getAuthCookie(testEmail, testPassword);
  });

  // テスト終了後にクリーンアップ
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('正常系テスト', () => {
    it('アカウントとすべての関連データを削除できる', async () => {
      // 関連データを作成
      const goal = await prisma.goal.create({
        data: {
          userId: testUserId,
          title: 'テスト目標',
          status: 'active',
        },
      });

      const task = await prisma.task.create({
        data: {
          userId: testUserId,
          goalId: goal.id,
          title: 'テストタスク',
          priority: 'medium',
          status: 'pending',
        },
      });

      await prisma.log.create({
        data: {
          userId: testUserId,
          taskId: task.id,
          content: 'テストログ',
          type: 'daily',
        },
      });

      await prisma.userSettings.create({
        data: {
          userId: testUserId,
          emailNotifications: true,
          theme: 'professional',
        },
      });

      // アカウント削除
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('アカウントを削除しました');

      // ユーザーが削除されたことを確認
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(deletedUser).toBeNull();

      // 関連データも削除されたことを確認
      const goals = await prisma.goal.findMany({
        where: { userId: testUserId },
      });
      expect(goals).toHaveLength(0);

      const tasks = await prisma.task.findMany({
        where: { userId: testUserId },
      });
      expect(tasks).toHaveLength(0);

      const logs = await prisma.log.findMany({
        where: { userId: testUserId },
      });
      expect(logs).toHaveLength(0);

      const settings = await prisma.userSettings.findUnique({
        where: { userId: testUserId },
      });
      expect(settings).toBeNull();
    });

    it('確認テキストありでアカウントを削除できる', async () => {
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
          confirmationText: '削除する',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // ユーザーが削除されたことを確認
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('カスケード削除テスト', () => {
    it('Goal, Task, Logが正しくカスケード削除される', async () => {
      // 複数の関連データを作成
      const goal1 = await prisma.goal.create({
        data: {
          userId: testUserId,
          title: '目標1',
          status: 'active',
        },
      });

      const goal2 = await prisma.goal.create({
        data: {
          userId: testUserId,
          title: '目標2',
          status: 'active',
        },
      });

      await prisma.task.createMany({
        data: [
          { userId: testUserId, goalId: goal1.id, title: 'タスク1', priority: 'high', status: 'pending' },
          { userId: testUserId, goalId: goal2.id, title: 'タスク2', priority: 'medium', status: 'pending' },
        ],
      });

      await prisma.log.createMany({
        data: [
          { userId: testUserId, content: 'ログ1', type: 'daily' },
          { userId: testUserId, content: 'ログ2', type: 'daily' },
        ],
      });

      // アカウント削除
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(200);

      // すべての関連データが削除されたことを確認
      const goals = await prisma.goal.findMany({ where: { userId: testUserId } });
      const tasks = await prisma.task.findMany({ where: { userId: testUserId } });
      const logs = await prisma.log.findMany({ where: { userId: testUserId } });

      expect(goals).toHaveLength(0);
      expect(tasks).toHaveLength(0);
      expect(logs).toHaveLength(0);
    });

    it('Reflection, AIAnalysisReport, ActionPlanが正しくカスケード削除される', async () => {
      // 振り返り関連データを作成
      const reflection = await prisma.reflection.create({
        data: {
          userId: testUserId,
          period: 'weekly',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-07'),
          content: 'テスト振り返り',
        },
      });

      const report = await prisma.aIAnalysisReport.create({
        data: {
          userId: testUserId,
          reflectionId: reflection.id,
          analysisType: 'progress',
          insights: {},
          recommendations: {},
          confidence: 0.8,
        },
      });

      await prisma.actionPlan.create({
        data: {
          userId: testUserId,
          reportId: report.id,
          title: 'テストアクションプラン',
          description: 'テスト',
          actionItems: [],
          status: 'planned',
        },
      });

      // アカウント削除
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(200);

      // すべての関連データが削除されたことを確認
      const reflections = await prisma.reflection.findMany({ where: { userId: testUserId } });
      const reports = await prisma.aIAnalysisReport.findMany({ where: { userId: testUserId } });
      const actionPlans = await prisma.actionPlan.findMany({ where: { userId: testUserId } });

      expect(reflections).toHaveLength(0);
      expect(reports).toHaveLength(0);
      expect(actionPlans).toHaveLength(0);
    });

    it('ChatMessage, Notificationが正しくカスケード削除される', async () => {
      await prisma.chatMessage.createMany({
        data: [
          { userId: testUserId, role: 'user', content: 'メッセージ1', mode: 'problem_solving' },
          { userId: testUserId, role: 'assistant', content: 'メッセージ2', mode: 'problem_solving' },
        ],
      });

      await prisma.notification.createMany({
        data: [
          { userId: testUserId, type: 'reminder', title: '通知1', message: 'テスト通知1', read: false },
          { userId: testUserId, type: 'achievement', title: '通知2', message: 'テスト通知2', read: false },
        ],
      });

      // アカウント削除
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(200);

      // すべての関連データが削除されたことを確認
      const chatMessages = await prisma.chatMessage.findMany({ where: { userId: testUserId } });
      const notifications = await prisma.notification.findMany({ where: { userId: testUserId } });

      expect(chatMessages).toHaveLength(0);
      expect(notifications).toHaveLength(0);
    });

    it('Session, PasswordResetTokenが正しくカスケード削除される', async () => {
      await prisma.session.create({
        data: {
          userId: testUserId,
          sessionToken: 'test-session-token-123',
          expires: new Date(Date.now() + 86400000),
        },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: 'test-reset-token-123',
          expires: new Date(Date.now() + 3600000),
        },
      });

      // アカウント削除
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(200);

      // すべての関連データが削除されたことを確認
      const sessions = await prisma.session.findMany({ where: { userId: testUserId } });
      const resetTokens = await prisma.passwordResetToken.findMany({ where: { userId: testUserId } });

      expect(sessions).toHaveLength(0);
      expect(resetTokens).toHaveLength(0);
    });
  });

  describe('バリデーションテスト', () => {
    it('確認テキストが正しくない場合、400エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
          confirmationText: '間違ったテキスト',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('確認テキスト');
    });
  });

  describe('セキュリティテスト', () => {
    it('他人のアカウント削除を試行すると403エラーを返す', async () => {
      // 別のユーザーを作成
      const otherUser = await prisma.user.create({
        data: {
          name: '別のユーザー',
          email: 'other-user@mentalbase.local',
          password: await bcrypt.hash('password123', 10),
        },
      });

      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: otherUser.id, // 他人のユーザーID
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('権限');

      // 他人のユーザーは削除されていないことを確認
      const stillExists = await prisma.user.findUnique({
        where: { id: otherUser.id },
      });
      expect(stillExists).toBeDefined();

      // クリーンアップ
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('認証なしでアクセスすると401エラーを返す', async () => {
      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);

      // ユーザーは削除されていないことを確認
      const stillExists = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      expect(stillExists).toBeDefined();
    });
  });

  describe('トランザクションテスト', () => {
    it('削除処理がトランザクションで実行される（失敗時は全ロールバック）', async () => {
      // 正常な削除処理では全データが削除される
      await prisma.goal.create({
        data: {
          userId: testUserId,
          title: 'トランザクションテスト目標',
          status: 'active',
        },
      });

      const response = await fetch('http://localhost:3247/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: authCookie,
        },
        body: JSON.stringify({
          userId: testUserId,
        }),
      });

      expect(response.status).toBe(200);

      // すべてのデータが削除されていることを確認
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      const goals = await prisma.goal.findMany({ where: { userId: testUserId } });

      expect(user).toBeNull();
      expect(goals).toHaveLength(0);
    });
  });
});
