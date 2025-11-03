'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PeriodSelector } from '@/components/check-action/PeriodSelector';
import { ProgressStats } from '@/components/check-action/ProgressStats';
import { ProgressChart } from '@/components/check-action/ProgressChart';
import { ReflectionForm } from '@/components/check-action/ReflectionForm';
import { AIReportCard } from '@/components/check-action/AIReportCard';
import { ActionPlanForm } from '@/components/check-action/ActionPlanForm';
import { useCheckActionData } from '@/hooks/useCheckActionData';
import { UserDisplay } from '@/types';

type TabType = 'check' | 'action';

export default function CheckActionPage() {
  const {
    data,
    loading,
    error,
    currentPeriod,
    changePeriod,
    createReflection,
    generateAIAnalysis,
    createActionPlan,
  } = useCheckActionData();

  const [activeTab, setActiveTab] = useState<TabType>('check');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // モックユーザー（将来的には認証から取得）
  const mockUser: UserDisplay = {
    id: 'user1',
    email: 'test@mentalbase.local',
    name: 'Tanaka Sato',
    initials: 'TS',
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'CLIENT',
    isMentor: false,
    expertise: [],
  };

  const handleAIAnalyzeClick = async () => {
    if (!data?.reflections || data.reflections.length === 0) {
      alert('まず振り返りを記録してください');
      return;
    }

    setIsAnalyzing(true);
    try {
      const latestReflection = data.reflections[0];
      await generateAIAnalysis(latestReflection.id);
      // AI分析完了後、Actionタブに切り替え
      setActiveTab('action');
    } catch (err) {
      console.error('AI analysis error:', err);
      alert('AI分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout user={mockUser}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p data-testid="loading-text" className="text-[var(--text-tertiary)]">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout user={mockUser}>
        <div className="px-6 py-6">
          <div data-testid="error-card" className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">エラーが発生しました</p>
            <p data-testid="error-message" className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout user={mockUser}>
        <div className="px-6 py-6">
          <p data-testid="empty-state-message" className="text-[var(--text-tertiary)]">データがありません</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={mockUser}>
      <div data-testid="page-container">
        {/* Page Title */}
        <div className="px-6 pt-6 pb-4">
          <h1 data-testid="page-title" className="text-2xl font-bold text-[var(--text-primary)]">
            振り返り・改善
          </h1>
        </div>

        {/* Tab Switcher */}
        <div data-testid="tab-section" className="px-6 mb-6">
          <div data-testid="tabs-container" className="bg-[var(--bg-primary)] rounded-lg p-1 shadow-sm flex gap-1">
          <button
            data-testid="tab-check"
            data-active={activeTab === 'check'}
            onClick={() => setActiveTab('check')}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2
              ${
                activeTab === 'check'
                  ? 'bg-[var(--check-color)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <span data-testid="check-tab-icon" className="material-icons text-lg">fact_check</span>
            <span>Check（振り返り）</span>
          </button>
          <button
            data-testid="tab-action"
            data-active={activeTab === 'action'}
            onClick={() => setActiveTab('action')}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2
              ${
                activeTab === 'action'
                  ? 'bg-[var(--action-color)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            <span data-testid="action-tab-icon" className="material-icons text-lg">trending_up</span>
            <span>Action（改善）</span>
          </button>
          </div>
        </div>

        {/* Check Tab Content */}
        {activeTab === 'check' && (
          <div className="px-6">
            {/* Period Selector */}
            <PeriodSelector
              currentPeriod={currentPeriod}
              onPeriodChange={changePeriod}
            />

            {/* Progress Statistics */}
            <div data-testid="stats-container">
              <ProgressStats stats={data.stats} />
            </div>

            {/* Progress Chart */}
            <div data-testid="chart-container">
              <ProgressChart chartData={data.chartData} />
            </div>

          {/* Reflection Form */}
          <ReflectionForm
            period={data.period}
            onSubmit={createReflection}
            onAIAnalyzeClick={handleAIAnalyzeClick}
          />

          {/* AI分析中の表示 */}
          {isAnalyzing && (
            <div data-testid="ai-analysis-loading" className="bg-[var(--bg-primary)] rounded-lg p-6 mb-6 shadow-sm text-center">
              <div data-testid="ai-analysis-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--action-color)] mx-auto mb-4"></div>
              <p data-testid="ai-analysis-loading-text" className="text-[var(--text-primary)] font-medium">AI分析中...</p>
              <p data-testid="ai-analysis-loading-detail" className="text-sm text-[var(--text-tertiary)] mt-2">
                あなたの振り返り内容を分析しています
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Tab Content */}
      {activeTab === 'action' && (
        <div data-testid="action-tab-content" className="px-6">
          {/* AI Analysis Report */}
          {data.latestReport ? (
            <>
              <AIReportCard report={data.latestReport} />

              {/* Action Plan Form */}
              <ActionPlanForm
                reportId={data.latestReport.id}
                onSubmit={async (formData) => {
                  await createActionPlan(formData);
                }}
              />
            </>
          ) : (
            <div data-testid="no-report-message" className="bg-[var(--bg-primary)] rounded-lg p-6 text-center shadow-sm">
              <span data-testid="no-report-icon" className="material-icons text-6xl text-[var(--text-tertiary)] mb-4">
                psychology
              </span>
              <h3 data-testid="no-report-title" className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                AI分析レポートがありません
              </h3>
              <p data-testid="no-report-description" className="text-sm text-[var(--text-secondary)] mb-4">
                まずCheckタブで振り返りを記録し、AI分析を実行してください
              </p>
              <button
                data-testid="btn-go-to-check-tab"
                onClick={() => setActiveTab('check')}
                className="px-6 py-3 bg-[var(--check-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Checkタブへ移動
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </MainLayout>
  );
}
