'use client';

// 検索・フィルターコンポーネント
// M-001: メンターダッシュボード
// デザインシステム準拠

import { useState } from 'react';
import type { ClientFilterType, ClientSortOrder } from '@/types';

interface SearchFilterProps {
  onSearchChange?: (query: string) => void;
  onFilterChange?: (status: ClientFilterType) => void;
  onSortChange?: (sortBy: ClientSortOrder) => void;
}

export function SearchFilter({
  onSearchChange,
  onFilterChange,
  onSortChange,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientFilterType>('all');
  const [sortBy, setSortBy] = useState<ClientSortOrder>('progress');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (status: ClientFilterType) => {
    setFilterStatus(status);
    onFilterChange?.(status);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ClientSortOrder;
    setSortBy(value);
    onSortChange?.(value);
  };

  return (
    <section
      className="rounded-lg p-6 mb-8"
      style={{
        backgroundColor: 'var(--background)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* 検索バー */}
      <div
        className="flex items-center rounded-lg px-4 py-2 mb-4"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid #e2e8f0',
        }}
      >
        <span className="material-icons text-gray-400 mr-2">search</span>
        <input
          type="text"
          placeholder="クライアントを検索..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 border-none bg-transparent outline-none text-base"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* フィルター・ソート */}
      <div className="flex items-center flex-wrap gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          表示:
        </span>

        {/* フィルターチップ */}
        {[
          { value: 'all', label: '全て' },
          { value: 'on_track', label: '順調' },
          { value: 'stagnant', label: '停滞' },
          { value: 'needs_followup', label: '要フォロー' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value as ClientFilterType)}
            className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-all ${
              filterStatus === filter.value
                ? 'text-white'
                : ''
            }`}
            style={
              filterStatus === filter.value
                ? {
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                  }
                : {
                    backgroundColor: 'var(--surface)',
                    border: '1px solid #e2e8f0',
                    color: 'var(--text-primary)',
                  }
            }
          >
            {filter.label}
          </button>
        ))}

        {/* ソート */}
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="ml-auto px-4 py-2 rounded-lg text-sm cursor-pointer outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid #e2e8f0',
            color: 'var(--text-primary)',
          }}
        >
          <option value="progress">進捗率順</option>
          <option value="last_activity">最終活動日順</option>
          <option value="name">名前順</option>
        </select>
      </div>
    </section>
  );
}

