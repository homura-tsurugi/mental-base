// PUT /api/goals/{id} - 目標更新
// DELETE /api/goals/{id} - 目標削除（カスケード削除）

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// PUT /api/goals/{id} - 目標更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const { id } = await params;
    const body = await request.json();
    const { title, description, deadline, status } = body;

    // 目標の存在確認と権限チェック
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: '目標が見つかりません' },
        { status: 404 }
      );
    }

    if (existingGoal.userId !== userId) {
      return NextResponse.json(
        { error: 'この目標を編集する権限がありません' },
        { status: 403 }
      );
    }

    // バリデーション
    if (title !== undefined && !title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        { error: 'タイトルは200文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: '説明は5000文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (status && !['active', 'completed', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: '無効なステータスです' },
        { status: 400 }
      );
    }

    // 目標更新（部分更新対応）
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updatedGoal, { status: 200 });
  } catch (error) {
    console.error('Goal PUT error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/{id} - 目標削除（カスケード削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    const { id } = await params;

    // 目標の存在確認と権限チェック
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: '目標が見つかりません' },
        { status: 404 }
      );
    }

    if (existingGoal.userId !== userId) {
      return NextResponse.json(
        { error: 'この目標を削除する権限がありません' },
        { status: 403 }
      );
    }

    // 目標削除（関連タスクはPrismaのonDelete: Cascadeで自動削除される）
    await prisma.goal.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Goal DELETE error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
