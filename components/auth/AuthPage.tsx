'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type UserType = 'mentor' | 'client';
type ViewType = 'login' | 'password-reset';

export const AuthPage: React.FC = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [userType, setUserType] = useState<UserType>('mentor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { signIn } = await import('next-auth/react');

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok) {
        // ログイン失敗（認証情報が間違っている）
        setError('メールアドレスまたはパスワードが正しくありません');
        setIsSubmitting(false);
        return;
      }

      // ログイン成功 - セッション取得してロール検証
      const { getSession } = await import('next-auth/react');
      const session = await getSession();

      // ユーザーが選択したタイプと実際のロール・権限を照合
      const actualRole = session?.user?.role;
      const isMentor = session?.user?.isMentor;

      // デバッグログ
      console.log('=== ログイン情報 ===');
      console.log('選択したタイプ:', userType);
      console.log('セッション情報:', {
        email: session?.user?.email,
        role: actualRole,
        isMentor: isMentor,
      });

      if (userType === 'mentor') {
        // メンター選択時：isMentor=true が必要
        if (isMentor) {
          router.push('/admin');
        } else {
          // メンター権限がない
          setError('このアカウントはメンター権限がありません。クライアントとしてログインしてください。');
          // ログアウト
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
        }
      } else {
        // クライアント選択時：role='client' が必要
        if (actualRole === 'client') {
          router.push('/client');
        } else {
          // クライアントとしてログインできない
          setError('このアカウントはクライアント権限がありません。メンターとしてログインしてください。');
          // ログアウト
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
        }
      }
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // パスワードリセット処理
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'リセットリンクの送信に失敗しました');
        return;
      }

      // 成功メッセージを表示してログイン画面に戻る
      alert(
        `${data.message || 'パスワードリセットリンクを送信しました'}\n\nメールをご確認ください。\nメールが届かない場合は、迷惑メールフォルダもご確認ください。`
      );
      setResetEmail('');
      setCurrentView('login');
    } catch (err) {
      setError('リセットリンクの送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f7fa' }}>
      <div
        className="w-full max-w-[900px] min-h-[600px] flex rounded-lg overflow-hidden shadow-lg bg-white"
        data-testid="auth-card"
      >
        {/* 左側情報パネル */}
        <div
          className="w-[40%] p-8 text-white relative overflow-hidden hidden md:flex md:flex-col"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <div className="mb-8 flex items-center gap-2">
            <span className="material-icons text-2xl">hub</span>
            <span className="text-2xl font-bold">COM:PASS</span>
          </div>

          <h1 className="text-2xl font-bold mb-4">ライフ・ワークガバナンス プラットフォーム</h1>
          <p className="mb-6 opacity-90">
            個人の幸福と組織の成果を両立するための統合プラットフォームへようこそ。効果的なコミュニケーションとAI支援によって、最適な成長をサポートします。
          </p>

          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-start gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="material-icons text-sm">trending_up</span>
              </div>
              <div className="text-sm">自律的な成長サイクルの確立と継続的なモチベーション維持</div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="material-icons text-sm">psychology</span>
              </div>
              <div className="text-sm">AIを活用した4層ナレッジエンジンによる最適な支援</div>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="material-icons text-sm">balance</span>
              </div>
              <div className="text-sm">ワークとライフの最適なバランスによるウェルビーイングの向上</div>
            </div>
          </div>

          {/* 装飾パターン */}
          <div
            className="absolute -bottom-12 -right-12 w-[300px] h-[300px] rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div
              className="absolute top-12 left-12 w-[200px] h-[200px] rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div
                className="absolute top-12 left-12 w-[100px] h-[100px] rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            </div>
          </div>
        </div>

        {/* 右側フォームパネル */}
        <div className="w-full md:w-[60%] p-8 flex flex-col">
          {currentView === 'login' ? (
            <>
              {/* ログインフォーム */}
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
                  ログイン
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  アカウント情報を入力してログインしてください
                </p>
              </div>

              {/* ユーザータイプ選択 */}
              <div className="flex gap-2 mb-6">
                <div
                  className={`flex-1 p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                    userType === 'mentor'
                      ? 'border-[var(--primary)] bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setUserType('mentor')}
                  data-testid="mentor-option"
                >
                  <div className="flex items-center justify-center mb-1">
                    <span className="material-icons text-4xl" style={{ color: 'var(--primary)' }}>
                      person_pin
                    </span>
                  </div>
                  <div className="font-medium">メンター</div>
                </div>
                <div
                  className={`flex-1 p-4 border-2 rounded-lg text-center cursor-pointer transition-all ${
                    userType === 'client'
                      ? 'border-[var(--primary)] bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setUserType('client')}
                  data-testid="client-option"
                >
                  <div className="flex items-center justify-center mb-1">
                    <span className="material-icons text-4xl" style={{ color: 'var(--secondary)' }}>
                      person
                    </span>
                  </div>
                  <div className="font-medium">クライアント</div>
                </div>
              </div>

              {/* ソーシャルログイン */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  data-testid="google-login-button"
                >
                  <span className="material-icons text-lg" style={{ color: '#DB4437' }}>
                    mail
                  </span>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  data-testid="microsoft-login-button"
                >
                  <span className="material-icons text-lg" style={{ color: '#1877F2' }}>
                    business
                  </span>
                  <span>Microsoft</span>
                </button>
              </div>

              <div className="flex items-center my-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-2">または</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-1 font-medium text-sm">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary-light)]"
                    required
                    disabled={isSubmitting}
                    data-testid="login-email-input"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="block mb-1 font-medium text-sm">
                    パスワード
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary-light)]"
                      required
                      disabled={isSubmitting}
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <span className="material-icons text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end items-center mb-6 text-sm">
                  <button
                    type="button"
                    onClick={() => setCurrentView('password-reset')}
                    className="text-[var(--secondary)] hover:underline"
                    data-testid="forgot-password-link"
                  >
                    パスワードを忘れた場合
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full p-3 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="login-button"
                >
                  <span className="material-icons">login</span>
                  <span>{isSubmitting ? 'ログイン中...' : 'ログイン'}</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* パスワードリセットフォーム */}
              <button
                onClick={() => setCurrentView('login')}
                className="inline-flex items-center gap-1 text-[var(--secondary)] hover:underline mb-4 text-sm"
                data-testid="back-to-login"
              >
                <span className="material-icons text-sm">arrow_back</span>
                <span>ログインに戻る</span>
              </button>

              <div className="mb-6">
                <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
                  パスワードリセット
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  登録したメールアドレスを入力してください。パスワード再設定のリンクをお送りします。
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordReset}>
                <div className="mb-4">
                  <label htmlFor="reset-email" className="block mb-1 font-medium text-sm">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="example@company.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary-light)]"
                    required
                    disabled={isSubmitting}
                    data-testid="reset-email-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full p-3 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="reset-submit-button"
                >
                  <span className="material-icons">send</span>
                  <span>{isSubmitting ? '送信中...' : 'リセットリンクを送信'}</span>
                </button>
              </form>
            </>
          )}

          {/* フッター */}
          <div className="mt-auto text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>アカウントをお持ちでない場合は、管理者にお問い合わせください</p>
            <p className="mt-2">
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-[var(--secondary)] hover:underline bg-transparent border-none cursor-pointer"
              >
                ヘルプ
              </button>{' '}
              ·{' '}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-[var(--secondary)] hover:underline bg-transparent border-none cursor-pointer"
              >
                プライバシーポリシー
              </button>{' '}
              ·{' '}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-[var(--secondary)] hover:underline bg-transparent border-none cursor-pointer"
              >
                利用規約
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
