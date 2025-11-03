// パスワードリセット検証・更新API
// POST /api/auth/password-reset/verify

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'トークンと新しいパスワードが必要です' },
        { status: 400 }
      );
    }

    // パスワードの強度チェック
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      );
    }

    // トークンを検索
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限チェック
    if (resetToken.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: 'トークンの有効期限が切れています。もう一度リセットをリクエストしてください。' },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // 使用済みトークンを削除
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    // 該当ユーザーの他の全てのリセットトークンも削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    console.log(`パスワードリセット成功: ${resetToken.user.email}`);

    return NextResponse.json({
      message: 'パスワードが正常に更新されました',
    });
  } catch (error) {
    console.error('パスワードリセット検証エラー:', error);
    return NextResponse.json(
      { error: 'パスワードの更新に失敗しました' },
      { status: 500 }
    );
  }
}
