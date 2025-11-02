'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIAssistantMode, AIAssistantModeInfo } from '@/types';

/**
 * AIアシスタントページ (C-004)
 *
 * 4つのAIモードを提供：
 * - 課題解決モード
 * - 学習支援モード
 * - 計画立案モード
 * - 伴走補助モード
 */
const AIAssistantPage: React.FC = () => {
  const {
    selectedMode,
    modeOptions,
    chatHistory,
    loading,
    sending,
    error,
    setSelectedMode,
    sendMessage,
  } = useAIAssistant();

  const [inputValue, setInputValue] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  /**
   * チャット履歴を最下部にスクロール
   */
  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  /**
   * チャット履歴更新時に自動スクロール
   */
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  /**
   * メッセージ送信ハンドラー
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    const message = inputValue;
    setInputValue(''); // 入力欄をクリア

    await sendMessage(message);
  };

  /**
   * Enterキー押下時の送信
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * モード切り替えハンドラー
   */
  const handleModeChange = (mode: AIAssistantMode) => {
    setSelectedMode(mode);
  };

  /**
   * タイムスタンプをフォーマット
   */
  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  /**
   * モードをテストID用の短縮形に変換
   */
  const getModeTestId = (mode: AIAssistantMode): string => {
    const mapping: Record<AIAssistantMode, string> = {
      [AIAssistantMode.PROBLEM_SOLVING]: 'problem',
      [AIAssistantMode.LEARNING_SUPPORT]: 'learning',
      [AIAssistantMode.PLANNING]: 'planning',
      [AIAssistantMode.MENTORING]: 'companion',
    };
    return mapping[mode] || mode;
  };

  if (loading) {
    return (
      <MainLayout>
        <div data-testid="loading-state" className="flex items-center justify-center p-8">
          <div className="text-[var(--text-secondary)]">読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-4">
          <div data-testid="error-message" className="bg-red-50 text-red-600 p-4 rounded-lg">
            エラーが発生しました: {error.message}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Mode Selector */}
      <div data-testid="mode-selector" className="sticky top-[61px] bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 py-4 overflow-x-auto z-[90] scrollbar-hide">
        <div className="flex gap-2 min-w-min">
          {modeOptions.map((option) => (
            <button
              key={option.mode}
              data-testid={`mode-tab-${getModeTestId(option.mode)}`}
              data-active={selectedMode === option.mode}
              aria-selected={selectedMode === option.mode}
              onClick={() => handleModeChange(option.mode)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full border transition-all whitespace-nowrap flex-shrink-0 text-sm font-medium ${
                selectedMode === option.mode
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                  : 'bg-[var(--bg-primary)] border-[var(--border-dark)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <span className="material-icons text-[18px]">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat History Area */}
      <div
        data-testid="chat-history"
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[var(--bg-secondary)] chat-history"
        style={{ height: 'calc(100vh - 61px - 73px - 80px - 70px)' }}
      >
        {chatHistory.length === 0 ? (
          <div data-testid="empty-chat-message" className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
            <span className="material-icons text-6xl mb-4">chat</span>
            <p>メッセージを送信して会話を始めましょう</p>
          </div>
        ) : (
          chatHistory.map((message) => (
            <div
              key={message.id}
              data-testid={`chat-message-${message.role}`}
              className={`flex flex-col max-w-[75%] animate-fadeIn ${
                message.role === 'user'
                  ? 'self-end items-end'
                  : 'self-start items-start'
              }`}
            >
              <div
                className={`px-4 py-3 text-[15px] leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[var(--primary)] text-white rounded-2xl rounded-br-sm'
                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl rounded-bl-sm shadow-sm'
                }`}
                style={{
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </div>
              <div data-testid={`message-timestamp-${message.role}`} className="text-xs text-[var(--text-tertiary)] mt-1 px-1">
                {formatTimestamp(new Date(message.createdAt))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input Area */}
      <div data-testid="message-input-area" className="fixed bottom-[70px] left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-[var(--bg-primary)] px-4 py-4 border-t border-[var(--border-color)] flex gap-2 items-center shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-[50]">
        <input
          data-testid="message-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          placeholder="メッセージを入力..."
          className="flex-1 px-4 py-3 border border-[var(--border-color)] rounded-3xl text-[15px] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-disabled)]"
        />
        <button
          data-testid="send-button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || sending}
          className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center transition-all hover:bg-[var(--primary-light)] active:scale-95 disabled:bg-[var(--text-disabled)] disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? (
            <span data-testid="sending-spinner" className="material-icons animate-spin">refresh</span>
          ) : (
            <span className="material-icons">send</span>
          )}
        </button>
      </div>

      {/* アニメーション用CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
        }

        .chat-history::-webkit-scrollbar-thumb {
          background: var(--text-tertiary);
          border-radius: 3px;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </MainLayout>
  );
};

export default AIAssistantPage;
