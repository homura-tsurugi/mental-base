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
      const plan = await checkActionService.createActionPlan(formData);
      // データをリフレッシュ
      await fetchData();
      return plan;
    } catch (err) {
      console.error('Create action plan error:', err);
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
