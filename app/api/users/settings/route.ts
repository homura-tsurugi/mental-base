import { NextResponse } from 'next/server';

/**
 * GET /api/users/settings - ユーザー設定取得（Mock実装）
 */
export async function GET() {
  const mockSettings = {
    userId: '1',
    emailNotifications: true,
    pushNotifications: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  return NextResponse.json({ data: mockSettings });
}

/**
 * PUT /api/users/settings - 通知設定更新（Mock実装）
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updatedSettings = {
      userId: '1',
      emailNotifications: body.emailNotifications ?? true,
      pushNotifications: body.pushNotifications ?? false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ data: updatedSettings });
  } catch (error) {
    return NextResponse.json(
      { error: '設定更新に失敗しました' },
      { status: 500 }
    );
  }
}
