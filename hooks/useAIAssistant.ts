'use client';

import { useState, useEffect, useRef } from 'react';
import { aiAssistantService } from '@/lib/services/AIAssistantService';
import {
  AIAssistantMode,
  AIAssistantModeInfo,
  ChatMessage,
  ChatMessageForm,
} from '@/types';

interface UseAIAssistantReturn {
  selectedMode: AIAssistantMode;
  modeOptions: AIAssistantModeInfo[];
  chatHistory: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: Error | null;
  setSelectedMode: (mode: AIAssistantMode) => void;
  sendMessage: (content: string) => Promise<void>;
  refetch: () => Promise<void>;
  scrollToBottom: () => void;
}

/**
 * useAIAssistant - AIアシスタント用カスタムフック
 *
 * AIアシスタントページのデータ取得・管理を行う
 */
export const useAIAssistant = (): UseAIAssistantReturn => {
  const [selectedMode, setSelectedMode] = useState<AIAssistantMode>(
    AIAssistantMode.PROBLEM_SOLVING
  );
  const [modeOptions, setModeOptions] = useState<AIAssistantModeInfo[]>([]);

  // モード別履歴を保持
  const [messagesByMode, setMessagesByMode] = useState<
    Record<AIAssistantMode, ChatMessage[]>
  >({
    [AIAssistantMode.PROBLEM_SOLVING]: [],
    [AIAssistantMode.LEARNING_SUPPORT]: [],
    [AIAssistantMode.PLANNING]: [],
    [AIAssistantMode.MENTORING]: [],
  });

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // チャット履歴の末尾へのスクロール用ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 現在表示中のメッセージ
  const chatHistory = messagesByMode[selectedMode] || [];

  /**
   * ページデータ取得
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageData = await aiAssistantService.getPageData(selectedMode);
      setModeOptions(pageData.modeOptions);
      setMessagesByMode((prev) => ({
        ...prev,
        [selectedMode]: pageData.chatHistory,
      }));
    } catch (err) {
      setError(err as Error);
      console.error('AI Assistant page data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * チャット履歴取得（モード切り替え時）
   */
  const fetchChatHistory = async (mode: AIAssistantMode) => {
    // すでに履歴がある場合はスキップ
    if (messagesByMode[mode].length > 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // API呼び出し（E2Eモードは API層で処理）
      const historyResponse = await aiAssistantService.getChatHistory(mode);

      setMessagesByMode((prev) => ({
        ...prev,
        [mode]: historyResponse.messages || [],
      }));
    } catch (err) {
      setError(err as Error);
      console.error('Chat history fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * メッセージ送信
   */
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setSending(true);
      setError(null);

      // API呼び出し（E2Eモードは API層で処理）
      const form: ChatMessageForm = {
        content: content.trim(),
        mode: selectedMode,
      };

      const response = await aiAssistantService.sendMessage(form);

      // E2Eモード: responseに userMessage と assistantMessage が含まれる
      // 本番モード: responseに messageId, content, mode, timestamp が含まれる
      if ('userMessage' in response && 'assistantMessage' in response) {
        // E2Eモード: 両方のメッセージをstateに追加
        setMessagesByMode((prev) => ({
          ...prev,
          [selectedMode]: [
            ...prev[selectedMode],
            response.userMessage as ChatMessage,
            response.assistantMessage as ChatMessage,
          ],
        }));
      } else {
        // 本番モード: ユーザーメッセージ (楽観的UI) + AIメッセージ
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          userId: 'current-user', // TODO: 実際のuserIdを取得
          role: 'user',
          content: content.trim(),
          mode: selectedMode,
          createdAt: new Date(),
        };
        const assistantMessage: ChatMessage = {
          id: response.messageId || `ai-${Date.now()}`,
          userId: 'current-user', // TODO: 実際のuserIdを取得
          role: 'assistant',
          content: response.content,
          mode: selectedMode,
          createdAt: response.timestamp ? new Date(response.timestamp) : new Date(),
        };
        setMessagesByMode((prev) => ({
          ...prev,
          [selectedMode]: [...prev[selectedMode], userMessage, assistantMessage],
        }));
      }

      // スクロールを最下部に移動
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err as Error);
      console.error('Message send error:', err);
    } finally {
      setSending(false);
    }
  };

  /**
   * チャット履歴を最下部にスクロール
   */
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * モード変更ハンドラー
   */
  const handleModeChange = (mode: AIAssistantMode) => {
    setSelectedMode(mode);
    fetchChatHistory(mode);
  };

  /**
   * 初期データ取得
   */
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * チャット履歴が更新されたら最下部にスクロール
   */
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // chatEndRefをグローバルに設定（scrollToBottomで使用）
  useEffect(() => {
    const chatContainer = document.querySelector('.chat-history');
    if (chatContainer) {
      chatEndRef.current = chatContainer as HTMLDivElement;
    }
  }, []);

  return {
    selectedMode,
    modeOptions,
    chatHistory,
    loading,
    sending,
    error,
    setSelectedMode: handleModeChange,
    sendMessage,
    refetch: fetchData,
    scrollToBottom,
  };
};
