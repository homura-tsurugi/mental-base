// ============================================================================
// PlanDoService - Real API Integration
// バックエンドAPI統合完了
// ============================================================================

import {
  Goal,
  GoalWithProgress,
  Task,
  TaskWithGoal,
  Log,
  GoalForm,
  TaskForm,
  LogForm,
  PlanDoPageData,
  EmotionOption,
  Emotion,
} from '@/types';

export class PlanDoService {
  private readonly baseUrl = '/api';

  // 感情選択肢（フロントエンド固定データ）
  private emotionOptions: EmotionOption[] = [
    { value: 'happy' as Emotion, emoji: '😊', label: '嬉しい' },
    { value: 'neutral' as Emotion, emoji: '😐', label: '普通' },
    { value: 'sad' as Emotion, emoji: '😢', label: '悲しい' },
    { value: 'anxious' as Emotion, emoji: '😰', label: '不安' },
  ];

  /**
   * Plan/Doページの初期データを取得
   *
   * API: GET /api/plan-do
   * Response: PlanDoPageData
   */
  async getPlanDoPageData(activeTab: 'plan' | 'do' = 'plan'): Promise<PlanDoPageData> {
    try {
      const response = await fetch(`${this.baseUrl}/plan-do`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`Plan/Doページデータの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();

      return {
        activeTab,
        goals: data.goals,
        todayTasks: data.todayTasks,
        emotionOptions: this.emotionOptions,
      };
    } catch (error) {
      console.error('PlanDoService.getPlanDoPageData error:', error);
      throw error;
    }
  }

  /**
   * 目標一覧を取得（進捗率付き）
   *
   * API: GET /api/goals
   * Response: GoalWithProgress[]
   */
  async getGoals(): Promise<GoalWithProgress[]> {
    try {
      const response = await fetch(`${this.baseUrl}/goals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`目標一覧の取得に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.getGoals error:', error);
      throw error;
    }
  }

  /**
   * 目標を作成
   *
   * API: POST /api/goals
   * Request: GoalForm
   * Response: Goal
   */
  async createGoal(form: GoalForm): Promise<Goal> {
    try {
      const response = await fetch(`${this.baseUrl}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`目標の作成に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.createGoal error:', error);
      throw error;
    }
  }

  /**
   * 目標を更新
   *
   * API: PUT /api/goals/{id}
   * Request: Partial<GoalForm>
   * Response: Goal
   */
  async updateGoal(id: string, form: Partial<GoalForm>): Promise<Goal> {
    try {
      const response = await fetch(`${this.baseUrl}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 404) {
          throw new Error('目標が見つかりません');
        }
        throw new Error(`目標の更新に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.updateGoal error:', error);
      throw error;
    }
  }

  /**
   * 目標を削除
   *
   * API: DELETE /api/goals/{id}
   * Response: void
   */
  async deleteGoal(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/goals/${id}`, {
        method: 'DELETE',
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
          throw new Error('目標が見つかりません');
        }
        throw new Error(`目標の削除に失敗しました: ${response.status}`);
      }

      // 成功時は何もしない（void）
    } catch (error) {
      console.error('PlanDoService.deleteGoal error:', error);
      throw error;
    }
  }

  /**
   * 今日のタスクを取得（目標名付き）
   *
   * API: GET /api/tasks/today
   * Response: TaskWithGoal[]
   */
  async getTodayTasks(): Promise<TaskWithGoal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`今日のタスク取得に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.getTodayTasks error:', error);
      throw error;
    }
  }

  /**
   * タスクを作成
   *
   * API: POST /api/tasks
   * Request: TaskForm
   * Response: Task
   */
  async createTask(form: TaskForm): Promise<Task> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`タスクの作成に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.createTask error:', error);
      throw error;
    }
  }

  /**
   * タスクの完了状態を切り替え
   *
   * API: PATCH /api/tasks/{id}/toggle
   * Response: Task
   */
  async toggleTaskCompletion(id: string): Promise<Task> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${id}/toggle`, {
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

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.toggleTaskCompletion error:', error);
      throw error;
    }
  }

  /**
   * タスクを削除
   *
   * API: DELETE /api/tasks/{id}
   * Response: void
   */
  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
        method: 'DELETE',
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
        throw new Error(`タスクの削除に失敗しました: ${response.status}`);
      }

      // 成功時は何もしない（void）
    } catch (error) {
      console.error('PlanDoService.deleteTask error:', error);
      throw error;
    }
  }

  /**
   * ログを記録
   *
   * API: POST /api/logs
   * Request: LogForm
   * Response: Log
   */
  async createLog(form: LogForm): Promise<Log> {
    try {
      const response = await fetch(`${this.baseUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`ログの記録に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('PlanDoService.createLog error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const planDoService = new PlanDoService();
