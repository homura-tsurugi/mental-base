// AIチャットダッシュボード
// 管理者/メンター向け: システム全体の統計とDify管理ショートカット

import { verifyMentor } from '@/lib/dal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  MessageCircle,
  Cpu,
  Database,
  Settings,
  FileText,
  BarChart3,
  Terminal,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

export default async function AIChatDashboardPage() {
  // メンターロール検証（DALパターン）
  const session = await verifyMentor();

  // モックデータ（将来的にAPIから取得）
  const stats = {
    totalUsers: 12,
    activeUsers: 10,
    totalConversations: 347,
    weeklyConversations: 28,
    totalMessages: 1542,
    avgMessagesPerConversation: 4.4,
    apiUsage: '245K',
    estimatedCost: '$8.50',
  };

  // Dify管理リンク
  const difyLinks = [
    {
      title: 'ナレッジベース',
      description: 'システムRAGとユーザーRAGの管理',
      icon: Database,
      url: 'https://cloud.dify.ai/datasets',
      color: 'text-blue-600',
    },
    {
      title: 'プロンプト編集',
      description: 'AIアシスタントのプロンプト設定',
      icon: FileText,
      url: 'https://cloud.dify.ai/app/9cea88a7-7aee-44ae-9635-5441faed3df2/configuration',
      color: 'text-purple-600',
    },
    {
      title: 'API管理',
      description: 'APIキーとエンドポイント設定',
      icon: Terminal,
      url: 'https://cloud.dify.ai/app/9cea88a7-7aee-44ae-9635-5441faed3df2/develop',
      color: 'text-green-600',
    },
    {
      title: 'ログ',
      description: '会話履歴と実行ログの確認',
      icon: MessageSquare,
      url: 'https://cloud.dify.ai/app/9cea88a7-7aee-44ae-9635-5441faed3df2/logs',
      color: 'text-orange-600',
    },
    {
      title: '統計',
      description: '使用状況とパフォーマンス分析',
      icon: BarChart3,
      url: 'https://cloud.dify.ai/app/9cea88a7-7aee-44ae-9635-5441faed3df2/overview',
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* ページヘッダー */}
      <header className="mb-8">
        <h1
          data-testid="page-title"
          className="text-[32px] font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          AIチャットダッシュボード
        </h1>
        <p
          data-testid="page-header-subtitle"
          className="text-base"
          style={{ color: 'var(--text-secondary)' }}
        >
          システム全体の統計と利用状況を確認できます
        </p>
      </header>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* 総ユーザー数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}人</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                アクティブ: {stats.activeUsers}人
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 総会話数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総会話数</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}件</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              今週: {stats.weeklyConversations}件
            </div>
          </CardContent>
        </Card>

        {/* 総メッセージ数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総メッセージ数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}件</div>
            <p className="text-xs text-muted-foreground mt-1">
              平均: {stats.avgMessagesPerConversation}メッセージ/会話
            </p>
          </CardContent>
        </Card>

        {/* Claude API使用量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claude API使用量</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.apiUsage}トークン</div>
            <p className="text-xs text-muted-foreground mt-1">
              推定コスト: {stats.estimatedCost}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dify管理セクション */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">Dify管理</h2>
          <p className="text-sm text-muted-foreground">
            AIアシスタントの設定とモニタリング
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {difyLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.title}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-8 w-8 ${link.color}`} />
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                  </div>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      管理画面へ
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 今後の機能拡張予定メモ */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>開発メモ:</strong> 統計データは現在モックデータです。
          将来的に `/lib/services/dify/ragSupabaseService.ts` の関数を使用して
          実データを取得します。
        </p>
      </div>
    </div>
  );
}
