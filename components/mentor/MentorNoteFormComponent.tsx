'use client';

// MentorNoteFormComponent - メンターノート作成/編集フォーム
// M-002: クライアント詳細

import { useState } from 'react';
import { MentorNoteForm, MentorNoteType } from '@/types';

interface MentorNoteFormComponentProps {
  initialData?: MentorNoteForm;
  onSubmit: (data: MentorNoteForm) => void;
  onCancel: () => void;
}

export function MentorNoteFormComponent({
  initialData,
  onSubmit,
  onCancel,
}: MentorNoteFormComponentProps) {
  const [formData, setFormData] = useState<MentorNoteForm>(
    initialData || {
      title: '',
      content: '',
      noteType: 'general',
      isSharedWithClient: false,
      tags: [],
    }
  );

  const [tagsInput, setTagsInput] = useState(
    initialData?.tags.join(', ') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      ...formData,
      tags,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-blue-600"
    >
      {/* タイトル */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          タイトル *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ノートのタイトルを入力"
          required
        />
      </div>

      {/* 内容 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          内容 *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          rows={5}
          placeholder="観察内容やメモを入力"
          required
        />
      </div>

      {/* ノートタイプ */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          ノートタイプ
        </label>
        <select
          value={formData.noteType}
          onChange={(e) =>
            setFormData({
              ...formData,
              noteType: e.target.value as MentorNoteType,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="general">一般</option>
          <option value="observation">観察</option>
          <option value="concern">懸念事項</option>
          <option value="achievement">成果</option>
        </select>
      </div>

      {/* タグ */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900 mb-1">
          タグ（カンマ区切り）
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 健康, 目標設定, モチベーション"
        />
      </div>

      {/* クライアントと共有 */}
      <div className="mb-4">
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
            このノートを非公開にする（クライアントには共有しない）
          </span>
        </label>
      </div>

      {/* アクションボタン */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          保存
        </button>
      </div>
    </form>
  );
}
