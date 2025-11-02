'use client';

// TasksTab - タスク一覧タブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import {
  TaskWithGoal,
  TASK_STATUS_DISPLAY_MAP,
  TASK_PRIORITY_DISPLAY_MAP,
} from '@/types';

interface TasksTabProps {
  clientId: string;
  mentorId: string;
  hasPermission: boolean;
}

export function TasksTab({ clientId, mentorId, hasPermission }: TasksTabProps) {
  const [tasks, setTasks] = useState<TaskWithGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    async function fetchTasks() {
      // @MOCK_TO_API
      try {
        const response = await fetch(`/api/mentor/client/${clientId}/tasks`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('タスクデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
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
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 animate-pulse h-20"
          ></div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          assignment
        </span>
        <p className="text-gray-500">まだタスクがありません</p>
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
    <ul className="space-y-2">
      {tasks.map((task) => {
        const statusDisplay = TASK_STATUS_DISPLAY_MAP[task.status];
        const priorityDisplay = TASK_PRIORITY_DISPLAY_MAP[task.priority];

        return (
          <li key={task.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            {/* 優先度バー */}
            <div
              className="w-1.5 h-10 rounded-sm"
              style={{ backgroundColor: priorityDisplay.color }}
            ></div>

            {/* タスク内容 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-base text-gray-900">{task.title}</h4>
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
              <div className="text-xs text-gray-600">
                期限: {task.dueDate ? formatDate(task.dueDate) : '未設定'} | 優先度:{' '}
                {priorityDisplay.label}
                {task.goalName && ` | 目標: ${task.goalName}`}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
