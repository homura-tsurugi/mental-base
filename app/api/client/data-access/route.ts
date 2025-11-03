// クライアントデータアクセス制御API
// GET/PUT /api/client/data-access

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface UpdatePermissionRequest {
  relationshipId: string;
  allowGoals: boolean;
  allowTasks: boolean;
  allowLogs: boolean;
  allowReflections: boolean;
  allowAiReports: boolean;
}

/**
 * クライアントのデータアクセス権限一覧を取得
 * GET /api/client/data-access
 */
export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const session = await verifySession();
    const clientId = session.userId;

    // クライアントの全メンター関係とアクセス権限を取得
    const relationships = await prisma.mentorClientRelationship.findMany({
      where: {
        clientId,
        status: { in: ['active', 'pending'] }, // activeとpending状態のみ
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessPermissions: {
          where: {
            clientId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = relationships.map((rel) => {
      const permission = rel.accessPermissions || null;

      return {
        relationshipId: rel.id,
        mentorId: rel.mentorId,
        mentorName: rel.mentor.name,
        mentorEmail: rel.mentor.email,
        relationshipStatus: rel.status,
        invitedAt: rel.invitedAt,
        acceptedAt: rel.acceptedAt,
        permissions: permission
          ? {
              id: permission.id,
              allowGoals: permission.allowGoals,
              allowTasks: permission.allowTasks,
              allowLogs: permission.allowLogs,
              allowReflections: permission.allowReflections,
              allowAiReports: permission.allowAiReports,
              isActive: permission.isActive,
              createdAt: permission.createdAt,
              updatedAt: permission.updatedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('データアクセス権限取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}

/**
 * クライアントのデータアクセス権限を更新
 * PUT /api/client/data-access
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証確認
    const session = await verifySession();
    const clientId = session.userId;

    const body: UpdatePermissionRequest = await request.json();
    const {
      relationshipId,
      allowGoals,
      allowTasks,
      allowLogs,
      allowReflections,
      allowAiReports,
    } = body;

    if (!relationshipId) {
      return NextResponse.json(
        { error: 'relationshipIdは必須です' },
        { status: 400 }
      );
    }

    // 1. 関係が存在し、クライアント本人のものか確認
    const relationship = await prisma.mentorClientRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: '指定された関係が見つかりません' },
        { status: 404 }
      );
    }

    if (relationship.clientId !== clientId) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    // 2. 権限レコードを取得または作成
    let permission = await prisma.clientDataAccessPermission.findUnique({
      where: { relationshipId },
    });

    if (!permission) {
      // 権限レコードが存在しない場合は作成
      permission = await prisma.clientDataAccessPermission.create({
        data: {
          relationshipId,
          clientId,
          allowGoals,
          allowTasks,
          allowLogs,
          allowReflections,
          allowAiReports,
          isActive: relationship.status === 'active', // active状態のみ有効
        },
      });
    } else {
      // 既存の権限レコードを更新
      permission = await prisma.clientDataAccessPermission.update({
        where: { relationshipId },
        data: {
          allowGoals,
          allowTasks,
          allowLogs,
          allowReflections,
          allowAiReports,
        },
      });
    }

    // 3. メンターに通知を送信（権限が変更されたことを伝える）
    const changedPermissions = [];
    if (allowGoals !== permission.allowGoals)
      changedPermissions.push('目標');
    if (allowTasks !== permission.allowTasks)
      changedPermissions.push('タスク');
    if (allowLogs !== permission.allowLogs) changedPermissions.push('ログ');
    if (allowReflections !== permission.allowReflections)
      changedPermissions.push('振り返り');
    if (allowAiReports !== permission.allowAiReports)
      changedPermissions.push('AI分析レポート');

    if (changedPermissions.length > 0) {
      await prisma.notification.create({
        data: {
          userId: relationship.mentorId,
          type: 'suggestion',
          title: 'クライアントのデータアクセス権限が変更されました',
          message: `${session.userName || 'クライアント'}さんがデータアクセス権限を変更しました。変更された項目: ${changedPermissions.join('、')}`,
          read: false,
        },
      });
    }

    return NextResponse.json({
      data: {
        id: permission.id,
        relationshipId: permission.relationshipId,
        clientId: permission.clientId,
        allowGoals: permission.allowGoals,
        allowTasks: permission.allowTasks,
        allowLogs: permission.allowLogs,
        allowReflections: permission.allowReflections,
        allowAiReports: permission.allowAiReports,
        isActive: permission.isActive,
        updatedAt: permission.updatedAt,
        message: 'データアクセス権限を更新しました',
      },
    });
  } catch (error) {
    console.error('データアクセス権限更新エラー:', error);
    return NextResponse.json(
      { error: '更新に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
