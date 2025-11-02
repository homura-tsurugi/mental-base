import { NextResponse } from 'next/server';

/**
 * POST /api/users/password - パスワード変更（Mock実装）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.currentPassword || !body.newPassword || !body.confirmPassword) {
      return NextResponse.json(
        { error: 'すべてのフィールドを入力してください' },
        { status: 400 }
      );
    }

    if (body.newPassword !== body.confirmPassword) {
      return NextResponse.json(
        { error: '新しいパスワードが一致しません' },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: '新しいパスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    if (body.currentPassword !== 'MentalBase2025!Dev') {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードを変更しました',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'パスワード変更に失敗しました' },
      { status: 500 }
    );
  }
}
