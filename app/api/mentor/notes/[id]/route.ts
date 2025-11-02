// メンターノート個別API
// GET /api/mentor/notes/[id] - ノート取得
// PUT /api/mentor/notes/[id] - ノート編集
// DELETE /api/mentor/notes/[id] - ノート削除

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * メンターノート取得
 * GET /api/mentor/notes/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: noteId } = await params;

    // ノートを取得
    const note = await prisma.mentorNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'ノートが見つかりません' },
        { status: 404 }
      );
    }

    // 本人のノートか確認
    if (note.mentorId !== mentorId) {
      return NextResponse.json(
        { error: 'このノートへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: note });
  } catch (error) {
    console.error('ノート取得エラー:', error);
    return NextResponse.json(
      { error: 'ノートの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}

/**
 * メンターノート更新
 * PUT /api/mentor/notes/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: noteId } = await params;
    const body = await request.json();
    const {
      title,
      content,
      noteType,
      isSharedWithClient,
      tags,
      linkedDataType,
      linkedDataId,
    } = body;

    // ノートを取得
    const note = await prisma.mentorNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'ノートが見つかりません' },
        { status: 404 }
      );
    }

    // 本人のノートか確認
    if (note.mentorId !== mentorId) {
      return NextResponse.json(
        { error: 'このノートへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // ノートを更新
    const updatedNote = await prisma.mentorNote.update({
      where: { id: noteId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(noteType !== undefined && { noteType }),
        ...(isSharedWithClient !== undefined && { isSharedWithClient }),
        ...(tags !== undefined && { tags }),
        ...(linkedDataType !== undefined && { linkedDataType }),
        ...(linkedDataId !== undefined && { linkedDataId }),
      },
    });

    return NextResponse.json({ data: updatedNote });
  } catch (error) {
    console.error('ノート更新エラー:', error);
    return NextResponse.json(
      { error: 'ノートの更新に失敗しました', detail: error },
      { status: 500 }
    );
  }
}

/**
 * メンターノート削除
 * DELETE /api/mentor/notes/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: noteId } = await params;

    // ノートを取得
    const note = await prisma.mentorNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json(
        { error: 'ノートが見つかりません' },
        { status: 404 }
      );
    }

    // 本人のノートか確認
    if (note.mentorId !== mentorId) {
      return NextResponse.json(
        { error: 'このノートへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // ノートを削除
    await prisma.mentorNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: 'ノートを削除しました' });
  } catch (error) {
    console.error('ノート削除エラー:', error);
    return NextResponse.json(
      { error: 'ノートの削除に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
