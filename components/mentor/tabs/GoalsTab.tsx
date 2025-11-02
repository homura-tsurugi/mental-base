'use client';

// GoalsTab - 目標一覧タブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import { GoalWithProgress, GOAL_STATUS_DISPLAY_MAP } from '@/types';

interface GoalsTabProps {
  clientId: string;
  mentorId: string;
  hasPermission: boolean;
}

export function GoalsTab({ clientId, mentorId, hasPermission }: GoalsTabProps) {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    async function fetchGoals() {
      // @MOCK_TO_API
      try {
        const response = await fetch(`/api/mentor/client/${clientId}/goals`);
        if (response.ok) {
          const data = await response.json();
          setGoals(data.goals);
        }
      } catch (error) {
        console.error('目標データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, [clientId, hasPermission]);

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-icons text-6xl text-amber-500 mb-4">lock</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          アクセス権限がありません
        </h3>
        <p className="text-sm text-gray-600">
          このクライアントはこのデータの閲覧を許可していません。
          <br />
          クライアントに許可をリクエストしてください。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 animate-pulse h-24"
          ></div>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-gray-300 mb-4">flag</span>
        <p className="text-gray-500">まだ目標がありません</p>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const statusDisplay = GOAL_STATUS_DISPLAY_MAP[goal.status];
        return (
          <div
            key={goal.id}
            className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600"
          >
            <h4 className="text-base font-medium text-gray-900 mb-1">
              {goal.title}
            </h4>
            {goal.description && (
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="material-icons text-sm">event</span>
                <span>
                  期限: {goal.deadline ? formatDate(goal.deadline) : '未設定'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span>進捗率: {goal.progressPercentage}%</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: statusDisplay.badgeColor,
                    color: statusDisplay.textColor,
                  }}
                >
                  {statusDisplay.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
