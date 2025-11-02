// メンターノートAPI
// GET /api/mentor/notes - ノート一覧取得
// POST /api/mentor/notes - ノート作成

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';

export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientIdが必要です' },
        { status: 400 }
      );
    }

    // TODO: 実際のデータベースからノート取得（マイグレーション後）
    const mockNotes = [
      {
        id: 'note-001',
        mentorId: session.userId,
        clientId,
        title: '初回面談の記録',
        content: 'クライアントとの初回面談。目標設定について話し合いました。',
        noteType: 'general',
        isPrivate: true,
        tags: ['初回', '面談'],
        linkedDataType: null,
        linkedDataId: null,
        createdAt: new Date(2024, 10, 1).toISOString(),
        updatedAt: new Date(2024, 10, 1).toISOString(),
      },
    ];

    return NextResponse.json({ notes: mockNotes });
  } catch (error) {
    console.error('ノート一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ノートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();

    const body = await request.json();
    const { clientId, title, content, noteType, isPrivate, tags } = body;

    if (!clientId || !title || !content) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // TODO: 実際のデータベースにノート保存（マイグレーション後）
    const mockNote = {
      id: `note-${Date.now()}`,
      mentorId: session.userId,
      clientId,
      title,
      content,
      noteType: noteType || 'general',
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      tags: tags || [],
      linkedDataType: null,
      linkedDataId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ note: mockNote }, { status: 201 });
  } catch (error) {
    console.error('ノート作成エラー:', error);
    return NextResponse.json(
      { error: 'ノートの作成に失敗しました' },
      { status: 500 }
    );
  }
}
