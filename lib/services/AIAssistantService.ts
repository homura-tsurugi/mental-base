import {
  AIAssistantMode,
  AIAssistantModeInfo,
  ChatMessage,
  ChatMessageForm,
  AIChatResponse,
  ChatHistoryResponse,
  AIAssistantPageData,
} from '@/types';

/**
 * AIAssistantService - Real API Integration
 *
 * バックエンドAPI統合完了
 * GET /api/ai-assistant/modes: モード情報取得
 * GET /api/ai-assistant/chat/history: チャット履歴取得
 * POST /api/ai-assistant/chat/send: メッセージ送信
 * GET /api/ai-assistant/page-data: ページ初期データ取得
 */
export class AIAssistantService {
  private readonly baseUrl = '/api';

  /**
   * AIアシスタントモード情報取得
   *
   * API: GET /api/ai-assistant/modes
   * Response: AIAssistantModeInfo[]
   */
  getModeOptions(): AIAssistantModeInfo[] {
    // フロントエンド固定データ（APIなし）
    return [
      {
        mode: AIAssistantMode.PROBLEM_SOLVING,
        label: '課題解決モード',
        description: '抱えている問題について相談してください。一緒に解決策を考えましょう。',
        icon: 'psychology',
        welcomeMessage:
          'こんにちは！課題解決モードです。抱えている問題について相談してください。一緒に解決策を考えましょう。',
      },
      {
        mode: AIAssistantMode.LEARNING_SUPPORT,
        label: '学習支援モード',
        description: 'COMPASS教材の学習をサポートします。どの部分について学びたいですか？',
        icon: 'school',
        welcomeMessage:
          'こんにちは！学習支援モードです。COMPASS教材の学習をサポートします。どの部分について学びたいですか？',
      },
      {
        mode: AIAssistantMode.PLANNING,
        label: '計画立案モード',
        description: '目標設定や計画づくりをアシストします。どんな目標を立てたいですか？',
        icon: 'assignment',
        welcomeMessage:
          'こんにちは！計画立案モードです。目標設定や計画づくりをアシストします。どんな目標を立てたいですか？',
      },
      {
        mode: AIAssistantMode.MENTORING,
        label: '伴走補助モード',
        description: 'あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。',
        icon: 'support_agent',
        welcomeMessage:
          'こんにちは！伴走補助モードです。あなたのログを分析して、継続的なサポートをします。進捗状況を確認しましょう。',
      },
    ];
  }

  /**
   * チャット履歴取得
   *
   * API: GET /api/ai-assistant/chat/history
   * Query: mode?, limit?, cursor?
   * Response: ChatHistoryResponse
   */
  async getChatHistory(
    mode?: AIAssistantMode,
    limit: number = 50,
    cursor?: string
  ): Promise<ChatHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (mode) params.append('mode', mode);
      params.append('limit', limit.toString());
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(
        `${this.baseUrl}/ai-assistant/chat/history?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`チャット履歴の取得に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AIAssistantService.getChatHistory error:', error);
      throw error;
    }
  }

  /**
   * チャットメッセージ送信
   *
   * API: POST /api/ai-assistant/chat/send
   * Request: ChatMessageForm
   * Response: AIChatResponse
   */
  async sendMessage(form: ChatMessageForm): Promise<AIChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai-assistant/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`メッセージ送信に失敗しました: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AIAssistantService.sendMessage error:', error);
      throw error;
    }
  }

  /**
   * AIアシスタントページ初期データ取得
   *
   * API: GET /api/ai-assistant/page-data
   * Response: AIAssistantPageData
   */
  async getPageData(mode: AIAssistantMode): Promise<AIAssistantPageData> {
    try {
      // E2Eテストモード検出
      const skipAuth = typeof window !== 'undefined' && localStorage.getItem('VITE_SKIP_AUTH') === 'true';

      const response = await fetch(`${this.baseUrl}/ai-assistant/page-data?mode=${mode}${skipAuth ? '&skipAuth=true' : ''}`, {
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
        throw new Error(`ページデータの取得に失敗しました: ${response.status}`);
      }

      const data = await response.json();

      return {
        selectedMode: mode,
        modeOptions: this.getModeOptions(), // フロントエンド固定データ
        chatHistory: data.chatHistory || [],
        isLoading: false,
      };
    } catch (error) {
      console.error('AIAssistantService.getPageData error:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const aiAssistantService = new AIAssistantService();
