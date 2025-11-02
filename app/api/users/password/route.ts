// POST /api/users/password - パスワード変更

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcrypt';

/**
 * POST /api/users/password
 * ユーザーのパスワードを変更
 */
export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword, confirmPassword } = body;

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'すべての項目を入力してください',
        },
        { status: 400 }
      );
    }

    // 新しいパスワードのバリデーション（8文字以上）
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: '新しいパスワードは8文字以上で入力してください',
        },
        { status: 400 }
      );
    }

    // 確認パスワードの一致チェック
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: '新しいパスワードと確認用パスワードが一致しません',
        },
        { status: 400 }
      );
    }

    // 現在のユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
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

    // 現在のパスワード確認
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: '現在のパスワードが正しくありません',
        },
        { status: 401 }
      );
    }

    // 新しいパスワードをハッシュ化（ソルトラウンド10）
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワード更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードを変更しました',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
