import {
  User,
  UserSettings,
  ProfileUpdateForm,
  PasswordChangeForm,
  NotificationSettingsForm,
  AccountDeletionRequest,
} from '@/types';

/**
 * SettingsService - Real API Integration
 *
 * バックエンドAPI統合完了
 * GET /api/users/profile: プロフィール取得
 * PUT /api/users/profile: プロフィール更新
 * POST /api/users/password: パスワード変更
 * GET /api/users/settings: ユーザー設定取得
 * PUT /api/users/settings: 通知設定更新
 * DELETE /api/users/account: アカウント削除
 */
export class SettingsService {
  private readonly baseUrl = '/api';

  /**
   * プロフィール情報取得
   *
   * API: GET /api/users/profile
   * Response: User
   */
  async getProfile(): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`プロフィール取得に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('SettingsService.getProfile error:', error);
      throw error;
    }
  }

  /**
   * プロフィール情報更新
   *
   * API: PUT /api/users/profile
   * Request: ProfileUpdateForm
   * Response: User
   */
  async updateProfile(data: ProfileUpdateForm): Promise<User> {
    try {
      // フロントエンドバリデーション
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(data.email)) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      if (!data.name || data.name.trim().length === 0) {
        throw new Error('名前を入力してください');
      }

      const response = await fetch(`${this.baseUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || '入力内容に誤りがあります');
        }
        throw new Error(`プロフィール更新に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('SettingsService.updateProfile error:', error);
      throw error;
    }
  }

  /**
   * パスワード変更
   *
   * API: POST /api/users/password
   * Request: PasswordChangeForm
   * Response: { success: boolean, message: string }
   */
  async changePassword(data: PasswordChangeForm): Promise<{ success: boolean; message: string }> {
    try {
      // フロントエンドバリデーション
      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        throw new Error('すべてのフィールドを入力してください');
      }

      if (data.newPassword.length < 8) {
        throw new Error('新しいパスワードは8文字以上で入力してください');
      }

      if (data.newPassword !== data.confirmPassword) {
        throw new Error('新しいパスワードが一致しません');
      }

      const response = await fetch(`${this.baseUrl}/users/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || '現在のパスワードが正しくありません');
        }
        throw new Error(`パスワード変更に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SettingsService.changePassword error:', error);
      throw error;
    }
  }

  /**
   * ユーザー設定取得
   *
   * API: GET /api/users/settings
   * Response: UserSettings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/users/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`設定取得に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('SettingsService.getSettings error:', error);
      throw error;
    }
  }

  /**
   * 通知設定更新
   *
   * API: PUT /api/users/settings
   * Request: NotificationSettingsForm
   * Response: UserSettings
   */
  async updateNotificationSettings(data: NotificationSettingsForm): Promise<UserSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`設定更新に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('SettingsService.updateNotificationSettings error:', error);
      throw error;
    }
  }

  /**
   * アカウント削除
   *
   * API: DELETE /api/users/account
   * Request: AccountDeletionRequest
   * Response: { success: boolean, message: string }
   */
  async deleteAccount(request: AccountDeletionRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'アカウント削除に失敗しました');
        }
        throw new Error(`アカウント削除に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SettingsService.deleteAccount error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const settingsService = new SettingsService();
