// メンターノート個別API
// GET /api/mentor/notes/[id] - ノート取得
// PUT /api/mentor/notes/[id] - ノート編集
// DELETE /api/mentor/notes/[id] - ノート削除

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    await verifyMentor();

    const { id: noteId } = await params;

    // TODO: 実際のデータベースからノート取得（マイグレーション後）
    const mockNote = {
      id: noteId,
      title: 'サンプルノート',
      content: 'ノートの内容',
      noteType: 'general',
      isPrivate: true,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ note: mockNote });
  } catch (error) {
    console.error('ノート取得エラー:', error);
    return NextResponse.json(
      { error: 'ノートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    await verifyMentor();

    const { id: noteId } = await params;
    const body = await request.json();
    const { title, content, noteType, isPrivate, tags } = body;

    // TODO: 実際のデータベースでノート更新（マイグレーション後）
    const mockNote = {
      id: noteId,
      title,
      content,
      noteType,
      isPrivate,
      tags,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ note: mockNote });
  } catch (error) {
    console.error('ノート更新エラー:', error);
    return NextResponse.json(
      { error: 'ノートの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    await verifyMentor();

    const { id: noteId } = await params;

    // TODO: 実際のデータベースからノート削除（マイグレーション後）

    return NextResponse.json({ message: 'ノートを削除しました' });
  } catch (error) {
    console.error('ノート削除エラー:', error);
    return NextResponse.json(
      { error: 'ノートの削除に失敗しました' },
      { status: 500 }
    );
  }
}
