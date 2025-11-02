// メンターダッシュボードサービス
// APIコール集約

import type {
  MentorDashboardData,
  MentorClientRelationship,
} from '@/types';

export class MentorDashboardService {
  /**
   * ダッシュボードデータ取得
   * GET /api/mentor/dashboard
   */
  static async getDashboardData(): Promise<MentorDashboardData> {
    const response = await fetch('/api/mentor/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ダッシュボードデータの取得に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * メンター-クライアント関係一覧取得
   * GET /api/mentor/relationships
   */
  static async getRelationships(): Promise<MentorClientRelationship[]> {
    const response = await fetch('/api/mentor/relationships', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '関係一覧の取得に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * クライアント招待
   * POST /api/mentor/invite
   */
  static async inviteClient(
    clientEmail: string,
    message?: string
  ): Promise<{ relationshipId: string; status: string }> {
    const response = await fetch('/api/mentor/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientEmail,
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'クライアント招待に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * 関係終了
   * DELETE /api/mentor/relationships/[id]/terminate
   */
  static async terminateRelationship(
    relationshipId: string,
    reason?: string
  ): Promise<void> {
    const response = await fetch(
      `/api/mentor/relationships/${relationshipId}/terminate`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '関係の終了に失敗しました');
    }
  }

  /**
   * 招待承認（クライアント側）
   * POST /api/mentor/relationships/[id]/accept
   */
  static async acceptInvitation(relationshipId: string): Promise<void> {
    const response = await fetch(
      `/api/mentor/relationships/${relationshipId}/accept`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '招待の承認に失敗しました');
    }
  }
}
