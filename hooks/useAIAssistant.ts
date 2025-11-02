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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // チャット履歴の末尾へのスクロール用ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * ページデータ取得
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageData = await aiAssistantService.getPageData(selectedMode);
      setModeOptions(pageData.modeOptions);
      setChatHistory(pageData.chatHistory);
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
    try {
      setLoading(true);
      setError(null);
      const historyResponse = await aiAssistantService.getChatHistory(mode);
      setChatHistory(historyResponse.messages);
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

      const form: ChatMessageForm = {
        content: content.trim(),
        mode: selectedMode,
      };

      const response = await aiAssistantService.sendMessage(form);

      // チャット履歴を再取得（新しいメッセージを反映）
      await fetchChatHistory(selectedMode);

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
