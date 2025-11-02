'use client';

// クライアントカードコンポーネント
// M-001: メンターダッシュボード
// デザインシステム準拠

import Link from 'next/link';
import type { ClientSummary } from '@/types';

interface ClientCardProps {
  client: ClientSummary;
}

export function ClientCard({ client }: ClientCardProps) {
  const getStatusInfo = (status: ClientSummary['status']) => {
    const statusMap = {
      on_track: {
        label: '順調',
        icon: 'check_circle',
        bgColor: 'rgba(72, 187, 120, 0.1)',
        textColor: 'var(--success)',
      },
      stagnant: {
        label: '停滞',
        icon: 'warning',
        bgColor: 'rgba(236, 201, 75, 0.1)',
        textColor: 'var(--warning)',
      },
      needs_followup: {
        label: '要フォロー',
        icon: 'error',
        bgColor: 'rgba(229, 62, 62, 0.1)',
        textColor: 'var(--error)',
      },
    };

    return statusMap[status];
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 70) return 'var(--success)';
    if (progress >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  // イニシャル生成（日本語名の場合は最初の1文字のみ）
  const getInitials = (name: string) => {
    // 日本語名の場合は最初の1文字
    if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(name)) {
      return name[0];
    }
    // 英語名の場合は各単語の最初の文字
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statusInfo = getStatusInfo(client.status);

  return (
    <Link href={`/mentor/client/${client.id}`} className="block">
      <div
        className="rounded-lg p-6 cursor-pointer transition-all hover:-translate-y-0.5"
        style={{
          backgroundColor: 'var(--background)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* ヘッダー: アバター + 名前・メール */}
        <div className="flex items-center gap-2 mb-4">
          {/* アバター */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: 'var(--secondary)' }}
          >
            {client.avatarUrl ? (
              <img
                src={client.avatarUrl}
                alt={client.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(client.name)
            )}
          </div>

          {/* 名前・メール */}
          <div className="flex-1">
            <div
              className="text-base font-medium mb-0.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {client.name}
            </div>
            <div
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {client.email}
            </div>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              進捗率
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {client.overallProgress}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${client.overallProgress}%`,
                backgroundColor: getProgressBarColor(client.overallProgress),
              }}
            ></div>
          </div>
        </div>

        {/* フッター: 最終活動 + ステータス */}
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            最終活動: {client.lastActivityLabel}
          </span>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: statusInfo.bgColor,
              color: statusInfo.textColor,
            }}
          >
            <span className="material-icons text-sm">{statusInfo.icon}</span>
            {statusInfo.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

