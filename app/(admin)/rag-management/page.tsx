'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Database,
  Target,
  Lightbulb,
  TrendingUp,
  ListChecks,
} from 'lucide-react';

// モックデータ型定義
interface User {
  id: string;
  name: string;
  email: string;
  activeConversations: number;
  totalMessages: number;
}

interface ConversationSummary {
  topics: string[];
  problems: string[];
  advice: string[];
  insights: string[];
  next_steps: string[];
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  hasSummary: boolean;
  summary?: ConversationSummary;
}

// モックデータ
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'クライアント1',
    email: 'client1@rag-base.local',
    activeConversations: 5,
    totalMessages: 47,
  },
  {
    id: 'user2',
    name: 'クライアント2',
    email: 'client2@rag-base.local',
    activeConversations: 3,
    totalMessages: 28,
  },
  {
    id: 'user3',
    name: 'クライアント3',
    email: 'client3@rag-base.local',
    activeConversations: 8,
    totalMessages: 92,
  },
];

const mockConversationsMap: Record<string, Conversation[]> = {
  user1: [
    {
      id: 'session1',
      title: '目標設定についての相談',
      date: '2025-11-01',
      messageCount: 12,
      hasSummary: true,
      summary: {
        topics: ['キャリア目標', '3ヶ月計画', '時間管理'],
        problems: ['時間管理の課題', '優先順位付けの難しさ'],
        advice: [
          '毎日30分の学習時間を確保',
          'タスクを細分化して管理',
          'ポモドーロ・テクニックの活用',
        ],
        insights: [
          '短期目標の細分化が重要',
          '毎日の習慣化が成功の鍵',
        ],
        next_steps: [
          '学習計画の作成',
          '毎日のタスクリスト作成',
          '週次レビューの実施',
        ],
      },
    },
    {
      id: 'session2',
      title: 'コミュニケーション改善',
      date: '2025-10-28',
      messageCount: 8,
      hasSummary: true,
      summary: {
        topics: ['職場コミュニケーション', 'チームワーク'],
        problems: ['意見の伝え方', 'フィードバックへの対応'],
        advice: [
          'アサーティブなコミュニケーション',
          '積極的傾聴の実践',
        ],
        insights: ['相手の視点を理解することの重要性'],
        next_steps: ['コミュニケーション研修への参加'],
      },
    },
    {
      id: 'session3',
      title: 'ストレス管理について',
      date: '2025-10-25',
      messageCount: 15,
      hasSummary: false,
    },
  ],
  user2: [
    {
      id: 'session4',
      title: 'キャリアチェンジの相談',
      date: '2025-10-30',
      messageCount: 18,
      hasSummary: true,
      summary: {
        topics: ['転職', 'スキルアップ', '業界研究'],
        problems: ['現職への不満', 'スキル不足への不安'],
        advice: [
          '自己分析の実施',
          '転職エージェントへの相談',
          '必要なスキルの洗い出し',
        ],
        insights: ['自分の強みと弱みの理解が必要'],
        next_steps: ['職務経歴書の作成', 'スキルアップ計画の立案'],
      },
    },
    {
      id: 'session5',
      title: 'モチベーション維持',
      date: '2025-10-26',
      messageCount: 10,
      hasSummary: true,
      summary: {
        topics: ['モチベーション', '目標達成'],
        problems: ['やる気の低下', '継続の難しさ'],
        advice: ['小さな成功体験の積み重ね', 'ご褒美システムの導入'],
        insights: ['内発的動機付けの重要性'],
        next_steps: ['毎日の振り返りノート作成'],
      },
    },
  ],
  user3: [
    {
      id: 'session6',
      title: 'リーダーシップ開発',
      date: '2025-11-02',
      messageCount: 20,
      hasSummary: true,
      summary: {
        topics: ['リーダーシップ', 'チームマネジメント', '意思決定'],
        problems: [
          'メンバーとの関係構築',
          '難しい意思決定',
          '責任の重さ',
        ],
        advice: [
          '1on1ミーティングの実施',
          'フィードバックの習慣化',
          '意思決定のフレームワーク活用',
        ],
        insights: [
          'リーダーシップはスキルであり習得可能',
          'チームの信頼関係が最重要',
        ],
        next_steps: [
          'リーダーシップ研修への参加',
          '毎週のチームミーティング実施',
        ],
      },
    },
    {
      id: 'session7',
      title: 'ワークライフバランス',
      date: '2025-10-29',
      messageCount: 14,
      hasSummary: true,
      summary: {
        topics: ['ワークライフバランス', '時間管理', '健康管理'],
        problems: ['長時間労働', '家族との時間不足'],
        advice: [
          '業務の優先順位付け',
          '残業時間の削減計画',
          '家族との時間を固定スケジュールに',
        ],
        insights: ['健康が第一優先'],
        next_steps: ['業務効率化の実施', '定時退社日の設定'],
      },
    },
  ],
};

