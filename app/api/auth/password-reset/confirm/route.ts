// POST /api/auth/password-reset/confirm
// 新しいパスワード設定エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    // バリデーション
    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
        },
        { status: 400 }
      );
    }

    // パスワード一致確認
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'パスワードが一致しません',
        },
        { status: 400 }
      );
    }

    // パスワードのバリデーション（8文字以上）
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'パスワードは8文字以上で入力してください',
        },
        { status: 400 }
      );
    }

    // トークン検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なトークンです',
        },
        { status: 400 }
      );
    }

    // トークン有効期限確認
    if (resetToken.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'トークンの有効期限が切れています',
        },
        { status: 400 }
      );
    }

    // パスワードハッシュ化（ソルトラウンド10）
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワード更新
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 使用済みトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: 'パスワードが変更されました',
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
