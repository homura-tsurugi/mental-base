'use client';

import React from 'react';
import { AIAnalysisReportDetailed } from '@/types';

interface AIReportCardProps {
  report: AIAnalysisReportDetailed;
}

export const AIReportCard: React.FC<AIReportCardProps> = ({ report }) => {
  const getImportanceColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'var(--danger)';
      case 'medium':
        return 'var(--warning)';
      case 'low':
        return 'var(--primary)';
    }
  };

  return (
    <div data-testid="ai-report-card" className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 shadow-sm border-l-4 border-[var(--action-color)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[var(--action-color)]">auto_awesome</span>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            AI分析レポート
          </h3>
        </div>
        <div data-testid="ai-report-confidence" className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
          信頼度: {report.confidencePercentage}%
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div data-testid="ai-report-summary" className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {report.summary}
          </p>
        </div>
      )}

      {/* Insights */}
      <div data-testid="ai-report-insights" className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="material-icons text-lg"
            style={{ color: 'var(--check-color)' }}
          >
            lightbulb
          </span>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            洞察（Insights）
          </h4>
        </div>
        <div className="space-y-2">
          {report.insights.map((insight) => (
            <div
              key={insight.id}
              data-testid="ai-report-insight-item"
              className="p-3 bg-[var(--bg-tertiary)] rounded-lg border-l-3"
              style={{ borderLeftColor: getImportanceColor(insight.importance) }}
            >
              <div data-testid="insight-title" className="font-medium text-sm text-[var(--text-primary)] mb-1">
                {insight.title}:
              </div>
              <div data-testid="insight-description" className="text-sm text-[var(--text-secondary)]">
                {insight.description}
              </div>
              <div data-testid="insight-importance" className="mt-1 text-xs" style={{ color: getImportanceColor(insight.importance) }}>
                重要度: {insight.importance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div data-testid="ai-report-recommendations">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="material-icons text-lg"
            style={{ color: 'var(--action-color)' }}
          >
            recommend
          </span>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            推奨事項（Recommendations）
          </h4>
        </div>
        <div className="space-y-2">
          {report.recommendations.map((rec) => (
            <div
              key={rec.id}
              data-testid="ai-report-recommendation-item"
              className="p-3 bg-[var(--bg-tertiary)] rounded-lg border-l-3"
              style={{ borderLeftColor: 'var(--action-color)' }}
            >
              <div className="font-medium text-sm text-[var(--text-primary)] mb-1">
                <span data-testid="rec-priority">{rec.priority}</span>. <span data-testid="rec-title">{rec.title}</span>:
              </div>
              <div data-testid="rec-description" className="text-sm text-[var(--text-secondary)]">
                {rec.description}
              </div>
              {rec.category && (
                <div className="mt-2">
                  <span data-testid="rec-category-tag" className="inline-block px-2 py-1 bg-[var(--primary)] text-white rounded text-xs">
                    {rec.category === 'time_optimization' && '時間最適化'}
                    {rec.category === 'habit_improvement' && '習慣改善'}
                    {rec.category === 'success_pattern' && '成功パターン'}
                    {rec.category === 'other' && 'その他'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
