// メンターダッシュボードAPI
// GET /api/mentor/dashboard

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { CLIENT_STATUS_THRESHOLDS } from '@/lib/constants';
import type { ClientStatus } from '@/types';

/**
 * クライアントステータスを判定
 * @param lastActivityDate 最終活動日
 * @param overallProgress 総合進捗率
 * @returns ClientStatus
 */
function determineClientStatus(
  lastActivityDate: Date | null,
  overallProgress: number
): ClientStatus {
  if (!lastActivityDate) {
    return 'needs_followup';
  }

  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 21日以上活動なし → フォローアップ要
  if (daysSinceActivity >= CLIENT_STATUS_THRESHOLDS.NEEDS_FOLLOWUP_DAYS) {
    return 'needs_followup';
  }

  // 14日以上活動なし → 停滞中
  if (daysSinceActivity >= CLIENT_STATUS_THRESHOLDS.STAGNANT_DAYS) {
    return 'stagnant';
  }

  // 7日以内に活動あり → 順調
  return 'on_track';
}

/**
 * 最終活動日ラベルを生成
 * @param lastActivityDate 最終活動日
 * @returns ラベル文字列
 */
function getLastActivityLabel(lastActivityDate: Date | null): string {
  if (!lastActivityDate) {
    return '活動なし';
  }

  const daysSince = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince === 0) {
    return '今日';
  } else if (daysSince === 1) {
    return '昨日';
  } else if (daysSince <= 7) {
    return `${daysSince}日前`;
  } else if (daysSince <= 30) {
    return `${Math.floor(daysSince / 7)}週間前`;
  } else {
    return `${Math.floor(daysSince / 30)}ヶ月前`;
  }
}

/**
 * イニシャルを生成
 * @param name 名前
 * @returns イニシャル
 */
function getInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.charAt(0);
}

export async function GET(request: NextRequest) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    // E2Eテスト用: VITE_SKIP_AUTH時はモックデータを返す
    if (process.env.VITE_SKIP_AUTH === 'true') {
      return NextResponse.json({
        statistics: {
          totalClients: 0,
          activeClients: 0,
          needsFollowUp: 0,
          averageProgress: 0,
        },
        clients: [],
      });
    }

    // 1. メンターの担当クライアント一覧を取得
    const relationships = await prisma.mentorClientRelationship.findMany({
      where: {
        mentorId,
        status: 'active', // activeステータスのみ
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // クライアントがいない場合は空データを返す
    if (relationships.length === 0) {
      return NextResponse.json({
        statistics: {
          totalClients: 0,
          activeClients: 0,
          needsFollowUp: 0,
          averageProgress: 0,
        },
        clients: [],
      });
    }

    const clientIds = relationships.map((rel) => rel.clientId);

    // 2. 各クライアントの進捗データを並列取得（パフォーマンス最適化）
    const [goalsCounts, tasksCounts, logsCounts, reflectionsCounts] =
      await Promise.all([
        // 目標完了数/総数
        prisma.goal.groupBy({
          by: ['userId', 'status'],
          where: { userId: { in: clientIds } },
          _count: true,
        }),
        // タスク完了数/総数
        prisma.task.groupBy({
          by: ['userId', 'status'],
          where: { userId: { in: clientIds } },
          _count: true,
        }),
        // ログ記録（最終活動日計算用）
        prisma.log.groupBy({
          by: ['userId'],
          where: { userId: { in: clientIds } },
          _max: { createdAt: true },
        }),
        // 振り返り記録（最終活動日計算用）
        prisma.reflection.groupBy({
          by: ['userId'],
          where: { userId: { in: clientIds } },
          _max: { createdAt: true },
        }),
      ]);

    // 3. クライアントごとのデータを集計
    const clientSummaries = relationships.map((rel) => {
      const clientId = rel.clientId;

      // 目標データ
      const goalData = goalsCounts.filter((g) => g.userId === clientId);
      const totalGoals = goalData.reduce((sum, g) => sum + g._count, 0);
      const completedGoals =
        goalData.find((g) => g.status === 'completed')?._count || 0;
      const goalProgress =
        totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      // タスクデータ
      const taskData = tasksCounts.filter((t) => t.userId === clientId);
      const totalTasks = taskData.reduce((sum, t) => sum + t._count, 0);
      const completedTasks =
        taskData.find((t) => t.status === 'completed')?._count || 0;
      const taskProgress =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // ログデータ
      const logData = logsCounts.find((l) => l.userId === clientId);
      const lastLogDate = logData?._max.createdAt || null;

      // 振り返りデータ
      const reflectionData = reflectionsCounts.find(
        (r) => r.userId === clientId
      );
      const lastReflectionDate = reflectionData?._max.createdAt || null;

      // 最終活動日（ログと振り返りの最新日時）
      const lastActivityDate = [lastLogDate, lastReflectionDate]
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      // 総合進捗率（目標とタスクの平均）
      const overallProgress = Math.round((goalProgress + taskProgress) / 2);

      // ステータス判定
      const status = determineClientStatus(lastActivityDate, overallProgress);

      return {
        id: clientId,
        name: rel.client.name,
        email: rel.client.email,
        avatarUrl: undefined,
        initials: getInitials(rel.client.name),
        overallProgress,
        lastActivityDate: lastActivityDate || new Date(0),
        lastActivityLabel: getLastActivityLabel(lastActivityDate),
        status,
        relationshipId: rel.id,
      };
    });

    // 4. 統計サマリーを集計
    const totalClients = clientSummaries.length;
    const activeClients = clientSummaries.filter((c) => {
      const daysSince = Math.floor(
        (Date.now() - c.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince <= CLIENT_STATUS_THRESHOLDS.ACTIVE_DAYS;
    }).length;
    const needsFollowUp = clientSummaries.filter(
      (c) => c.status === 'needs_followup'
    ).length;
    const averageProgress =
      totalClients > 0
        ? Math.round(
            clientSummaries.reduce((sum, c) => sum + c.overallProgress, 0) /
              totalClients
          )
        : 0;

    const result = {
      statistics: {
        totalClients,
        activeClients,
        needsFollowUp,
        averageProgress,
      },
      clients: clientSummaries,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('メンターダッシュボードデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
