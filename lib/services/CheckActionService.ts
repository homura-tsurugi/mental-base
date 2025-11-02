import {
  CheckActionPageData,
  PeriodOption,
  PeriodType,
  ProgressStats,
  ChartData,
  Reflection,
  AIAnalysisReportDetailed,
  ActionPlanDetailed,
  ReflectionForm,
  ActionPlanForm,
} from '@/types';

/**
 * CheckActionService - Real API Integration
 *
 * バックエンドAPI統合完了
 * GET /api/check-action: Check/Actionページデータ取得
 * POST /api/reflections: 振り返り作成
 * POST /api/analysis/generate: AI分析生成
 * POST /api/action-plans: アクションプラン作成
 */
export class CheckActionService {
  private readonly baseUrl = '/api';

  /**
   * Check/Actionページデータ取得
   *
   * API: GET /api/check-action
   * Query: period={periodType}
   * Response: CheckActionPageData
   */
  async getCheckActionData(periodType: PeriodType): Promise<CheckActionPageData> {
    try {
      const period = this.getPeriodOption(periodType);

      const response = await fetch(
        `${this.baseUrl}/check-action?period=${periodType}&startDate=${period.startDate.toISOString()}&endDate=${period.endDate.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`Check/Actionページデータの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();

      return {
        period,
        stats: data.stats,
        chartData: data.chartData,
        reflections: data.reflections,
        latestReport: data.latestReport,
        actionPlans: data.actionPlans,
      };
    } catch (error) {
      console.error('CheckActionService.getCheckActionData error:', error);
      throw error;
    }
  }

  /**
   * 振り返り記録を作成
   *
   * API: POST /api/reflections
   * Request: ReflectionForm
   * Response: Reflection
   */
  async createReflection(data: ReflectionForm): Promise<Reflection> {
    try {
      const response = await fetch(`${this.baseUrl}/reflections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`振り返りの作成に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CheckActionService.createReflection error:', error);
      throw error;
    }
  }

  /**
   * AI分析をリクエスト
   *
   * API: POST /api/analysis/generate
   * Request: { reflectionId: string }
   * Response: AIAnalysisReportDetailed
   */
  async generateAIAnalysis(reflectionId: string): Promise<AIAnalysisReportDetailed> {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reflectionId }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 404) {
          throw new Error('振り返りが見つかりません');
        }
        throw new Error(`AI分析の生成に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CheckActionService.generateAIAnalysis error:', error);
      throw error;
    }
  }

  /**
   * アクションプランを作成
   *
   * API: POST /api/action-plans
   * Request: ActionPlanForm
   * Response: ActionPlanDetailed
   */
  async createActionPlan(data: ActionPlanForm): Promise<ActionPlanDetailed> {
    try {
      const response = await fetch(`${this.baseUrl}/action-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`アクションプランの作成に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CheckActionService.createActionPlan error:', error);
      throw error;
    }
  }

  /**
   * 期間オプション取得ヘルパー
   */
  private getPeriodOption(periodType: PeriodType): PeriodOption {
    const now = new Date();
    const options: Record<PeriodType, PeriodOption> = {
      today: {
        label: '今日',
        value: 'today',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      },
      this_week: {
        label: '今週',
        value: 'this_week',
        startDate: this.getMonday(now),
        endDate: this.getSunday(now),
      },
      last_week: {
        label: '先週',
        value: 'last_week',
        startDate: this.getMonday(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
        endDate: this.getSunday(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      },
      this_month: {
        label: '今月',
        value: 'this_month',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      },
      last_month: {
        label: '先月',
        value: 'last_month',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      },
      custom: {
        label: 'カスタム',
        value: 'custom',
        startDate: now,
        endDate: now,
      },
    };

    return options[periodType];
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private getSunday(date: Date): Date {
    const monday = this.getMonday(date);
    return new Date(
      monday.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000
    );
  }
}

// シングルトンインスタンス
export const checkActionService = new CheckActionService();
