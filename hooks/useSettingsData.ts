'use client';

import { useState, useEffect } from 'react';
import { settingsService } from '@/lib/services/SettingsService';
import { User, UserSettings, ProfileUpdateForm, PasswordChangeForm, NotificationSettingsForm, AccountDeletionRequest } from '@/types';

interface UseSettingsDataReturn {
  profile: User | null;
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateProfile: (data: ProfileUpdateForm) => Promise<void>;
  changePassword: (data: PasswordChangeForm) => Promise<void>;
  updateNotificationSettings: (data: NotificationSettingsForm) => Promise<void>;
  deleteAccount: (request: AccountDeletionRequest) => Promise<void>;
}

/**
 * useSettingsData - Settings用カスタムフック
 *
 * プロフィール・設定データの取得・管理を行う
 */
export const useSettingsData = (): UseSettingsDataReturn => {
  const [profile, setProfile] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, settingsData] = await Promise.all([
        settingsService.getProfile(),
        settingsService.getSettings(),
      ]);
      setProfile(profileData);
      setSettings(settingsData);
    } catch (err) {
      setError(err as Error);
      console.error('Settings data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateForm) => {
    try {
      setError(null);
      const updatedProfile = await settingsService.updateProfile(data);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err as Error);
      throw err; // エラーをコンポーネント側で処理できるように再スロー
    }
  };

  const changePassword = async (data: PasswordChangeForm) => {
    try {
      setError(null);
      await settingsService.changePassword(data);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err as Error);
      throw err;
    }
  };

  const updateNotificationSettings = async (data: NotificationSettingsForm) => {
    try {
      setError(null);
      const updatedSettings = await settingsService.updateNotificationSettings(data);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Notification settings update error:', err);
      setError(err as Error);
      throw err;
    }
  };

  const deleteAccount = async (request: AccountDeletionRequest) => {
    try {
      setError(null);
      await settingsService.deleteAccount(request);
      // アカウント削除後の処理（ログアウト等）はコンポーネント側で実施
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err as Error);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    profile,
    settings,
    loading,
    error,
    refetch: fetchData,
    updateProfile,
    changePassword,
    updateNotificationSettings,
    deleteAccount,
  };
};
