'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsData } from '@/hooks/useSettingsData';
import { ProfileUpdateForm, PasswordChangeForm } from '@/types';
import { MentorRegistration } from '@/components/settings/MentorRegistration';
import { DataAccessControl } from '@/components/settings/DataAccessControl';

const SettingsPage: React.FC = () => {
  const {
    profile,
    settings,
    loading,
    error,
    updateProfile,
    changePassword,
    updateNotificationSettings,
    deleteAccount,
  } = useSettingsData();

  // Form states
  const [profileForm, setProfileForm] = useState<ProfileUpdateForm>({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // プロフィールデータが読み込まれたらフォームに設定
  useEffect(() => {
    if (profile) {
      setProfileForm({ name: profile.name, email: profile.email });
    }
  }, [profile]);

  // 設定データが読み込まれたらフォームに設定
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.emailNotifications);
    }
  }, [settings]);

  // ページタイトル設定
  useEffect(() => {
    document.title = 'Settings | Mental-Base';
  }, []);

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div data-testid="loading-state" className="flex items-center justify-center py-16">
          <div className="text-center">
            <div data-testid="loading-spinner" className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p data-testid="loading-text" className="text-[var(--text-secondary)]">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="p-4">
          <Card data-testid="error-message" className="p-4 bg-red-50 border-red-200">
            <p className="text-red-600 font-medium">エラーが発生しました: {error.message}</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await updateProfile(profileForm);
      setSuccessMessage('プロフィールが更新されました');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError((err as Error).message);
      setTimeout(() => setFormError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await changePassword(passwordForm);
      setSuccessMessage('パスワードが変更されました');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError((err as Error).message);
      setTimeout(() => setFormError(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailNotificationsToggle = async () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);

    try {
      await updateNotificationSettings({ emailNotifications: newValue });
      setSuccessMessage(`メール通知を${newValue ? '有効' : '無効'}にしました`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError((err as Error).message);
      setTimeout(() => setFormError(''), 5000);
      setEmailNotifications(!newValue); // エラー時は元に戻す
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount({ userId: profile?.id || '' });
      // アカウント削除成功後はログアウトページへリダイレクト
      // 本番環境では signOut() を呼び出す
      alert('アカウントが削除されました。ログアウトします。');
      window.location.href = '/auth/login';
    } catch (err) {
      setFormError((err as Error).message);
      setIsDeleteModalOpen(false);
    }
  };

  const handleMentorUpdate = () => {
    // メンター登録・更新後にプロフィールを再読み込み
    setProfileRefreshKey((prev) => prev + 1);
    setSuccessMessage('メンター情報が更新されました');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <MainLayout>
      <div className="pb-20">
        {/* Success Message */}
        {successMessage && (
          <div data-testid="success-message" className="mx-4 mt-4">
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <span className="material-icons text-green-600 text-lg">check_circle</span>
                <p className="text-green-700 text-sm font-medium">{successMessage}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Error Message */}
        {formError && (
          <div data-testid="error-message" className="mx-4 mt-4">
            <Card className="p-3 bg-red-50 border-red-200">
              <div className="flex items-center gap-2">
                <span className="material-icons text-red-600 text-lg">error</span>
                <p className="text-red-700 text-sm font-medium">{formError}</p>
              </div>
            </Card>
          </div>
        )}

        {/* Profile Section */}
        <section data-testid="profile-section" className="p-6">
          <h2 data-testid="profile-heading" className="text-lg font-bold text-[var(--text-primary)] mb-4">プロフィール</h2>

          <Card className="p-4 shadow-md">
            <form data-testid="profile-form" onSubmit={handleProfileSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="name">
                  名前
                </label>
                <input
                  data-testid="profile-name-input"
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="名前を入力してください"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2" htmlFor="email">
                  メールアドレス
                </label>
                <input
                  data-testid="profile-email-input"
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="メールアドレスを入力してください"
                />
              </div>

              <Button data-testid="profile-save-button" type="submit" className="w-full" disabled={isSubmitting}>
                <span className="material-icons text-lg mr-2">save</span>
                {isSubmitting ? '更新中...' : 'プロフィールを保存'}
              </Button>
            </form>
          </Card>
        </section>

        {/* Mentor Registration Section */}
        {profile && (
          <section data-testid="mentor-registration-section" className="px-6 pb-6">
            <MentorRegistration user={profile} onUpdate={handleMentorUpdate} />
          </section>
        )}

        {/* Password Change Section */}
        <section data-testid="password-section" className="px-6 pb-6">
          <h2 data-testid="password-heading" className="text-lg font-bold text-[var(--text-primary)] mb-4">パスワード変更</h2>

          <Card className="p-4 shadow-md">
            <form data-testid="password-form" onSubmit={handlePasswordSubmit}>
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                  htmlFor="currentPassword"
                >
                  現在のパスワード
                </label>
                <input
                  data-testid="password-current-input"
                  type="password"
                  id="currentPassword"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="現在のパスワードを入力してください"
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                  htmlFor="newPassword"
                >
                  新しいパスワード
                </label>
                <input
                  data-testid="password-new-input"
                  type="password"
                  id="newPassword"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="8文字以上で入力してください"
                />
              </div>

              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
                  htmlFor="confirmPassword"
                >
                  新しいパスワード（確認）
                </label>
                <input
                  data-testid="password-confirm-input"
                  type="password"
                  id="confirmPassword"
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg text-base text-[var(--text-primary)] transition-colors focus:outline-none focus:border-[var(--primary)]"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="新しいパスワードを再入力してください"
                />
              </div>

              <Button data-testid="password-change-button" type="submit" className="w-full" disabled={isSubmitting}>
                <span className="material-icons text-lg mr-2">lock</span>
                {isSubmitting ? '変更中...' : 'パスワードを変更'}
              </Button>
            </form>
          </Card>
        </section>

        {/* Notification Settings Section */}
        <section data-testid="notification-section" className="px-6 pb-6">
          <h2 data-testid="notification-heading" className="text-lg font-bold text-[var(--text-primary)] mb-4">通知設定</h2>

          <Card className="p-4 shadow-md">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-base font-medium text-[var(--text-primary)]">メール通知</div>
                <div data-testid="notification-email-description" className="text-sm text-[var(--text-tertiary)] mt-1">
                  重要なお知らせやリマインダーをメールで受け取る
                </div>
              </div>
              <label className="relative inline-block w-12 h-7 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={handleEmailNotificationsToggle}
                  className="opacity-0 w-0 h-0 peer"
                />
                <span
                  data-testid="notification-email-toggle"
                  data-state={emailNotifications ? 'checked' : 'unchecked'}
                  className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-[var(--border-dark)] transition-all rounded-full peer-checked:bg-[var(--success)] before:absolute before:content-[''] before:h-5 before:w-5 before:left-1 before:bottom-1 before:bg-white before:transition-all before:rounded-full peer-checked:before:translate-x-5"></span>
              </label>
            </div>
          </Card>
        </section>

        {/* Data Access Control Section */}
        {profile && (
          <section data-testid="data-access-control-section" className="px-6 pb-6">
            <DataAccessControl user={profile} />
          </section>
        )}

        {/* Danger Zone Section */}
        <section data-testid="danger-zone" className="px-6 pb-6">
          <h2 data-testid="account-heading" className="text-lg font-bold text-[var(--text-primary)] mb-4">アカウント管理</h2>

          <Card className="p-4 shadow-md">
            <div data-testid="account-danger-zone" className="border border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-1 text-base font-bold text-red-600 mb-2">
                <span data-testid="account-warning-icon" className="material-icons text-lg">warning</span>
                <span data-testid="account-warning-text">危険な操作</span>
              </div>
              <div data-testid="account-description" className="text-sm text-[var(--text-secondary)] mb-4">
                アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
              </div>
              <button
                data-testid="account-delete-button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg text-base font-medium hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-lg">delete_forever</span>
                アカウントを削除
              </button>
            </div>
          </Card>
        </section>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div
          data-testid="account-delete-modal-backdrop"
          className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            data-testid="account-delete-modal"
            className="bg-white rounded-lg p-6 max-w-md w-[90%] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 data-testid="account-delete-modal-title" className="text-xl font-bold text-[var(--text-primary)] mb-4">アカウント削除の確認</h3>
            <p data-testid="account-delete-modal-warning" className="text-sm text-[var(--text-secondary)] mb-6">
              本当にアカウントを削除しますか？この操作は取り消せません。すべてのデータが完全に削除されます。
            </p>
            <div className="flex gap-2">
              <button
                data-testid="account-delete-modal-cancel-button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg text-base font-medium hover:bg-[var(--border-dark)] transition-colors"
              >
                キャンセル
              </button>
              <button
                data-testid="account-delete-modal-confirm-button"
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg text-base font-medium hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SettingsPage;
