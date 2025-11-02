'use client';

// ProgressReportModal - 進捗レポート生成モーダル
// M-002: クライアント詳細

import { useState } from 'react';
import { ClientProgressReportForm, ReportPeriodType } from '@/types';

interface ProgressReportModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientProgressReportForm) => void;
}

export function ProgressReportModal({
  clientId,
  clientName,
  isOpen,
  onClose,
  onSubmit,
}: ProgressReportModalProps) {
  const [formData, setFormData] = useState<ClientProgressReportForm>({
    reportPeriod: 'weekly',
    startDate: new Date(),
    endDate: new Date(),
    mentorComments: '',
    mentorRating: undefined,
    areasOfImprovement: [],
    strengths: [],
    nextSteps: '',
    followUpDate: undefined,
    isSharedWithClient: true,
  });

  const [areasInput, setAreasInput] = useState('');
  const [strengthsInput, setStrengthsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const areas = areasInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const strengths = strengthsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSubmit({
      ...formData,
      areasOfImprovement: areas,
      strengths,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              進捗レポート生成 - {clientName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* レポート期間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                レポート期間 *
              </label>
              <select
                value={formData.reportPeriod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reportPeriod: e.target.value as ReportPeriodType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="weekly">週次</option>
                <option value="monthly">月次</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                評価（1-5段階）
              </label>
              <select
                value={formData.mentorRating || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mentorRating: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">未設定</option>
                <option value="5">5 - 非常に良い</option>
                <option value="4">4 - 良い</option>
                <option value="3">3 - 普通</option>
                <option value="2">2 - やや不十分</option>
                <option value="1">1 - 要改善</option>
              </select>
            </div>
          </div>

          {/* 期間設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                開始日 *
              </label>
              <input
                type="date"
                value={formData.startDate.toISOString().split('T')[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startDate: new Date(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                終了日 *
              </label>
              <input
                type="date"
                value={formData.endDate.toISOString().split('T')[0]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endDate: new Date(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* メンターコメント */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              メンターコメント
            </label>
            <textarea
              value={formData.mentorComments}
              onChange={(e) =>
                setFormData({ ...formData, mentorComments: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows={4}
              placeholder="全体的な所感やフィードバックを記入"
            />
          </div>

          {/* 改善が必要な領域 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              改善が必要な領域（1行に1項目）
            </label>
            <textarea
              value={areasInput}
              onChange={(e) => setAreasInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows={3}
              placeholder="例:&#10;タスク管理の精度向上&#10;定期的な振り返りの習慣化"
            />
          </div>

          {/* 強み */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              強みとして認識された領域（1行に1項目）
            </label>
            <textarea
              value={strengthsInput}
              onChange={(e) => setStrengthsInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows={3}
              placeholder="例:&#10;目標設定の明確さ&#10;継続的な学習姿勢"
            />
          </div>

          {/* 次のアクション */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              次のアクション
            </label>
            <textarea
              value={formData.nextSteps}
              onChange={(e) =>
                setFormData({ ...formData, nextSteps: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows={3}
              placeholder="次回までに取り組むべき具体的なアクションを記入"
            />
          </div>

          {/* フォローアップ予定日 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              フォローアップ予定日
            </label>
            <input
              type="date"
              value={
                formData.followUpDate
                  ? formData.followUpDate.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  followUpDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* クライアントと共有 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSharedWithClient}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isSharedWithClient: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900">
                このレポートをクライアントと共有する
              </span>
            </label>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              レポート生成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
