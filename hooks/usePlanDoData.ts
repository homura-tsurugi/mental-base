// ============================================================================
// usePlanDoData - Custom Hook for Plan/Do Page
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { planDoService } from '@/lib/services/PlanDoService';
import {
  PlanDoPageData,
  Goal,
  Task,
  Log,
  GoalForm,
  TaskForm,
  LogForm,
} from '@/types';

export const usePlanDoData = (initialTab: 'plan' | 'do' = 'plan') => {
  const [data, setData] = useState<PlanDoPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'do'>(initialTab);

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await planDoService.getPlanDoPageData(activeTab);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // 初回ロード
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 目標作成
  const createGoal = async (form: GoalForm): Promise<Goal> => {
    const newGoal = await planDoService.createGoal(form);
    await fetchData(); // リフレッシュ
    return newGoal;
  };

  // 目標更新
  const updateGoal = async (id: string, form: Partial<GoalForm>): Promise<Goal> => {
    const updatedGoal = await planDoService.updateGoal(id, form);
    await fetchData();
    return updatedGoal;
  };

  // 目標削除
  const deleteGoal = async (id: string): Promise<void> => {
    await planDoService.deleteGoal(id);
    await fetchData();
  };

  // タスク作成
  const createTask = async (form: TaskForm): Promise<Task> => {
    const newTask = await planDoService.createTask(form);
    await fetchData();
    return newTask;
  };

  // タスク完了切り替え
  const toggleTaskCompletion = async (id: string): Promise<Task> => {
    const updatedTask = await planDoService.toggleTaskCompletion(id);
    await fetchData();
    return updatedTask;
  };

  // タスク削除
  const deleteTask = async (id: string): Promise<void> => {
    await planDoService.deleteTask(id);
    await fetchData();
  };

  // ログ記録
  const createLog = async (form: LogForm): Promise<Log> => {
    const newLog = await planDoService.createLog(form);
    return newLog;
  };

  return {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    refetch: fetchData,
    createGoal,
    updateGoal,
    deleteGoal,
    createTask,
    toggleTaskCompletion,
    deleteTask,
    createLog,
  };
};
