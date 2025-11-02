// DELETE /api/users/account - アカウント削除（カスケード削除）
// 複合処理-UAS-001: ユーザーアカウントと関連するすべてのデータを削除

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * DELETE /api/users/account
 * ユーザーアカウントと関連するすべてのデータを削除
 *
 * 処理フロー（トランザクション内）:
 * 1. 認証確認
 * 2. 関連データ削除（Goal, Task, Log, Reflection, etc.）
 * 3. セッション削除
 * 4. ユーザー削除
 */
export async function DELETE(request: NextRequest) {
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
    const { userId, confirmationText } = body;

    // リクエストボディのuserIdとセッションのuserIdが一致するか確認
    if (userId && userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: '権限がありません',
        },
        { status: 403 }
      );
    }

    // 確認テキストのバリデーション（オプション）
    if (confirmationText && confirmationText !== '削除する') {
      return NextResponse.json(
        {
          success: false,
          error: '確認テキストが正しくありません',
        },
        { status: 400 }
      );
    }

    const userIdToDelete = session.user.id;

    // トランザクション処理で関連データを削除
    await prisma.$transaction(async (tx) => {
      // 1. チャットメッセージ削除
      await tx.chatMessage.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 2. アクションプラン削除
      await tx.actionPlan.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 3. AI分析レポート削除
      await tx.aIAnalysisReport.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 4. 振り返り削除
      await tx.reflection.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 5. ログ削除
      await tx.log.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 6. タスク削除
      await tx.task.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 7. 目標削除
      await tx.goal.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 8. 通知削除
      await tx.notification.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 9. ユーザー設定削除
      await tx.userSettings.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 10. セッション削除
      await tx.session.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 11. パスワードリセットトークン削除
      await tx.passwordResetToken.deleteMany({
        where: { userId: userIdToDelete },
      });

      // 12. ユーザー削除（最後に実行）
      await tx.user.delete({
        where: { id: userIdToDelete },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'アカウントを削除しました',
    });
  } catch (error) {
    console.error('Account deletion error:', error);

    // トランザクションエラーの場合は詳細を返す
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: 'アカウント削除に失敗しました',
          detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
