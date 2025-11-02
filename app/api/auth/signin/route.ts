// POST /api/auth/signin - ユーザーログイン（Credentials認証）
// NextAuth v5 Credentials Providerのラッパー

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signIn } from '@/lib/auth';

/**
 * POST /api/auth/signin
 * メールアドレスとパスワードでログイン
 *
 * NextAuth v5では通常 /api/auth/callback/credentials を使用するが、
 * テストやカスタムフォームとの互換性のため、このエンドポイントを提供
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレスとパスワードを入力してください',
        },
        { status: 400 }
      );
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 }
      );
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 }
      );
    }

    // NextAuth signIn を実行
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      return NextResponse.json({
        success: true,
        message: 'ログインしました',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (signInError) {
      console.error('SignIn error:', signInError);
      return NextResponse.json(
        {
          success: false,
          error: 'ログインに失敗しました',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
