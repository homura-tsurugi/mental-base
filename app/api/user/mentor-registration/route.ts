// ユーザー管理API - メンター登録
// PUT /api/user/mentor-registration - メンター登録・プロフィール更新

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface MentorRegistrationRequest {
  bio?: string;
  expertise?: string[];
}

/**
 * メンター登録・プロフィール更新
 * PUT /api/user/mentor-registration
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証確認
    const session = await verifySession();
    const userId = session.userId;

    const body: MentorRegistrationRequest = await request.json();
    const { bio, expertise } = body;

    // 現在のユーザー情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // メンター登録（role を mentor に設定し、isMentor を true に）
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'mentor',
        isMentor: true,
        ...(bio !== undefined && { bio }),
        ...(expertise !== undefined && { expertise }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isMentor: true,
        bio: true,
        expertise: true,
      },
    });

    // メンター登録完了通知（初回登録の場合のみ）
    if (!currentUser.isMentor) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: 'メンター登録が完了しました',
          message:
            'メンターとして登録されました。クライアントを招待して、成長をサポートしましょう。',
          read: false,
        },
      });
    }

    return NextResponse.json({
      data: updatedUser,
      message: currentUser.isMentor
        ? 'メンタープロフィールを更新しました'
        : 'メンターとして登録しました',
    });
  } catch (error) {
    console.error('メンター登録エラー:', error);
    return NextResponse.json(
      { error: 'メンター登録に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
