'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '@/lib/services/DashboardService';
import { DashboardData } from '@/types';

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  toggleTaskComplete: (taskId: string, completed: boolean) => Promise<void>;
}

/**
 * useDashboardData - Dashboard用カスタムフック
 *
 * ダッシュボードデータの取得・管理を行う
 */
export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (err) {
      setError(err as Error);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await dashboardService.toggleTaskComplete(taskId, completed);
      // データをリフレッシュ
      await fetchData();
    } catch (err) {
      console.error('Task toggle error:', err);
      setError(err as Error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    toggleTaskComplete,
  };
};