export default function RAGManagementPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isBuilding, setIsBuilding] = useState(false);

  const mockConversations = selectedUserId
    ? mockConversationsMap[selectedUserId] || []
    : [];

  const selectedConversation = mockConversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleBuildRAG = async (userId: string) => {
    // TODO: /lib/services/dify/difyDatasetService.tsのbuildUserRAG()を呼び出す
    setIsBuilding(true);
    console.log('RAG構築開始:', userId);

    // モック処理
    setTimeout(() => {
      setIsBuilding(false);
      alert(`ユーザー${userId}のRAG構築を開始しました（モック）`);
    }, 1500);
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">RAG管理</h1>
        <p className="text-muted-foreground mt-2">
          クライアントの会話履歴とRAGデータの管理
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* 左側: ユーザー一覧 */}
        <Card className="lg:h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              クライアント一覧
            </CardTitle>
            <CardDescription>
              {mockUsers.length}人のクライアント
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
            {mockUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUserId === user.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setSelectedConversationId(null);
                }}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {user.activeConversations}会話
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {user.totalMessages}メッセージ
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 右側: 会話履歴 */}
        {selectedUserId ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>会話履歴</CardTitle>
                  <CardDescription className="mt-1">
                    {mockConversations.length}件の会話
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleBuildRAG(selectedUserId)}
                  className="flex items-center gap-2"
                  disabled={isBuilding}
                >
                  <Database className="h-4 w-4" />
                  {isBuilding ? '構築中...' : 'RAG構築'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>会話タイトル</TableHead>
                      <TableHead>日付</TableHead>
                      <TableHead className="text-center">
                        メッセージ数
                      </TableHead>
                      <TableHead className="text-center">要約</TableHead>
                      <TableHead className="text-center">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockConversations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          会話履歴がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      mockConversations.map((conversation) => (
                        <TableRow key={conversation.id}>
                          <TableCell className="font-medium">
                            {conversation.title}
                          </TableCell>
                          <TableCell>{conversation.date}</TableCell>
                          <TableCell className="text-center">
                            {conversation.messageCount}
                          </TableCell>
                          <TableCell className="text-center">
                            {conversation.hasSummary ? (
                              <CheckCircle className="h-5 w-5 text-green-600 inline" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600 inline" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {conversation.hasSummary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedConversationId(conversation.id)
                                }
                              >
                                要約を見る
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-muted rounded-lg">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              クライアントを選択してください
            </p>
          </div>
        )}
      </div>

      {/* 要約モーダル */}
      <Dialog
        open={!!selectedConversationId}
        onOpenChange={() => setSelectedConversationId(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              会話要約
            </DialogTitle>
            <DialogDescription>
              {selectedConversation?.title} - {selectedConversation?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedConversation?.summary && (
            <div className="space-y-6">
              {/* 話題 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  話題
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedConversation.summary.topics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 問題・課題 */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  問題・課題
                </h3>
                <ul className="space-y-2">
                  {selectedConversation.summary.problems.map(
                    (problem, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground pl-4 border-l-2 border-amber-600"
                      >
                        {problem}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* アドバイス */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  アドバイス
                </h3>
                <ul className="space-y-2">
                  {selectedConversation.summary.advice.map((advice, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-green-600"
                    >
                      {advice}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 気づき */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  気づき
                </h3>
                <ul className="space-y-2">
                  {selectedConversation.summary.insights.map(
                    (insight, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground pl-4 border-l-2 border-yellow-600"
                      >
                        {insight}
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* 次のステップ */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-purple-600" />
                  次のステップ
                </h3>
                <ul className="space-y-2">
                  {selectedConversation.summary.next_steps.map((step, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground pl-4 border-l-2 border-purple-600"
                    >
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
