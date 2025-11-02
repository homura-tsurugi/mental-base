'use client';

// LogsTab - ログ履歴タブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import { Log, EMOTION_DISPLAY_MAP } from '@/types';

interface LogsTabProps {
  clientId: string;
  mentorId: string;
  hasPermission: boolean;
}

export function LogsTab({ clientId, mentorId, hasPermission }: LogsTabProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    async function fetchLogs() {
      // @MOCK_TO_API
      try {
        const response = await fetch(`/api/mentor/client/${clientId}/logs`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('ログデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 animate-pulse h-28"
          ></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          description
        </span>
        <p className="text-gray-500">まだログがありません</p>
      </div>
    );
  }

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const emotionDisplay = log.emotion
          ? EMOTION_DISPLAY_MAP[log.emotion]
          : null;

        return (
          <div key={log.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {formatDateTime(log.createdAt)}
              </span>
              {emotionDisplay && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="material-icons text-base">
                    {emotionDisplay.icon}
                  </span>
                  {emotionDisplay.label}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-900 mb-2">{log.content}</p>
            {log.state && (
              <p className="text-xs text-gray-600">状態: {log.state}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
