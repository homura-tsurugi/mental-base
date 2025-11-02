/**
 * クライアント詳細APIテスト
 * GET /api/mentor/client/[id]
 * GET /api/mentor/client/[id]/goals
 * GET /api/mentor/client/[id]/tasks
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';
import bcrypt from 'bcrypt';

const baseUrl = 'http://localhost:3247';

describe('Mentor Client Details API Tests', () => {
  let mentorAuthCookie: string;
  let otherMentorAuthCookie: string;
  let mentorId: string;
  let otherMentorId: string;
  let clientId: string;
  const mentorEmail = `mentor-${Date.now()}@test.com`;
  const otherMentorEmail = `other-mentor-${Date.now()}@test.com`;
  const clientEmail = `client-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // メンターユーザーを作成
    const mentor = await prisma.user.create({
      data: {
        email: mentorEmail,
        name: 'Test Mentor',
        password: hashedPassword,
        role: 'mentor',
        isMentor: true,
      },
    });
    mentorId = mentor.id;

    // 他のメンターユーザーを作成
    const otherMentor = await prisma.user.create({
      data: {
        email: otherMentorEmail,
        name: 'Other Mentor',
        password: hashedPassword,
        role: 'mentor',
        isMentor: true,
      },
    });
    otherMentorId = otherMentor.id;

    // クライアントユーザーを作成
    const client = await prisma.user.create({
      data: {
        email: clientEmail,
        name: 'Test Client',
        password: hashedPassword,
        role: 'client',
      },
    });
    clientId = client.id;

    // メンター-クライアント関係を作成
    await prisma.mentorClientRelationship.create({
      data: {
        mentorId,
        clientId,
        status: 'active',
        invitedBy: mentorId,
        acceptedAt: new Date(),
      },
    });

    // データアクセス許可を作成
    await prisma.clientDataAccessPermission.create({
      data: {
        clientId,
        mentorId,
        allowGoals: true,
        allowTasks: true,
        allowLogs: true,
        allowReflections: true,
        allowAIReports: true,
        isActive: true,
      },
    });

    // 認証Cookieを取得
    mentorAuthCookie = await getAuthCookie(mentorEmail, testPassword);
    otherMentorAuthCookie = await getAuthCookie(otherMentorEmail, testPassword);
  });

  afterAll(async () => {
    // テストデータを削除
    await prisma.clientDataAccessPermission.deleteMany({
      where: {
        OR: [
          { mentorId },
          { mentorId: otherMentorId },
        ],
      },
    });
    await prisma.mentorClientRelationship.deleteMany({
      where: {
        OR: [
          { mentorId },
          { mentorId: otherMentorId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [mentorEmail, otherMentorEmail, clientEmail],
        },
      },
    });
  });

  describe('GET /api/mentor/client/[id]', () => {
    it('クライアント基本情報を取得できる', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('client');
      expect(data).toHaveProperty('relationship');
      expect(data).toHaveProperty('accessPermissions');
      expect(data).toHaveProperty('overallProgress');

      // client情報検証
      expect(data.client.id).toBe(clientId);
      expect(data.client.name).toBe('Test Client');
    });

    it('関係のないクライアントにはアクセスできない（403）', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}`, {
        headers: {
          Cookie: otherMentorAuthCookie,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('権限がありません');
    });

    it('存在しないクライアントの場合、404エラーを返す', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/client/nonexistent-id`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('見つかりません');
    });
  });

  describe('GET /api/mentor/client/[id]/goals', () => {
    it('クライアントの目標一覧を取得できる', async () => {
      // テスト用目標を作成
      await prisma.goal.create({
        data: {
          userId: clientId,
          title: 'テスト目標',
          status: 'active',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        },
      });

      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}/goals`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('status');
    });

    it('データアクセス許可がない場合、403エラーを返す', async () => {
      // アクセス許可を無効化
      await prisma.clientDataAccessPermission.updateMany({
        where: {
          clientId,
          mentorId,
        },
        data: {
          allowGoals: false,
        },
      });

      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}/goals`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('アクセス権限がありません');
    });
  });

  describe('GET /api/mentor/client/[id]/tasks', () => {
    it('クライアントのタスク一覧を取得できる', async () => {
      // テスト用タスクを作成
      await prisma.task.create({
        data: {
          userId: clientId,
          title: 'テストタスク',
          priority: 'high',
          status: 'pending',
        },
      });

      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}/tasks`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('title');
      expect(data[0]).toHaveProperty('priority');
    });

    it('statusパラメータでフィルタリングできる', async () => {
      // pending タスクを作成
      await prisma.task.create({
        data: {
          userId: clientId,
          title: 'Pending タスク',
          priority: 'high',
          status: 'pending',
        },
      });

      // completed タスクを作成
      await prisma.task.create({
        data: {
          userId: clientId,
          title: 'Completed タスク',
          priority: 'medium',
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const response = await fetch(`${baseUrl}/api/mentor/client/${clientId}/tasks?status=pending`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      const data = await response.json();
      expect(data.every((t: any) => t.status === 'pending')).toBe(true);
    });
  });
});
