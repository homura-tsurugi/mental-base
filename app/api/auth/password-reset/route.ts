// POST /api/auth/password-reset
// パスワードリセットリクエストエンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // バリデーション
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレスを入力してください',
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

    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す
      return NextResponse.json({
        success: true,
        message: 'パスワードリセットのメールを送信しました',
      });
    }

    // リセットトークン生成（32バイトのランダム文字列）
    const resetToken = crypto.randomBytes(32).toString('hex');

    // トークンの有効期限（1時間後）
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    // 既存のトークンを削除して新しいトークンを作成
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires,
      },
    });

    // TODO: メール送信実装
    // 実際の実装では、ここでResend等のメール送信サービスを使用
    // const resetUrl = `${process.env.NEXTAUTH_URL}/auth?view=new-password&token=${resetToken}`;
    // await sendPasswordResetEmail(email, resetUrl);

    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/auth?view=new-password&token=${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'パスワードリセットのメールを送信しました',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
