import { NextResponse } from 'next/server';

/**
 * GET /api/reflections - 振り返り履歴取得（Mock実装）
 */
export async function GET() {
  const mockReflections = [
    {
      id: '1',
      userId: '1',
      content: '今週は目標に対して80%の進捗を達成できました。特にタスク管理の効率化が功を奏しています。来週はさらにペースを上げて100%達成を目指します。',
      type: 'weekly',
      date: '2025-01-15',
      createdAt: '2025-01-15T18:00:00Z',
      updatedAt: '2025-01-15T18:00:00Z',
    },
    {
      id: '2',
      userId: '1',
      content: '今日は計画通りに進めることができました。午前中の集中力が高く、主要タスクを完了できたのが良かったです。明日は午後の時間管理に注意したいと思います。',
      type: 'daily',
      date: '2025-01-14',
      createdAt: '2025-01-14T20:30:00Z',
      updatedAt: '2025-01-14T20:30:00Z',
    },
    {
      id: '3',
      userId: '1',
      content: '今月の目標達成率は75%でした。目標設定が適切だったと感じています。次月はより高い目標にチャレンジしたいです。',
      type: 'monthly',
      date: '2025-01-01',
      createdAt: '2025-01-01T23:00:00Z',
      updatedAt: '2025-01-01T23:00:00Z',
    },
  ];

  return NextResponse.json({ data: mockReflections });
}

/**
 * POST /api/reflections - 振り返り作成（Mock実装）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: '振り返り内容は必須です' },
        { status: 400 }
      );
    }

    if (!body.type || !['daily', 'weekly', 'monthly'].includes(body.type)) {
      return NextResponse.json(
        { error: '振り返りタイプは daily, weekly, monthly のいずれかである必要があります' },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { error: '日付は必須です' },
        { status: 400 }
      );
    }

    const newReflection = {
      id: String(Date.now()),
      userId: '1',
      content: body.content,
      type: body.type,
      date: body.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: newReflection }, { status: 201 });
  } catch (error) {
    console.error('Reflection creation error:', error);
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
