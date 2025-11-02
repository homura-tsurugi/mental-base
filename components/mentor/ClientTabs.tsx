'use client';

// クライアント詳細タブコンポーネント
// M-002: クライアント詳細

import { useState, useEffect } from 'react';
import { ClientDataAccessPermission } from '@/types';
import { GoalsTab } from './tabs/GoalsTab';
import { TasksTab } from './tabs/TasksTab';
import { LogsTab } from './tabs/LogsTab';
import { ReflectionsTab } from './tabs/ReflectionsTab';
import { AIReportsTab } from './tabs/AIReportsTab';
import { MentorNotesTab } from './tabs/MentorNotesTab';

interface ClientTabsProps {
  clientId: string;
  mentorId: string;
}

type TabType =
  | 'goals'
  | 'tasks'
  | 'logs'
  | 'reflections'
  | 'ai-reports'
  | 'notes';

export function ClientTabs({ clientId, mentorId }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [permissions, setPermissions] = useState<ClientDataAccessPermission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      // @MOCK_TO_API
      try {
        const response = await fetch(`/api/mentor/client/${clientId}/permissions`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('権限情報の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [clientId]);

  const tabs = [
    { id: 'goals' as TabType, label: '目標一覧' },
    { id: 'tasks' as TabType, label: 'タスク一覧' },
    { id: 'logs' as TabType, label: 'ログ履歴' },
    { id: 'reflections' as TabType, label: '振り返り' },
    { id: 'ai-reports' as TabType, label: 'AI分析レポート' },
    { id: 'notes' as TabType, label: 'メンターノート' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* タブヘッダー */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit py-3 px-4 text-center font-medium text-sm border-b-3 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-blue-600 text-blue-600'
                  : 'border-b-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="p-4">
        {activeTab === 'goals' && (
          <GoalsTab
            clientId={clientId}
            mentorId={mentorId}
            hasPermission={permissions?.allowGoals ?? false}
          />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            clientId={clientId}
            mentorId={mentorId}
            hasPermission={permissions?.allowTasks ?? false}
          />
        )}
        {activeTab === 'logs' && (
          <LogsTab
            clientId={clientId}
            mentorId={mentorId}
            hasPermission={permissions?.allowLogs ?? false}
          />
        )}
        {activeTab === 'reflections' && (
          <ReflectionsTab
            clientId={clientId}
            mentorId={mentorId}
            hasPermission={permissions?.allowReflections ?? false}
          />
        )}
        {activeTab === 'ai-reports' && (
          <AIReportsTab
            clientId={clientId}
            mentorId={mentorId}
            hasPermission={permissions?.allowAiReports ?? false}
          />
        )}
        {activeTab === 'notes' && (
          <MentorNotesTab clientId={clientId} mentorId={mentorId} />
        )}
      </div>
    </div>
  );
}
