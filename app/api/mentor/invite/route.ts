// メンター招待API
// POST /api/mentor/invite

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface InviteRequest {
  clientEmail: string;
  message?: string; // オプション: 招待メッセージ
}

export async function POST(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const body: InviteRequest = await request.json();
    const { clientEmail, message } = body;

    if (!clientEmail || !clientEmail.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 1. クライアントが既にユーザーとして登録されているかチェック
    const client = await prisma.user.findUnique({
      where: { email: clientEmail },
    });

    if (!client) {
      return NextResponse.json(
        {
          error:
            '指定されたメールアドレスのユーザーが見つかりません。クライアントに先にアカウント登録をしてもらってください。',
        },
        { status: 404 }
      );
    }

    const clientId = client.id;

    // 2. 既に関係が存在しないかチェック
    const existingRelationship =
      await prisma.mentorClientRelationship.findUnique({
        where: {
          mentorId_clientId: {
            mentorId,
            clientId,
          },
        },
      });

    if (existingRelationship) {
      if (existingRelationship.status === 'active') {
        return NextResponse.json(
          { error: '既にこのクライアントと関係が成立しています' },
          { status: 409 }
        );
      } else if (existingRelationship.status === 'pending') {
        return NextResponse.json(
          { error: '既にこのクライアントに招待を送信しています（承認待ち）' },
          { status: 409 }
        );
      } else if (existingRelationship.status === 'terminated') {
        // 終了済みの関係を再開することは可能（新規関係として扱う）
        return NextResponse.json(
          {
            error:
              'このクライアントとの関係は過去に終了しています。再度招待する場合は、既存の関係を削除してから行ってください。',
          },
          { status: 409 }
        );
      }
    }

    // 3. MentorClientRelationshipレコードを作成（status: pending）
    const relationship = await prisma.mentorClientRelationship.create({
      data: {
        mentorId,
        clientId,
        status: 'pending',
        invitedBy: mentorId,
      },
    });

    // 4. ClientDataAccessPermissionレコードを作成（デフォルト全て許可、ただしisActive: false）
    // 関係が承認されたらisActive: trueに変更
    await prisma.clientDataAccessPermission.create({
      data: {
        relationshipId: relationship.id,
        clientId,
        allowGoals: true,
        allowTasks: true,
        allowLogs: true,
        allowReflections: true,
        allowAiReports: true,
        isActive: false, // 承認されるまで無効
      },
    });

    // 5. 通知を作成（クライアント向け）
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'suggestion',
        title: 'メンターから招待が届きました',
        message: `${session.userName || 'メンター'}さんからメンターとしての招待が届いています。設定ページで承認・拒否ができます。${message ? `\n\nメッセージ: ${message}` : ''}`,
        read: false,
      },
    });

    return NextResponse.json({
      data: {
        relationshipId: relationship.id,
        clientId,
        clientName: client.name,
        clientEmail: client.email,
        status: 'pending',
        invitedAt: relationship.invitedAt,
        message: '招待を送信しました。クライアントの承認をお待ちください。',
      },
    });
  } catch (error) {
    console.error('メンター招待エラー:', error);
    return NextResponse.json(
      { error: '招待の送信に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
