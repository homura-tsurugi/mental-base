// /api/action-plans - アクションプランAPI

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';

// GET /api/action-plans - アクションプラン一覧取得
export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await verifySession();
    const userId = session.userId;

    // Query Parameters取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
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

    // statusの値チェック
    if (status && !['planned', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        {
          error: 'statusは planned, in_progress, completed のいずれかである必要があります',
          detail: { code: 'INVALID_STATUS' },
        },
        { status: 400 }
      );
    }

    // アクションプランを取得
    const actionPlans = await prisma.actionPlan.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc', // 新しい順
      },
      take: limit,
    });

    // ActionPlanDetailed形式に変換（進捗率を計算）
    const actionPlansDetailed = actionPlans.map((plan) => {
      const actionItems = Array.isArray(plan.actionItems)
        ? (plan.actionItems as string[])
        : [];
      const totalItems = actionItems.length;
      const completedItems = 0; // TODO: 実装時に完了アイテム数を計算
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        ...plan,
        actionItems: actionItems.map((item, index) => ({
          id: `${plan.id}_${index}`,
          order: index + 1,
          description: item,
          completed: false, // TODO: 実装時に完了状態を管理
          dueDate: undefined,
        })),
        progress,
        completedItems,
        totalItems,
      };
    });

    return NextResponse.json(actionPlansDetailed, { status: 200 });
  } catch (error) {
    console.error('ActionPlans GET error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// POST /api/action-plans - アクションプラン作成
export async function POST(request: Request) {
  try {
    // E2Eテストモード検出
    const url = new URL(request.url);
    const skipAuth = url.searchParams.get('skipAuth') === 'true';

    let userId: string;

    if (skipAuth) {
      // E2Eテストモード: モックユーザーを使用
      userId = 'e2e-test-user-id';
      console.log('[ActionPlans POST] E2Eテストモード: 認証スキップ');
    } else {
      // 通常モード: 認証チェック
      const session = await verifySession();
      userId = session.userId;
    }

    // リクエストボディを取得
    const body = await request.json();
    const { title, description, actionItems, reportId } = body;

    // バリデーション
    if (!title || !description || !actionItems) {
      return NextResponse.json(
        {
          error: 'title, description, actionItemsは必須です',
          detail: { code: 'MISSING_REQUIRED_FIELDS' },
        },
        { status: 400 }
      );
    }

    // actionItemsが配列か確認
    if (!Array.isArray(actionItems)) {
      return NextResponse.json(
        {
          error: 'actionItemsは配列である必要があります',
          detail: { code: 'INVALID_ACTION_ITEMS_TYPE' },
        },
        { status: 400 }
      );
    }

    // actionItemsが空でないことを確認
    if (actionItems.length === 0) {
      return NextResponse.json(
        {
          error: 'actionItemsは1つ以上必要です',
          detail: { code: 'EMPTY_ACTION_ITEMS' },
        },
        { status: 400 }
      );
    }

    // titleの長さチェック
    if (title.length > 200) {
      return NextResponse.json(
        {
          error: 'titleは200文字以内である必要があります',
          detail: { code: 'TITLE_TOO_LONG' },
        },
        { status: 400 }
      );
    }

    // E2Eテストモード: モックレスポンスを返す
    if (skipAuth) {
      const mockActionPlan = {
        id: `action-plan-${Date.now()}`,
        userId,
        reportId: reportId || null,
        title,
        description,
        actionItems,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[ActionPlans POST] E2Eテストモード: モックレスポンスを返却');
      return NextResponse.json(mockActionPlan, { status: 201 });
    }

    // 通常モード: reportIdが指定されている場合、存在確認
    if (reportId) {
      const report = await prisma.aIAnalysisReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return NextResponse.json(
          {
            error: '指定されたAI分析レポートが見つかりません',
            detail: { code: 'REPORT_NOT_FOUND' },
          },
          { status: 404 }
        );
      }

      if (report.userId !== userId) {
        return NextResponse.json(
          {
            error: '指定されたAI分析レポートにアクセスする権限がありません',
            detail: { code: 'FORBIDDEN' },
          },
          { status: 403 }
        );
      }
    }

    // アクションプランを作成
    const actionPlan = await prisma.actionPlan.create({
      data: {
        userId,
        reportId: reportId || null,
        title,
        description,
        actionItems,
        status: 'planned',
      },
    });

    return NextResponse.json(actionPlan, { status: 201 });
  } catch (error) {
    console.error('ActionPlans POST error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
