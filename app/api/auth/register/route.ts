// POST /api/auth/register
// 新規ユーザー登録エンドポイント

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
        },
        { status: 400 }
      );
    }

    // 名前のバリデーション（2文字以上）
    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '名前は2文字以上で入力してください',
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

    // パスワードのバリデーション（8文字以上）
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'パスワードは8文字以上で入力してください',
        },
        { status: 400 }
      );
    }

    // メールアドレス重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'このメールアドレスは既に登録されています',
        },
        { status: 409 }
      );
    }

    // パスワードハッシュ化（ソルトラウンド10）
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'アカウントが作成されました',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
