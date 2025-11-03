// クライアント詳細API
// GET /api/mentor/client/[id]

import { NextRequest, NextResponse } from 'next/server';
import { verifyMentor } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { checkDataAccess, logDataViewBatch } from '@/lib/mentor-access';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * イニシャルを生成
 */
function getInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.charAt(0);
}

/**
 * クライアントステータスを判定
 */
function determineClientStatus(
  lastActivityDate: Date | null,
  overallProgress: number
): 'on_track' | 'stagnant' | 'needs_followup' {
  if (!lastActivityDate) {
    return 'needs_followup';
  }

  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity >= 21) return 'needs_followup';
  if (daysSinceActivity >= 14) return 'stagnant';
  return 'on_track';
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // メンター認証確認
    const session = await verifyMentor();
    const mentorId = session.userId;

    const { id: clientId } = await params;

    // 1. メンター-クライアント関係を確認
    const relationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId,
        status: 'active',
      },
      include: {
        accessPermissions: {
          where: {
            isActive: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { error: 'アクティブなメンター-クライアント関係が見つかりません' },
        { status: 404 }
      );
    }

    // 2. データアクセス権限を取得
    const permissions = relationship.accessPermissions || {
      allowGoals: false,
      allowTasks: false,
      allowLogs: false,
      allowReflections: false,
      allowAiReports: false,
    };

    // 3. クライアント基本情報を取得
    const client = relationship.client;

    // 進捗計算のためのデータ取得
    const [goals, tasks, logs, reflections] = await Promise.all([
      prisma.goal.findMany({
        where: { userId: clientId },
        select: { status: true },
      }),
      prisma.task.findMany({
        where: { userId: clientId },
        select: { status: true },
      }),
      prisma.log.findMany({
        where: { userId: clientId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
      prisma.reflection.findMany({
        where: { userId: clientId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
    ]);

    // 総合進捗率計算
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'completed').length;
    const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const overallProgress = Math.round((goalProgress + taskProgress) / 2);

    // 最終活動日
    const lastActivityDates = [
      ...logs.map((l) => l.createdAt),
      ...reflections.map((r) => r.createdAt),
    ];
    const lastActivityDate =
      lastActivityDates.length > 0
        ? lastActivityDates.sort((a, b) => b.getTime() - a.getTime())[0]
        : null;

    // ステータス判定
    const status = determineClientStatus(lastActivityDate, overallProgress);

    const clientInfo = {
      id: client.id,
      name: client.name,
      email: client.email,
      avatarUrl: undefined,
      initials: getInitials(client.name),
      registeredAt: client.createdAt,
      relationshipStartDate: relationship.invitedAt,
      overallProgress,
      status,
    };

    // 4. 許可されているデータのみ取得
    const progressData: {
      overallProgress: number;
      goals?: any[];
      tasks?: any[];
      logs?: any[];
      reflections?: any[];
      aiReports?: any[];
    } = {
      overallProgress,
    };

    const viewedDataIds: { type: string; ids: string[] }[] = [];

    // 目標データ
    if (permissions.allowGoals) {
      const accessCheck = await checkDataAccess(mentorId, clientId, 'goals');
      if (accessCheck.allowed) {
        const goalsData = await prisma.goal.findMany({
          where: { userId: clientId },
          include: {
            tasks: {
              select: {
                id: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        progressData.goals = goalsData.map((goal) => ({
          ...goal,
          completedTasks: goal.tasks.filter((t) => t.status === 'completed')
            .length,
          totalTasks: goal.tasks.length,
          progressPercentage:
            goal.tasks.length > 0
              ? Math.round(
                  (goal.tasks.filter((t) => t.status === 'completed').length /
                    goal.tasks.length) *
                    100
                )
              : 0,
        }));

        viewedDataIds.push({
          type: 'goal',
          ids: goalsData.map((g) => g.id),
        });
      }
    }

    // タスクデータ
    if (permissions.allowTasks) {
      const accessCheck = await checkDataAccess(mentorId, clientId, 'tasks');
      if (accessCheck.allowed) {
        const tasksData = await prisma.task.findMany({
          where: { userId: clientId },
          include: {
            goal: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        progressData.tasks = tasksData.map((task) => ({
          ...task,
          goalName: task.goal?.title,
        }));

        viewedDataIds.push({
          type: 'task',
          ids: tasksData.map((t) => t.id),
        });
      }
    }

    // ログデータ
    if (permissions.allowLogs) {
      const accessCheck = await checkDataAccess(mentorId, clientId, 'logs');
      if (accessCheck.allowed) {
        progressData.logs = await prisma.log.findMany({
          where: { userId: clientId },
          orderBy: { createdAt: 'desc' },
          take: 50, // 最新50件
        });

        viewedDataIds.push({
          type: 'log',
          ids: progressData.logs.map((l) => l.id),
        });
      }
    }

    // 振り返りデータ
    if (permissions.allowReflections) {
      const accessCheck = await checkDataAccess(
        mentorId,
        clientId,
        'reflections'
      );
      if (accessCheck.allowed) {
        progressData.reflections = await prisma.reflection.findMany({
          where: { userId: clientId },
          orderBy: { createdAt: 'desc' },
          take: 20, // 最新20件
        });

        viewedDataIds.push({
          type: 'reflection',
          ids: progressData.reflections.map((r) => r.id),
        });
      }
    }

    // AI分析レポートデータ
    if (permissions.allowAiReports) {
      const accessCheck = await checkDataAccess(
        mentorId,
        clientId,
        'ai_reports'
      );
      if (accessCheck.allowed) {
        progressData.aiReports = await prisma.aIAnalysisReport.findMany({
          where: { userId: clientId },
          orderBy: { createdAt: 'desc' },
          take: 10, // 最新10件
        });

        viewedDataIds.push({
          type: 'ai_report',
          ids: progressData.aiReports.map((r) => r.id),
        });
      }
    }

    // 5. メンターノート一覧を取得
    const mentorNotes = await prisma.mentorNote.findMany({
      where: {
        mentorId,
        clientId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 6. 閲覧ログを記録
    for (const viewedData of viewedDataIds) {
      if (viewedData.ids.length > 0) {
        await logDataViewBatch(
          mentorId,
          clientId,
          viewedData.type as any,
          viewedData.ids,
          'view'
        );
      }
    }

    const result = {
      clientInfo,
      permissions: {
        id: 'id' in permissions ? permissions.id : '',
        relationshipId: relationship.id,
        clientId,
        allowGoals: permissions.allowGoals,
        allowTasks: permissions.allowTasks,
        allowLogs: permissions.allowLogs,
        allowReflections: permissions.allowReflections,
        allowAiReports: permissions.allowAiReports,
        isActive: 'isActive' in permissions ? permissions.isActive : true,
        createdAt: 'createdAt' in permissions ? permissions.createdAt : new Date(),
        updatedAt: 'updatedAt' in permissions ? permissions.updatedAt : new Date(),
      },
      progressData,
      mentorNotes,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('クライアント詳細データ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました', detail: error },
      { status: 500 }
    );
  }
}
