'use client';

// クライアント一覧コンポーネント
// M-001: メンターダッシュボード
// デザインシステム準拠

import { useEffect, useState } from 'react';
import { ClientCard } from './ClientCard';
import { SearchFilter } from './SearchFilter';
import type { ClientSummary, ClientFilterType, ClientSortOrder } from '@/types';

interface ClientListProps {
  mentorId: string;
}

export function ClientList({ mentorId }: ClientListProps) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientFilterType>('all');
  const [sortBy, setSortBy] = useState<ClientSortOrder>('progress');

  useEffect(() => {
    // @MOCK_TO_API: メンターダッシュボードクライアント一覧取得
    // 本番: /api/mentor/dashboard から取得
    async function fetchClients() {
      try {
        const response = await fetch(`/api/mentor/dashboard?mentorId=${mentorId}`);
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
          setFilteredClients(data.clients || []);
        }
      } catch (error) {
        console.error('クライアントデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, [mentorId]);

  // フィルタリング・ソート処理
  useEffect(() => {
    let result = [...clients];

    // 検索フィルター
    if (searchQuery) {
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (filterStatus !== 'all') {
      result = result.filter((client) => client.status === filterStatus);
    }

    // ソート
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ja');
      } else if (sortBy === 'progress') {
        return b.overallProgress - a.overallProgress;
      } else {
        // last_activity
        return (
          new Date(b.lastActivityDate).getTime() -
          new Date(a.lastActivityDate).getTime()
        );
      }
    });

    setFilteredClients(result);
  }, [clients, searchQuery, filterStatus, sortBy]);

  if (loading) {
    return (
      <>
        {/* 検索・フィルターのスケルトン */}
        <div
          className="rounded-lg p-6 mb-8 animate-pulse"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* クライアントグリッドのスケルトン */}
        <section className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg p-6 animate-pulse"
              style={{
                backgroundColor: 'var(--background)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-28"></div>
            </div>
          ))}
        </section>
      </>
    );
  }

  return (
    <>
      {/* クライアント招待ボタン */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          クライアント一覧
        </h2>
        <button
          data-testid="invite-client-btn"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          onClick={() => {
            // TODO: 招待モーダルを開く
            console.log('クライアント招待');
          }}
        >
          クライアント招待
        </button>
      </div>

      {/* 検索・フィルター */}
      <SearchFilter
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterStatus}
        onSortChange={setSortBy}
      />

      {/* クライアント一覧 */}
      {filteredClients.length === 0 ? (
        <div
          data-testid="empty-state"
          className="rounded-lg p-12 text-center"
          style={{
            backgroundColor: 'var(--background)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3
            data-testid="empty-state-title"
            className="mt-2 text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            クライアントがいません
          </h3>
          <p
            data-testid="empty-state-message"
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {searchQuery || filterStatus !== 'all'
              ? '条件に一致するクライアントが見つかりませんでした'
              : 'クライアントを招待して始めましょう'}
          </p>
        </div>
      ) : (
        <section data-testid="client-list" className="grid grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </section>
      )}
    </>
  );
}

