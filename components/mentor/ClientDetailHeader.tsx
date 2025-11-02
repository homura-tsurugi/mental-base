'use client';

// クライアント詳細ヘッダーコンポーネント
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClientStatus, CLIENT_STATUS_DISPLAY_MAP } from '@/types';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  relationshipStartDate: string;
  overallProgress: number;
  status: ClientStatus;
  initials: string;
}

interface ClientDetailHeaderProps {
  clientId: string;
  mentorId: string;
  onGenerateReport?: () => void;
}

export function ClientDetailHeader({
  clientId,
  mentorId,
  onGenerateReport,
}: ClientDetailHeaderProps) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientInfo() {
      // @MOCK_TO_API
      try {
        const response = await fetch(`/api/mentor/client/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data.clientInfo);
        }
      } catch (error) {
        console.error('クライアント情報の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientInfo();
  }, [clientId]);

  if (loading) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-red-600">クライアント情報の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const statusDisplay = client.status
    ? CLIENT_STATUS_DISPLAY_MAP[client.status]
    : null;

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="px-4 py-4">
        {/* 戻るボタン */}
        <div className="mb-3">
          <Link
            href="/mentor"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="material-icons text-base mr-1">arrow_back</span>
            メンターダッシュボードに戻る
          </Link>
        </div>

        <div className="space-y-4">
          {/* トップセクション: クライアント情報 + レポート生成ボタン */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* アバター */}
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {client.initials || client.name.charAt(0)}
              </div>

              {/* クライアント情報 */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {client.name}
                </h1>
                <p className="text-sm text-gray-500">{client.email}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                  <span>登録日: {formatDate(client.registeredAt)}</span>
                  <span>•</span>
                  <span>
                    メンター関係開始: {formatDate(client.relationshipStartDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* 進捗レポート生成ボタン */}
            <button
              onClick={onGenerateReport}
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="material-icons text-base">description</span>
              進捗レポート生成
            </button>
          </div>

          {/* ボトムセクション: 進捗率 + ステータス */}
          <div className="flex items-center gap-6">
            {/* 進捗円グラフ */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={getProgressColor(client.overallProgress).replace(
                    'bg-',
                    ''
                  )}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${
                    (client.overallProgress / 100) * 251.2
                  } 251.2`}
                  strokeLinecap="round"
                  className={
                    client.overallProgress >= 70
                      ? 'stroke-green-500'
                      : client.overallProgress >= 40
                      ? 'stroke-amber-500'
                      : 'stroke-red-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">
                  {client.overallProgress}%
                </span>
                <span className="text-xs text-gray-500">総合進捗率</span>
              </div>
            </div>

            {/* ステータスバッジ */}
            {statusDisplay && (
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: statusDisplay.badgeColor,
                  color: statusDisplay.textColor,
                }}
              >
                <span className="material-icons text-base">
                  {statusDisplay.icon}
                </span>
                {statusDisplay.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
