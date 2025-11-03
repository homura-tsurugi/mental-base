import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

/**
 * GET /api/reflections - 振り返り履歴取得
 */
export async function GET() {
  try {
    const session = await verifySession();

    const reflections = await prisma.reflection.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: reflections });
  } catch (error) {
    console.error('Reflections GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: '振り返り履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reflections - 振り返り作成
 */
export async function POST(request: Request) {
  try {
    const session = await verifySession();
    const body = await request.json();

    // バリデーション
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: '振り返り内容は必須です' },
        { status: 400 }
      );
    }

    if (!body.period || !['daily', 'weekly', 'monthly'].includes(body.period)) {
      return NextResponse.json(
        { error: '期間タイプは daily, weekly, monthly のいずれかである必要があります' },
        { status: 400 }
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: '開始日と終了日は必須です' },
        { status: 400 }
      );
    }

    // 振り返り作成
    const newReflection = await prisma.reflection.create({
      data: {
        userId: session.userId,
        period: body.period,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        content: body.content,
        achievements: body.achievements || null,
        challenges: body.challenges || null,
      },
    });

    return NextResponse.json(newReflection, { status: 201 });
  } catch (error) {
    console.error('Reflection creation error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: '振り返りの作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reflections - 振り返り更新（Mock実装）
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: '振り返りIDは必須です' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: '振り返り内容は必須です' },
        { status: 400 }
      );
    }

    const updatedReflection = {
      id: body.id,
      userId: '1',
      content: body.content,
      type: body.type || 'daily',
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: '2025-01-15T18:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: updatedReflection });
  } catch (error) {
    console.error('Reflection update error:', error);
    return NextResponse.json(
      { error: '振り返りの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reflections - 振り返り削除（Mock実装）
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: '振り返りIDは必須です' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '振り返りを削除しました',
    });
  } catch (error) {
    console.error('Reflection deletion error:', error);
    return NextResponse.json(
      { error: '振り返りの削除に失敗しました' },
      { status: 500 }
    );
  }
}
