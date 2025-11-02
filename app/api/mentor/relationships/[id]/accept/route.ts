// メンター招待承認API
// POST /api/mentor/relationships/[id]/accept

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証確認（クライアントまたはメンター）
    const session = await verifySession();
    const userId = session.userId;

    const { id: relationshipId } = await params;

    // 1. 関係を取得
    const relationship = await prisma.mentorClientRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: '指定された関係が見つかりません' },
        { status: 404 }
      );
    }

    // 2. 権限確認（クライアント本人のみ承認可能）
    if (relationship.clientId !== userId) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    // 3. ステータス確認
    if (relationship.status !== 'pending') {
      return NextResponse.json(
        {
          error: `この招待は既に${relationship.status === 'active' ? '承認済み' : '終了'}です`,
        },
        { status: 400 }
      );
    }

    // 4. 関係のステータスをpending→activeに変更
    const updatedRelationship =
      await prisma.mentorClientRelationship.update({
        where: { id: relationshipId },
        data: {
          status: 'active',
          acceptedAt: new Date(),
        },
      });

    // 5. データアクセス権限をアクティブ化
    await prisma.clientDataAccessPermission.updateMany({
      where: {
        relationshipId,
      },
      data: {
        isActive: true,
      },
    });

    // 6. メンターに通知を送信
    await prisma.notification.create({
      data: {
        userId: relationship.mentorId,
        type: 'achievement',
        title: 'クライアントが招待を承認しました',
        message: `${relationship.client.name}さんがメンター招待を承認しました。メンターダッシュボードでデータを確認できます。`,
        read: false,
      },
    });

    // 7. クライアントに確認通知を送信（緩和策）
    await prisma.notification.create({
      data: {
        userId: relationship.clientId,
        type: 'suggestion',
        title: 'メンター関係が成立しました',
        message: `${relationship.mentor.name}さんとのメンター関係が成立しました。デフォルトで全てのデータ（目標、タスク、ログ、振り返り、AI分析レポート）が公開されています。設定ページでデータアクセス権限を変更できます。`,
        read: false,
      },
    });

    return NextResponse.json({
      data: {
        relationshipId: updatedRelationship.id,
        status: updatedRelationship.status,
        acceptedAt: updatedRelationship.acceptedAt,
        message: 'メンター招待を承認しました',
      },
    });
  } catch (error) {
    console.error('メンター招待承認エラー:', error);
    return NextResponse.json(
      { error: '承認処理に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
