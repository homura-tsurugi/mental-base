// メンター関係終了API
// DELETE /api/mentor/relationships/[id]/terminate

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface TerminateRequest {
  reason?: string; // 終了理由（任意）
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証確認（クライアントまたはメンター）
    const session = await verifySession();
    const userId = session.userId;

    const { id: relationshipId } = await params;

    let body: TerminateRequest = {};
    try {
      body = await request.json();
    } catch {
      // ボディなしの場合は無視
    }
    const { reason } = body;

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

    // 2. 権限確認（メンターまたはクライアント本人のみ終了可能）
    if (
      relationship.mentorId !== userId &&
      relationship.clientId !== userId
    ) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    // 3. ステータス確認
    if (relationship.status === 'terminated') {
      return NextResponse.json(
        { error: 'この関係は既に終了しています' },
        { status: 400 }
      );
    }

    if (relationship.status === 'pending') {
      // pending状態の場合は招待をキャンセル扱い
      const updatedRelationship =
        await prisma.mentorClientRelationship.update({
          where: { id: relationshipId },
          data: {
            status: 'terminated',
            terminatedAt: new Date(),
            terminationReason: reason || '招待がキャンセルされました',
          },
        });

      // 通知を送信
      const recipientId =
        userId === relationship.mentorId
          ? relationship.clientId
          : relationship.mentorId;
      const senderName =
        userId === relationship.mentorId
          ? relationship.mentor.name
          : relationship.client.name;

      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'suggestion',
          title: 'メンター招待がキャンセルされました',
          message: `${senderName}さんがメンター招待をキャンセルしました。`,
          read: false,
        },
      });

      return NextResponse.json({
        data: {
          relationshipId: updatedRelationship.id,
          status: updatedRelationship.status,
          terminatedAt: updatedRelationship.terminatedAt,
          message: '招待をキャンセルしました',
        },
      });
    }

    // 4. active状態の関係を終了
    const updatedRelationship = await prisma.mentorClientRelationship.update({
      where: { id: relationshipId },
      data: {
        status: 'terminated',
        terminatedAt: new Date(),
        terminationReason: reason || '関係が終了されました',
      },
    });

    // 5. データアクセス権限を無効化
    await prisma.clientDataAccessPermission.updateMany({
      where: {
        relationshipId,
      },
      data: {
        isActive: false,
      },
    });

    // 6. 相手に通知を送信
    const recipientId =
      userId === relationship.mentorId
        ? relationship.clientId
        : relationship.mentorId;
    const senderName =
      userId === relationship.mentorId
        ? relationship.mentor.name
        : relationship.client.name;
    const recipientRole =
      userId === relationship.mentorId ? 'client' : 'mentor';

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'suggestion',
        title: 'メンター関係が終了しました',
        message: `${senderName}さんがメンター関係を終了しました。${recipientRole === 'mentor' ? 'このクライアントのデータにはアクセスできなくなりました。' : 'メンターはあなたのデータにアクセスできなくなりました。'}${reason ? `\n\n理由: ${reason}` : ''}`,
        read: false,
      },
    });

    return NextResponse.json({
      data: {
        relationshipId: updatedRelationship.id,
        status: updatedRelationship.status,
        terminatedAt: updatedRelationship.terminatedAt,
        message: 'メンター関係を終了しました',
      },
    });
  } catch (error) {
    console.error('メンター関係終了エラー:', error);
    return NextResponse.json(
      { error: '終了処理に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
