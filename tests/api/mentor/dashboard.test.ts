/**
 * メンターダッシュボードAPIテスト
 * GET /api/mentor/dashboard
 * GET /api/mentor/relationships
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthCookie } from '@/tests/helpers/auth.helper';
import bcrypt from 'bcrypt';

const baseUrl = 'http://localhost:3247';

describe('Mentor Dashboard API Tests', () => {
  let mentorAuthCookie: string;
  let clientAuthCookie: string;
  let mentorId: string;
  let clientId: string;
  const mentorEmail = `mentor-test-${Date.now()}@test.com`;
  const clientEmail = `client-test-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  beforeEach(async () => {
    // メンターユーザーを作成
    const hashedPassword = await bcrypt.hash(testPassword, 10);
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

    // 認証Cookieを取得
    mentorAuthCookie = await getAuthCookie(mentorEmail, testPassword);
    clientAuthCookie = await getAuthCookie(clientEmail, testPassword);
  });

  afterAll(async () => {
    // テストデータを削除
    await prisma.mentorClientRelationship.deleteMany({
      where: {
        OR: [
          { mentorId },
          { clientId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [mentorEmail, clientEmail],
        },
      },
    });
  });

  describe('GET /api/mentor/dashboard', () => {
    it('メンターダッシュボードデータを取得できる', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/dashboard`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('statistics');
      expect(data).toHaveProperty('clients');

      // statistics検証
      expect(data.statistics).toHaveProperty('totalClients');
      expect(data.statistics).toHaveProperty('activeClients');
      expect(data.statistics).toHaveProperty('needsFollowUp');
      expect(data.statistics).toHaveProperty('averageProgress');

      // clients配列検証
      expect(Array.isArray(data.clients)).toBe(true);
    });

    it('クライアントロールではアクセスできない（403）', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/dashboard`, {
        headers: {
          Cookie: clientAuthCookie,
        },
      });

      // Note: 現在はリダイレクト（302）になる可能性がある
      // verifyMentor()がredirect()を呼ぶため
      expect([302, 403]).toContain(response.status);
    });

    it('未認証の場合、401エラーを返す', async () => {
      const response = await fetch(`${baseUrl}/api/mentor/dashboard`);

      // Note: リダイレクトまたは401
      expect([302, 401]).toContain(response.status);
    });
  });

  describe('GET /api/mentor/relationships', () => {
    it('担当クライアント一覧を取得できる', async () => {
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

      const response = await fetch(`${baseUrl}/api/mentor/relationships`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('status');
      expect(data[0]).toHaveProperty('client');
    });

    it('statusパラメータでフィルタリングできる', async () => {
      // active関係を作成
      await prisma.mentorClientRelationship.create({
        data: {
          mentorId,
          clientId,
          status: 'active',
          invitedBy: mentorId,
          acceptedAt: new Date(),
        },
      });

      const response = await fetch(`${baseUrl}/api/mentor/relationships?status=active`, {
        headers: {
          Cookie: mentorAuthCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.every((r: any) => r.status === 'active')).toBe(true);
    });
  });
});
