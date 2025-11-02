// GET /api/users/settings - ユーザー設定取得
// PUT /api/users/settings - 通知設定更新

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/users/settings
 * 現在ログイン中のユーザーの設定情報を取得
 */
export async function GET() {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です',
        },
        { status: 401 }
      );
    }

    // ユーザー設定取得（存在しない場合は作成）
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // 設定が存在しない場合はデフォルト設定を作成
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          theme: 'professional',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userSettings.userId,
        emailNotifications: userSettings.emailNotifications,
        reminderTime: userSettings.reminderTime,
        theme: userSettings.theme,
        updatedAt: userSettings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/settings
 * ユーザーの通知設定を更新
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailNotifications, reminderTime } = body;

    // バリデーション
    if (emailNotifications === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'emailNotificationsは必須です',
        },
        { status: 400 }
      );
    }

    // reminderTimeのバリデーション（HH:mm形式）
    if (reminderTime !== undefined && reminderTime !== null) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(reminderTime)) {
        return NextResponse.json(
          {
            success: false,
            error: 'reminderTimeはHH:mm形式で入力してください（例: 09:00）',
          },
          { status: 400 }
        );
      }
    }

    // 設定を更新（存在しない場合は作成）
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        emailNotifications,
        reminderTime: reminderTime || null,
      },
      create: {
        userId: session.user.id,
        emailNotifications,
        reminderTime: reminderTime || null,
        theme: 'professional',
      },
    });

    return NextResponse.json({
      success: true,
      message: '設定を更新しました',
      data: {
        userId: updatedSettings.userId,
        emailNotifications: updatedSettings.emailNotifications,
        reminderTime: updatedSettings.reminderTime,
        theme: updatedSettings.theme,
        updatedAt: updatedSettings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
