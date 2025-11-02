// /api/reflections - 振り返り記録API

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/reflections - 振り返り記録一覧取得
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // limitの範囲チェック（1～100）
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: 'limitは1～100の範囲で指定してください',
          detail: { code: 'INVALID_LIMIT', limit },
        },
        { status: 400 }
      );
    }

    // 振り返り記録を取得
    const reflections = await prisma.reflection.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc', // 新しい順
      },
      take: limit,
    });

    return NextResponse.json(reflections, { status: 200 });
  } catch (error) {
    console.error('Reflections GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// POST /api/reflections - 振り返り記録作成
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // リクエストボディを取得
    const body = await request.json();
    const { period, startDate, endDate, content, achievements, challenges } = body;

    // バリデーション
    if (!period || !startDate || !endDate || !content) {
      return NextResponse.json(
        {
          error: 'period, startDate, endDate, contentは必須です',
          detail: { code: 'MISSING_REQUIRED_FIELDS' },
        },
        { status: 400 }
      );
    }

    // periodの値チェック
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        {
          error: 'periodは daily, weekly, monthly のいずれかである必要があります',
          detail: { code: 'INVALID_PERIOD' },
        },
        { status: 400 }
      );
    }

    // 日付のバリデーション
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          error: '無効な日付形式です',
          detail: { code: 'INVALID_DATE_FORMAT' },
        },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        {
          error: 'startDateはendDateより前である必要があります',
          detail: { code: 'INVALID_DATE_RANGE' },
        },
        { status: 400 }
      );
    }

    // 振り返り記録を作成
    const reflection = await prisma.reflection.create({
      data: {
        userId,
        period,
        startDate: start,
        endDate: end,
        content,
        achievements: achievements || null,
        challenges: challenges || null,
      },
    });

    return NextResponse.json(reflection, { status: 201 });
  } catch (error) {
    console.error('Reflections POST error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
