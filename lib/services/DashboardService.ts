import {
  DashboardData,
  CompassProgress,
  TaskWithGoal,
  Activity,
  Notification,
} from '@/types';

/**
 * DashboardService - Real API Integration
 *
 * バックエンドAPI統合完了
 * GET /api/dashboard: ダッシュボードデータ取得
 * PATCH /api/tasks/{id}/toggle: タスク完了状態トグル
 */
export class DashboardService {
  private readonly baseUrl = '/api';

  /**
   * ダッシュボードデータ取得
   *
   * API: GET /api/dashboard
   * Response: DashboardData
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      // E2Eテスト用: URLクエリパラメータを取得して転送
      const searchParams = typeof window !== 'undefined' ? window.location.search : '';
      const response = await fetch(`${this.baseUrl}/dashboard${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // セッション認証のためのCookie送信
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`ダッシュボードデータの取得に失敗しました: ${response.status}`);
      }

      const data: DashboardData = await response.json();
      return data;
    } catch (error) {
      console.error('DashboardService.getDashboardData error:', error);
      throw error;
    }
  }

  /**
   * タスク完了状態を更新
   *
   * API: PATCH /api/tasks/{taskId}/toggle
   * Response: Task
   */
  async toggleTaskComplete(taskId: string, completed: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 404) {
          throw new Error('タスクが見つかりません');
        }
        throw new Error(`タスクの更新に失敗しました: ${response.status}`);
      }

      // 成功時は何もしない（void）
    } catch (error) {
      console.error('DashboardService.toggleTaskComplete error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const dashboardService = new DashboardService();
