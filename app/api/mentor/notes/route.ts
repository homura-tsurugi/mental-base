// メンターノートAPI
// GET /api/mentor/notes - ノート一覧取得
// POST /api/mentor/notes - ノート作成

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';

/**
 * メンターノート一覧取得
 * GET /api/mentor/notes?clientId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientIdが必要です' },
        { status: 400 }
      );
    }

    // メンター-クライアント関係を確認
    const relationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId,
        status: 'active',
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'アクティブなメンター-クライアント関係が見つかりません' },
        { status: 404 }
      );
    }

    // ノート一覧を取得
    const notes = await prisma.mentorNote.findMany({
      where: {
        mentorId,
        clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error('ノート一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'ノートの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}

/**
 * メンターノート作成
 * POST /api/mentor/notes
 */
export async function POST(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const body = await request.json();
    const {
      clientId,
      title,
      content,
      noteType,
      isSharedWithClient,
      tags,
      linkedDataType,
      linkedDataId,
    } = body;

    if (!clientId || !title || !content) {
      return NextResponse.json(
        {
          error: '必須項目が不足しています（clientId, title, contentは必須）',
        },
        { status: 400 }
      );
    }

    // メンター-クライアント関係を確認
    const relationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId,
        status: 'active',
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'アクティブなメンター-クライアント関係が見つかりません' },
        { status: 404 }
      );
    }

    // ノートを作成
    const note = await prisma.mentorNote.create({
      data: {
        mentorId,
        clientId,
        title,
        content,
        noteType: noteType || 'general',
        isSharedWithClient:
          isSharedWithClient !== undefined ? isSharedWithClient : false,
        tags: tags || [],
        linkedDataType: linkedDataType || null,
        linkedDataId: linkedDataId || null,
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error('ノート作成エラー:', error);
    return NextResponse.json(
      { error: 'ノートの作成に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
