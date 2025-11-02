// クライアント詳細サービス
// APIコール集約

import type {
  ClientDetailData,
  MentorNote,
  ClientProgressReport,
} from '@/types';

export class ClientDetailService {
  /**
   * クライアント詳細データ取得
   * GET /api/mentor/client/[id]
   */
  static async getClientDetail(clientId: string): Promise<ClientDetailData> {
    const response = await fetch(`/api/mentor/client/\${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'クライアント詳細の取得に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * メンターノート一覧取得
   * GET /api/mentor/notes?clientId=xxx
   */
  static async getNotes(clientId: string): Promise<MentorNote[]> {
    const response = await fetch(
      `/api/mentor/notes?clientId=\${clientId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ノート一覧の取得に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * メンターノート作成
   * POST /api/mentor/notes
   */
  static async createNote(note: {
    clientId: string;
    title: string;
    content: string;
    noteType?: string;
    isSharedWithClient?: boolean;
    tags?: string[];
    linkedDataType?: string | null;
    linkedDataId?: string | null;
  }): Promise<MentorNote> {
    const response = await fetch('/api/mentor/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ノートの作成に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * メンターノート更新
   * PUT /api/mentor/notes/[id]
   */
  static async updateNote(
    noteId: string,
    updates: {
      title?: string;
      content?: string;
      noteType?: string;
      isSharedWithClient?: boolean;
      tags?: string[];
      linkedDataType?: string | null;
      linkedDataId?: string | null;
    }
  ): Promise<MentorNote> {
    const response = await fetch(`/api/mentor/notes/\${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ノートの更新に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * メンターノート削除
   * DELETE /api/mentor/notes/[id]
   */
  static async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`/api/mentor/notes/\${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'ノートの削除に失敗しました');
    }
  }

  /**
   * 進捗レポート一覧取得
   * GET /api/mentor/reports?clientId=xxx
   */
  static async getReports(clientId: string): Promise<ClientProgressReport[]> {
    const response = await fetch(
      `/api/mentor/reports?clientId=\${clientId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'レポート一覧の取得に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * 進捗レポート更新
   * PUT /api/mentor/reports/[id]
   */
  static async updateReport(
    reportId: string,
    updates: {
      mentorComments?: string;
      areasOfImprovement?: string[];
      strengths?: string[];
      nextSteps?: string;
      mentorRating?: number;
      overallProgress?: number;
    }
  ): Promise<ClientProgressReport> {
    const response = await fetch(`/api/mentor/reports/\${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'レポートの更新に失敗しました');
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * 進捗レポート共有
   * POST /api/mentor/reports/[id]/share
   */
  static async shareReport(reportId: string): Promise<void> {
    const response = await fetch(
      `/api/mentor/reports/\${reportId}/share`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'レポートの共有に失敗しました');
    }
  }
}
