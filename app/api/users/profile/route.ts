import { NextResponse } from 'next/server';

/**
 * GET /api/users/profile - プロフィール取得（Mock実装）
 */
export async function GET() {
  const mockUser = {
    id: '1',
    name: '田中 太郎',
    email: 'test@mentalbase.local',
    role: 'client',
    createdAt: '2025-01-01T00:00:00Z',
  };

  return NextResponse.json({ data: mockUser });
}

/**
 * PUT /api/users/profile - プロフィール更新（Mock実装）
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
        { status: 400 }
      );
    }

    const updatedUser = {
      id: '1',
      name: body.name,
      email: body.email,
      role: 'client',
      createdAt: '2025-01-01T00:00:00Z',
    };

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: 'プロフィール更新に失敗しました' },
      { status: 500 }
    );
  }
}
