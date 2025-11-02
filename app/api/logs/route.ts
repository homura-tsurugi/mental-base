import { NextResponse } from 'next/server';

/**
 * GET /api/logs - ログ履歴取得（Mock実装）
 */
export async function GET() {
  const mockLogs = [
    {
      id: '1',
      userId: '1',
      content: '今日は午前中に会議が3つあり、午後は資料作成に集中しました。進捗は順調です。',
      date: '2025-01-15',
      createdAt: '2025-01-15T09:30:00Z',
      updatedAt: '2025-01-15T09:30:00Z',
    },
    {
      id: '2',
      userId: '1',
      content: 'プロジェクトの企画書を完成させました。チームメンバーからの フィードバックも良好でした。',
      date: '2025-01-14',
      createdAt: '2025-01-14T14:20:00Z',
      updatedAt: '2025-01-14T14:20:00Z',
    },
    {
      id: '3',
      userId: '1',
      content: '新しいスキルの勉強を始めました。基礎から丁寧に学んでいます。',
      date: '2025-01-13',
      createdAt: '2025-01-13T21:10:00Z',
      updatedAt: '2025-01-13T21:10:00Z',
    },
  ];

  return NextResponse.json({ data: mockLogs });
}

/**
 * POST /api/logs - ログ作成（Mock実装）
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'ログ内容は必須です' },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { error: '日付は必須です' },
        { status: 400 }
      );
    }

    const newLog = {
      id: String(Date.now()),
      userId: '1',
      content: body.content,
      date: body.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: newLog }, { status: 201 });
  } catch (error) {
    console.error('Log creation error:', error);
    return NextResponse.json(
      { error: 'ログの作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logs - ログ更新（Mock実装）
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ログIDは必須です' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'ログ内容は必須です' },
        { status: 400 }
      );
    }

    const updatedLog = {
      id: body.id,
      userId: '1',
      content: body.content,
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: '2025-01-15T09:30:00Z',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: updatedLog });
  } catch (error) {
    console.error('Log update error:', error);
    return NextResponse.json(
      { error: 'ログの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/logs - ログ削除（Mock実装）
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ログIDは必須です' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ログを削除しました',
    });
  } catch (error) {
    console.error('Log deletion error:', error);
    return NextResponse.json(
      { error: 'ログの削除に失敗しました' },
      { status: 500 }
    );
  }
}
