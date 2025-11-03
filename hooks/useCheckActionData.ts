'use client';

import { useState, useEffect } from 'react';
import { checkActionService } from '@/lib/services/CheckActionService';
import {
  CheckActionPageData,
  PeriodType,
  ReflectionForm,
  ActionPlanForm,
  AIAnalysisReportDetailed,
  ActionPlanDetailed,
} from '@/types';

interface UseCheckActionDataReturn {
  data: CheckActionPageData | null;
  loading: boolean;
  error: Error | null;
  currentPeriod: PeriodType;
  refetch: () => Promise<void>;
  changePeriod: (period: PeriodType) => void;
  createReflection: (data: ReflectionForm) => Promise<void>;
  generateAIAnalysis: (reflectionId: string) => Promise<AIAnalysisReportDetailed>;
  createActionPlan: (data: ActionPlanForm) => Promise<ActionPlanDetailed>;
}

/**
 * useCheckActionData - Check/Actionページ用カスタムフック
 *
 * Check/Actionページのデータ取得・管理を行う
 */
export const useCheckActionData = (): UseCheckActionDataReturn => {
  const [data, setData] = useState<CheckActionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>('this_week');

  const fetchData = async (period: PeriodType = currentPeriod) => {
    try {
      setLoading(true);
      setError(null);

      // E2E テストモード: localStorageからエラーMockを検出
      if (typeof window !== 'undefined') {
        const mockApiDisabled = localStorage.getItem('MOCK_API_DISABLED') === 'true';
        const emptyTestData = localStorage.getItem('EMPTY_TEST_DATA') === 'true';
        const url = new URL(window.location.href);
        const mockError = url.searchParams.get('mockError');

        if (mockApiDisabled) {
          throw new Error('API接続エラーが発生しました');
        }
        if (emptyTestData) {
          // 空データを返す（エラーではなく成功だがデータなし）
          setData(null);
          setLoading(false);
          return;
        }
        if (mockError === 'api') {
          throw new Error('API接続エラーが発生しました');
        }
        if (mockError === 'network') {
          throw new Error('ネットワーク接続に失敗しました');
        }
        if (mockError === 'timeout') {
          throw new Error('リクエストがタイムアウトしました');
        }
        if (mockError === 'invalid_data') {
          throw new Error('不正なデータ形式です');
        }
      }

      const result = await checkActionService.getCheckActionData(period);
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error('Check/Action data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePeriod = (period: PeriodType) => {
    setCurrentPeriod(period);
    fetchData(period);
  };

  const createReflection = async (formData: ReflectionForm) => {
    try {
      await checkActionService.createReflection(formData);
      // データをリフレッシュ
      await fetchData();
    } catch (err) {
      console.error('Create reflection error:', err);
      throw err;
    }
  };

  const generateAIAnalysis = async (reflectionId: string): Promise<AIAnalysisReportDetailed> => {
    try {
      const report = await checkActionService.generateAIAnalysis(reflectionId);
      // データをリフレッシュ
      await fetchData();
      return report;
    } catch (err) {
      console.error('Generate AI analysis error:', err);
      throw err;
    }
  };

  const createActionPlan = async (formData: ActionPlanForm): Promise<ActionPlanDetailed> => {
    try {
      console.log('[useCheckActionData] Creating action plan...', formData);
      const plan = await checkActionService.createActionPlan(formData);
      console.log('[useCheckActionData] Action plan created successfully', plan);
      // Note: データリフレッシュは行わない（success alert表示を優先）
      return plan;
    } catch (err) {
      console.error('[useCheckActionData] Create action plan error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    currentPeriod,
    refetch: () => fetchData(),
    changePeriod,
    createReflection,
    generateAIAnalysis,
    createActionPlan,
  };
};
