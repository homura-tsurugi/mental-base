'use client';

// クライアント登録モーダルコンポーネント
// M-001: メンターダッシュボード

import { useState } from 'react';

interface RegisterClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  onSuccess?: () => void;
}

export function RegisterClientModal({ isOpen, onClose, mentorId, onSuccess }: RegisterClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, name, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'クライアント登録に失敗しました');
      }

      const data = await response.json();
      setGeneratedPassword(data.data.temporaryPassword);
      setEmailSent(data.data.emailSent || false);
      setSuccess(true);

      // 成功後、クライアント一覧を更新
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クライアント登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setError('');
    setSuccess(false);
    setGeneratedPassword('');
    setEmailSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">クライアント登録</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {success ? (
          <div className="py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-green-600 text-4xl">check_circle</span>
            </div>
            <p className="text-lg font-medium text-gray-900 text-center mb-2">登録完了しました！</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              {emailSent ? (
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{email}</strong> にアカウント情報を送信しました。
                </p>
              ) : (
                <div className="mb-2">
                  <p className="text-sm text-amber-700 font-medium mb-1">
                    ⚠️ メール送信に失敗しました
                  </p>
                  <p className="text-xs text-gray-600">
                    クライアント（<strong>{email}</strong>）に以下の初期パスワードを直接お伝えください。
                  </p>
                </div>
              )}
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">初期パスワード:</p>
                <p className="text-sm font-mono font-bold text-gray-900 break-all">{generatedPassword}</p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ※ クライアントに初期パスワードを伝えてください。ログイン後にパスワード変更を推奨します。
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  クライアント名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                  minLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <span className="material-icons text-sm align-middle mr-1">info</span>
                  アカウント作成後、初期パスワードが自動生成されます。クライアントにメールでログイン情報が送信されます。
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      登録中...
                    </span>
                  ) : (
                    'クライアントを登録'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
