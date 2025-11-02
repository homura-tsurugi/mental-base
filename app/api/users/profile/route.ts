// GET /api/users/profile - プロフィール情報取得
// PUT /api/users/profile - プロフィール情報更新

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * GET /api/users/profile
 * 現在ログイン中のユーザーのプロフィール情報を取得
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

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'ユーザーが見つかりません',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
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
 * PUT /api/users/profile
 * ユーザーのプロフィール情報を更新
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
    const { name, email } = body;

    // バリデーション
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: '名前とメールアドレスは必須です',
        },
        { status: 400 }
      );
    }

    // 名前のバリデーション（1文字以上）
    if (name.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: '名前は1文字以上で入力してください',
        },
        { status: 400 }
      );
    }

    // メールアドレス形式のバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: '有効なメールアドレスを入力してください',
        },
        { status: 400 }
      );
    }

    // メールアドレス重複チェック（自分以外）
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'このメールアドレスは既に使用されています',
          },
          { status: 409 }
        );
      }
    }

    // プロフィール更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'プロフィールを更新しました',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
