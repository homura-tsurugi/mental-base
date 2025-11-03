'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsData } from '@/hooks/useSettingsData';
import { ProfileUpdateForm, PasswordChangeForm } from '@/types';

/**
 * 管理者設定ページ
 *
 * 機能:
 * - プロフィール編集
 * - パスワード変更
 * - 通知設定
 */
const AdminSettingsPage: React.FC = () => {
  const {
    profile,
    settings,
    loading,
    error,
    updateProfile,
    changePassword,
    updateNotificationSettings,
  } = useSettingsData();

  // Form states
  const [profileForm, setProfileForm] = useState<ProfileUpdateForm>({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await updateProfile(profileForm);
      setSuccessMessage('プロフィールを更新しました');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError('プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError('新しいパスワードが一致しません');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(passwordForm);
      setSuccessMessage('パスワードを変更しました');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError('パスワードの変更に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationChange = async (checked: boolean) => {
    setEmailNotifications(checked);
    try {
      await updateNotificationSettings({ emailNotifications: checked });
      setSuccessMessage('通知設定を更新しました');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setFormError('通知設定の更新に失敗しました');
      setEmailNotifications(!checked);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">管理者設定</h1>
          <p className="text-sm text-gray-600 mt-1">プロフィールとアカウント設定を管理します</p>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* エラーメッセージ */}
        {(error || formError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error?.message || formError}
          </div>
        )}

        {/* プロフィール編集 */}
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">プロフィール</h2>
          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </Card>

        {/* パスワード変更 */}
        <Card className="mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">パスワード変更</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '変更中...' : 'パスワードを変更'}
              </Button>
            </div>
          </form>
        </Card>

        {/* 通知設定 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">通知設定</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">メール通知</p>
              <p className="text-sm text-gray-600">クライアントからの更新をメールで受け取る</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => handleNotificationChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
