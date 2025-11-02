import { NextResponse } from 'next/server';

/**
 * DELETE /api/users/account - アカウント削除（Mock実装）
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (body.confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: '確認文字列が正しくありません。"DELETE"と入力してください' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'アカウントを削除しました',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'アカウント削除に失敗しました' },
      { status: 500 }
    );
  }
}
