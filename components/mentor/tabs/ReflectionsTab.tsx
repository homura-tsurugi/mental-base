'use client';

// ReflectionsTab - 振り返りタブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import { Reflection } from '@/types';

interface ReflectionsTabProps {
  clientId: string;
  mentorId: string;
  hasPermission: boolean;
}

export function ReflectionsTab({
  clientId,
  mentorId,
  hasPermission,
}: ReflectionsTabProps) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    async function fetchReflections() {
      // @MOCK_TO_API
      try {
        const response = await fetch(
          `/api/mentor/client/${clientId}/reflections`
        );
        if (response.ok) {
          const data = await response.json();
          setReflections(data.reflections);
        }
      } catch (error) {
        console.error('振り返りデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReflections();
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
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 animate-pulse h-40"
          ></div>
        ))}
      </div>
    );
  }

  if (reflections.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          autorenew
        </span>
        <p className="text-gray-500">まだ振り返りがありません</p>
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

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily':
        return '日次振り返り';
      case 'weekly':
        return '週次振り返り';
      case 'monthly':
        return '月次振り返り';
      default:
        return '振り返り';
    }
  };

  return (
    <div className="space-y-3">
      {reflections.map((reflection) => (
        <div key={reflection.id} className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 mb-3">
            {getPeriodLabel(reflection.period)} ({formatDate(reflection.startDate)}{' '}
            - {formatDate(reflection.endDate)})
          </div>

          {reflection.achievements && (
            <>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                達成したこと
              </h4>
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                {reflection.achievements}
              </p>
            </>
          )}

          {reflection.challenges && (
            <>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                課題と気づき
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {reflection.challenges}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
