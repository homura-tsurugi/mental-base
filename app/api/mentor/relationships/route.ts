// メンター-クライアント関係一覧API
// GET /api/mentor/relationships

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    // メンターの全関係（active, pending, terminated）を取得
    const relationships = await prisma.mentorClientRelationship.findMany({
      where: {
        mentorId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessPermissions: {
          where: {
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = relationships.map((rel) => ({
      id: rel.id,
      mentorId: rel.mentorId,
      clientId: rel.clientId,
      clientName: rel.client.name,
      clientEmail: rel.client.email,
      status: rel.status,
      invitedBy: rel.invitedBy,
      invitedAt: rel.invitedAt,
      acceptedAt: rel.acceptedAt,
      terminatedAt: rel.terminatedAt,
      terminationReason: rel.terminationReason,
      hasActivePermissions: rel.accessPermissions.length > 0,
      createdAt: rel.createdAt,
      updatedAt: rel.updatedAt,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('メンター-クライアント関係一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
