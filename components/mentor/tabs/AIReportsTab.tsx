'use client';

// AIReportsTab - AI分析レポートタブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import { AIAnalysisReportDetailed } from '@/types';

interface AIReportsTabProps {
  clientId: string;
  mentorId: string;
  hasPermission: boolean;
}

export function AIReportsTab({
  clientId,
  mentorId,
  hasPermission,
}: AIReportsTabProps) {
  const [reports, setReports] = useState<AIAnalysisReportDetailed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    async function fetchReports() {
      // @MOCK_TO_API
      try {
        const response = await fetch(
          `/api/mentor/client/${clientId}/ai-reports`
        );
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports);
        }
      } catch (error) {
        console.error('AI分析レポートの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
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
      <div className="space-y-4">
        {[1].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-6 animate-pulse h-64"
          ></div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          psychology
        </span>
        <p className="text-gray-500">まだAI分析レポートがありません</p>
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
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons text-purple-600">psychology</span>
            <h3 className="text-lg font-medium text-gray-900">
              AI分析レポート（{formatDate(report.createdAt)}）
            </h3>
          </div>

          {report.summary && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">概要</h4>
              <p className="text-sm text-gray-700">{report.summary}</p>
            </div>
          )}

          {report.insights && report.insights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                主な洞察
              </h4>
              <div className="space-y-2">
                {report.insights.map((insight) => (
                  <div key={insight.id} className="text-sm text-gray-700">
                    <span className="font-medium">{insight.title}:</span>{' '}
                    {insight.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                推奨事項
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                {report.recommendations.map((rec, index) => (
                  <li key={rec.id}>{rec.description}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
