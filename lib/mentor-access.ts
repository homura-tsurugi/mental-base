// ============================================================================
// Mentor Data Access Control
// メンターがクライアントデータにアクセスする際の権限チェックと監査ログ
// ============================================================================

import { prisma } from '@/lib/prisma';

/**
 * データタイプ（権限チェック用）
 */
export type DataType = 'goals' | 'tasks' | 'logs' | 'reflections' | 'ai_reports';

/**
 * データアクセス権限チェック結果
 */
export interface AccessCheckResult {
  allowed: boolean; // アクセス許可されているか
  reason?: string; // 許可されていない場合の理由
  relationshipId?: string; // メンター-クライアント関係ID
}

/**
 * メンターがクライアントの特定データタイプにアクセス可能かチェック
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID
 * @param dataType - データタイプ（goals/tasks/logs/reflections/ai_reports）
 * @returns AccessCheckResult - アクセス可否と詳細情報
 *
 * @example
 * ```typescript
 * const result = await checkDataAccess('mentor-uuid', 'client-uuid', 'goals');
 * if (result.allowed) {
 *   // データ取得処理
 *   const goals = await prisma.goal.findMany({ where: { userId: clientId } });
 * } else {
 *   throw new Error(result.reason);
 * }
 * ```
 */
export async function checkDataAccess(
  mentorId: string,
  clientId: string,
  dataType: DataType
): Promise<AccessCheckResult> {
  try {
    // 1. メンター-クライアント関係を確認
    const relationship = await prisma.mentorClientRelationship.findFirst({
      where: {
        mentorId,
        clientId,
        status: 'active', // activeステータスのみ有効
      },
      include: {
        accessPermissions: {
          where: {
            isActive: true, // 有効な権限のみ
          },
        },
      },
    });

    // 関係が存在しない、またはactiveステータスでない
    if (!relationship) {
      return {
        allowed: false,
        reason: 'No active mentor-client relationship found',
      };
    }

    // アクセス権限が設定されていない
    if (!relationship.accessPermissions) {
      return {
        allowed: false,
        reason: 'No access permissions configured',
      };
    }

    const permission = relationship.accessPermissions;

    // 2. データタイプごとの権限チェック
    let allowed = false;
    switch (dataType) {
      case 'goals':
        allowed = permission.allowGoals;
        break;
      case 'tasks':
        allowed = permission.allowTasks;
        break;
      case 'logs':
        allowed = permission.allowLogs;
        break;
      case 'reflections':
        allowed = permission.allowReflections;
        break;
      case 'ai_reports':
        allowed = permission.allowAiReports;
        break;
      default:
        return {
          allowed: false,
          reason: `Invalid data type: ${dataType}`,
        };
    }

    if (!allowed) {
      return {
        allowed: false,
        reason: `Access to ${dataType} is not permitted`,
      };
    }

    // アクセス許可
    return {
      allowed: true,
      relationshipId: relationship.id,
    };
  } catch (error) {
    console.error('Error checking data access:', error);
    return {
      allowed: false,
      reason: 'Internal error occurred while checking access',
    };
  }
}

/**
 * データ閲覧ログを記録（GDPR対応・監査ログ）
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID
 * @param dataType - データタイプ（goal/task/log/reflection/ai_report）
 * @param dataId - 閲覧したデータのID
 * @param action - アクション（view/export）
 *
 * @example
 * ```typescript
 * // 目標を閲覧した際のログ記録
 * await logDataView('mentor-uuid', 'client-uuid', 'goal', 'goal-uuid', 'view');
 *
 * // データをエクスポートした際のログ記録
 * await logDataView('mentor-uuid', 'client-uuid', 'goal', 'goal-uuid', 'export');
 * ```
 */
export async function logDataView(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataId: string,
  action: 'view' | 'export' = 'view'
): Promise<void> {
  try {
    await prisma.clientDataViewLog.create({
      data: {
        mentorId,
        clientId,
        dataType,
        dataId,
        action,
      },
    });
  } catch (error) {
    // ログ記録失敗はエラーをスローせず、エラーログに記録のみ
    // データアクセス自体は継続可能とする
    console.error('Failed to log data view:', error);
  }
}

/**
 * 複数データの閲覧ログを一括記録
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID
 * @param dataType - データタイプ
 * @param dataIds - 閲覧したデータのID配列
 * @param action - アクション（view/export）
 *
 * @example
 * ```typescript
 * // 複数の目標を閲覧した際のログ記録
 * const goalIds = goals.map(g => g.id);
 * await logDataViewBatch('mentor-uuid', 'client-uuid', 'goal', goalIds, 'view');
 * ```
 */
export async function logDataViewBatch(
  mentorId: string,
  clientId: string,
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report',
  dataIds: string[],
  action: 'view' | 'export' = 'view'
): Promise<void> {
  try {
    await prisma.clientDataViewLog.createMany({
      data: dataIds.map(dataId => ({
        mentorId,
        clientId,
        dataType,
        dataId,
        action,
      })),
    });
  } catch (error) {
    console.error('Failed to log data view batch:', error);
  }
}

/**
 * メンターのクライアントデータ閲覧履歴を取得
 *
 * @param mentorId - メンターのユーザーID
 * @param clientId - クライアントのユーザーID（任意）
 * @param limit - 取得件数（デフォルト: 100）
 * @returns データ閲覧ログの配列
 *
 * @example
 * ```typescript
 * // 特定クライアントの閲覧履歴を取得
 * const logs = await getViewLogs('mentor-uuid', 'client-uuid', 50);
 *
 * // メンターの全閲覧履歴を取得
 * const allLogs = await getViewLogs('mentor-uuid');
 * ```
 */
export async function getViewLogs(
  mentorId: string,
  clientId?: string,
  limit: number = 100
) {
  return await prisma.clientDataViewLog.findMany({
    where: {
      mentorId,
      ...(clientId && { clientId }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * クライアントが自分のデータ閲覧履歴を取得
 *
 * @param clientId - クライアントのユーザーID
 * @param limit - 取得件数（デフォルト: 100）
 * @returns データ閲覧ログの配列
 *
 * @example
 * ```typescript
 * // クライアントが自分のデータを誰が閲覧したか確認
 * const logs = await getClientViewLogs('client-uuid', 50);
 * ```
 */
export async function getClientViewLogs(
  clientId: string,
  limit: number = 100
) {
  return await prisma.clientDataViewLog.findMany({
    where: {
      clientId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
