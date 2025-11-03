// ============================================================================
// Mental-Base Type Definitions
// バックエンド（FastAPI）と完全同期
// ============================================================================

// ============================================================================
// フェーズ2: メンター機能関連型定義（先行定義）
// ============================================================================

// ユーザーロール（フェーズ2で追加）
export type UserRole = 'client' | 'mentor' | 'admin';

// メンター専門分野（C-005: 設定）
export type MentorExpertise =
  | 'career'
  | 'mental_health'
  | 'learning'
  | 'life_coaching'
  | 'health_wellness'
  | 'entrepreneurship'
  | 'other';

// ============================================================================
// ユーザー関連
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  // フェーズ2: メンター機能拡張
  role: UserRole; // CLIENT/MENTOR/ADMIN
  isMentor: boolean; // メンターかどうか
  bio?: string; // 自己紹介
  expertise: MentorExpertise[]; // 専門分野
}

// ユーザー表示用（計算プロパティを含む）
export interface UserDisplay extends User {
  initials: string; // nameから計算（例: "Tanaka Sato" → "TS"）
  avatarUrl?: string; // 将来的にプロフィール画像対応時に使用
}

export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  reminderTime?: string; // HH:mm形式
  theme: 'professional' | 'warm' | 'modern' | 'calm';
  updatedAt: Date;
}

// 認証関連
export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expires: Date;
  createdAt: Date;
}

// ============================================================================
// 認証ページ（P-001）関連型定義
// ============================================================================

// ログイン入力
export interface LoginCredentials {
  email: string;
  password: string;
}

// 新規登録入力
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// パスワードリセットリクエスト
export interface PasswordResetRequest {
  email: string;
}

// 新しいパスワード設定
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// 認証レスポンス
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  sessionToken?: string;
  redirectUrl?: string;
  error?: string;
}

// セッション情報（Auth.js用）
export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
  expires: string; // ISO 8601形式
}

// 認証ビュー種別（AuthPage.htmlの画面切り替え用）
export type AuthViewType = 'login' | 'register' | 'password-reset' | 'password-reset-success' | 'new-password';

// 認証フォームバリデーションエラー
export interface AuthValidationError {
  field: 'email' | 'password' | 'name' | 'confirmPassword';
  message: string;
}

// 認証状態
export type AuthStatus = 'unauthenticated' | 'authenticated' | 'loading' | 'error';

// パスワード要件（バリデーション用）
export interface PasswordRequirements {
  minLength: number; // 最小文字数（デフォルト: 8）
  requireNumbers?: boolean; // 数字を含む必要があるか
  requireLetters?: boolean; // 英字を含む必要があるか
  requireSpecialChars?: boolean; // 特殊文字を含む必要があるか
}

// 認証ページ用定数
export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PLACEHOLDER: '8文字以上',
  PASSWORD_REGISTER_PLACEHOLDER: '8文字以上、英数字混在推奨',
  EMAIL_PLACEHOLDER: 'example@email.com',
  NAME_PLACEHOLDER: '山田 太郎',
  RESET_TOKEN_EXPIRY_HOURS: 1, // パスワードリセットトークンの有効期限
} as const;

// 目標・タスク関連
export type GoalStatus = 'active' | 'completed' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';

// 目標ステータス表示情報（M-002で使用）
export interface GoalStatusDisplay {
  value: GoalStatus;
  label: string; // 日本語ラベル（例: "進行中", "完了"）
  badgeColor: string; // バッジ背景色
  textColor: string; // バッジテキスト色
}

// 目標ステータス表示マッピング定数
export const GOAL_STATUS_DISPLAY_MAP: Record<GoalStatus, GoalStatusDisplay> = {
  active: { value: 'active', label: '進行中', badgeColor: 'rgba(66, 153, 225, 0.1)', textColor: '#4299e1' },
  completed: { value: 'completed', label: '完了', badgeColor: 'rgba(72, 187, 120, 0.1)', textColor: '#48bb78' },
  archived: { value: 'archived', label: 'アーカイブ', badgeColor: 'rgba(113, 128, 150, 0.1)', textColor: '#718096' },
};

// タスクステータス表示情報（M-002で使用）
export interface TaskStatusDisplay {
  value: TaskStatus;
  label: string; // 日本語ラベル（例: "未着手", "進行中", "完了"）
  badgeColor: string; // バッジ背景色
  textColor: string; // バッジテキスト色
}

// タスクステータス表示マッピング定数
export const TASK_STATUS_DISPLAY_MAP: Record<TaskStatus, TaskStatusDisplay> = {
  pending: { value: 'pending', label: '未着手', badgeColor: 'rgba(113, 128, 150, 0.1)', textColor: '#718096' },
  in_progress: { value: 'in_progress', label: '進行中', badgeColor: 'rgba(66, 153, 225, 0.1)', textColor: '#4299e1' },
  completed: { value: 'completed', label: '完了', badgeColor: 'rgba(72, 187, 120, 0.1)', textColor: '#48bb78' },
};

// タスク優先度表示情報（M-002で使用）
export interface TaskPriorityDisplay {
  value: TaskPriority;
  label: string; // 日本語ラベル（例: "高", "中", "低"）
  color: string; // バーの色
}

// タスク優先度表示マッピング定数
export const TASK_PRIORITY_DISPLAY_MAP: Record<TaskPriority, TaskPriorityDisplay> = {
  high: { value: 'high', label: '高', color: '#e53e3e' },
  medium: { value: 'medium', label: '中', color: '#ecc94b' },
  low: { value: 'low', label: '低', color: '#4299e1' },
};

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  scheduledTime?: string; // HH:mm形式 (e.g., "09:00", "17:00")
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// タスク表示用の拡張型（goalNameなど計算プロパティを含む）
export interface TaskWithGoal extends Task {
  goalName?: string; // Goalのtitleから取得
}

// 目標表示用の拡張型（進捗率など計算プロパティを含む）
export interface GoalWithProgress extends Goal {
  completedTasks: number; // 完了タスク数
  totalTasks: number; // 総タスク数
  progressPercentage: number; // 進捗率（0-100）
}

// ログ・振り返り関連
export type LogType = 'daily' | 'reflection' | 'insight';
export type Emotion = 'happy' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'tired';
export type State = 'energetic' | 'tired' | 'focused' | 'distracted' | 'calm' | 'stressed';

// 感情アイコンマッピング（表示用）
export interface EmotionDisplay {
  value: Emotion;
  icon: string; // Material Icons name
  label: string; // 日本語ラベル（例: "満足", "普通", "やや不満"）
  color?: string; // 色コード（任意）
}

// 状態ラベルマッピング（表示用）
export interface StateDisplay {
  value: State;
  label: string; // 日本語ラベル（例: "エネルギッシュ", "集中力高い"）
}

// 感情表示マッピング定数（M-002: クライアント詳細で使用）
export const EMOTION_DISPLAY_MAP: Record<Emotion, EmotionDisplay> = {
  happy: { value: 'happy', icon: 'sentiment_satisfied', label: '満足', color: '#48bb78' },
  neutral: { value: 'neutral', icon: 'sentiment_neutral', label: '普通', color: '#718096' },
  sad: { value: 'sad', icon: 'sentiment_dissatisfied', label: 'やや不満', color: '#e53e3e' },
  anxious: { value: 'anxious', icon: 'sentiment_very_dissatisfied', label: '不安', color: '#e53e3e' },
  excited: { value: 'excited', icon: 'sentiment_very_satisfied', label: 'とても満足', color: '#48bb78' },
  tired: { value: 'tired', icon: 'sentiment_dissatisfied', label: '疲れた', color: '#ecc94b' },
};

export interface Log {
  id: string;
  userId: string;
  taskId?: string;
  content: string;
  emotion?: Emotion;
  state?: State;
  type: LogType;
  createdAt: Date;
}

export type ReflectionPeriod = 'daily' | 'weekly' | 'monthly';

export interface Reflection {
  id: string;
  userId: string;
  period: ReflectionPeriod;
  startDate: Date;
  endDate: Date;
  content: string;
  achievements?: string;
  challenges?: string;
  createdAt: Date;
}

// AI関連
export type AnalysisType = 'progress' | 'pattern' | 'recommendation';

export interface AIAnalysisReport {
  id: string;
  userId: string;
  reflectionId?: string;
  analysisType: AnalysisType;
  insights: Record<string, any>;
  recommendations: Record<string, any>;
  confidence: number; // 0-1
  createdAt: Date;
}

export type ActionPlanStatus = 'planned' | 'in_progress' | 'completed';

export interface ActionPlan {
  id: string;
  userId: string;
  reportId?: string;
  title: string;
  description: string;
  actionItems: string[];
  status: ActionPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatRole = 'user' | 'assistant';

// AIアシスタントモード（C-004: AIアシスタント）
export enum AIAssistantMode {
  PROBLEM_SOLVING = 'problem_solving', // 課題解決モード
  LEARNING_SUPPORT = 'learning_support', // 学習支援モード
  PLANNING = 'planning', // 計画立案モード
  MENTORING = 'mentoring', // 伴走補助モード
}

// AIアシスタントモード情報（UI表示用）
export interface AIAssistantModeInfo {
  mode: AIAssistantMode;
  label: string; // 表示名（例: "課題解決モード"）
  description: string; // 説明文
  icon: string; // Material Icons name
  welcomeMessage: string; // 初回メッセージ
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  mode: AIAssistantMode; // 必須: どのモードで送信されたメッセージか
  context?: Record<string, any>;
  createdAt: Date;
}

// ダッシュボード関連
export interface CompassProgress {
  planProgress: number; // 0-100
  doProgress: number; // 0-100
  checkProgress: number; // 0-100
  actionProgress: number; // 0-100
}

export interface CompassCard {
  phase: 'plan' | 'do' | 'check' | 'action';
  label: string; // "PLAN", "DO", "Check", "Action"
  sublabel: string; // "計画", "実行", "振り返り", "改善"
  progress: number; // 0-100
  color: string; // HEX color code
}

export type ActivityType =
  | 'goal_created'
  | 'task_completed'
  | 'task_created'
  | 'log_recorded'
  | 'reflection_created'
  | 'improvement_suggested';

export type ActivityIcon =
  | 'check_circle'
  | 'assignment'
  | 'edit'
  | 'lightbulb'
  | 'flag'
  | 'insights';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  icon?: ActivityIcon;
  iconColor?: string;
  backgroundColor?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'achievement' | 'suggestion';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface DashboardData {
  compassSummary: CompassProgress;
  todayTasks: TaskWithGoal[];
  recentActivities: Activity[];
  notifications: Notification[];
}

// ナビゲーション関連
export interface NavigationItem {
  id: string;
  label: string;
  icon: string; // Material Icons name
  href: string;
  active: boolean;
}

// API レスポンス型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  detail?: Record<string, any>;
}

// フォーム関連（認証以外）
// 注: 認証関連フォームは「認証ページ（P-001）関連型定義」セクションを参照

export interface GoalForm {
  title: string;
  description?: string;
  deadline?: Date;
}

export interface TaskForm {
  title: string;
  description?: string;
  dueDate?: Date;
  scheduledTime?: string; // HH:mm形式
  priority: TaskPriority;
  goalId?: string;
}

export interface LogForm {
  content: string;
  emotion?: Emotion;
  state?: State;
  taskId?: string;
}

export interface ReflectionForm {
  period: ReflectionPeriod;
  startDate: Date;
  endDate: Date;
  content: string;
  achievements?: string;
  challenges?: string;
}

// Settings ページ関連型定義
export interface ProfileUpdateForm {
  name: string;
  email: string;
}

export interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettingsForm {
  emailNotifications: boolean;
  reminderTime?: string; // HH:mm形式
}

export interface AccountDeletionRequest {
  userId: string;
  confirmationText?: string; // 「削除する」等の確認テキスト
}

// Check/Action ページ関連型定義
export type PeriodType = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';

export interface PeriodOption {
  label: string; // 表示名（例: "今週", "先週"）
  value: PeriodType;
  startDate: Date;
  endDate: Date;
}

export interface ProgressStats {
  achievementRate: number; // 達成率（パーセント、0-100）
  completedTasks: number; // 完了タスク数
  logDays: number; // ログ記録日数
  activeGoals: number; // 進行中の目標数
}

export interface ChartDataPoint {
  date: string; // YYYY-MM-DD形式
  value: number; // その日の値（完了タスク数等）
  label?: string; // チャート上のラベル（例: "月", "火"）
}

export interface ChartData {
  title: string; // グラフタイトル
  dataPoints: ChartDataPoint[];
  type: 'line' | 'bar' | 'area'; // グラフの種類
  yAxisLabel?: string; // Y軸ラベル
  xAxisLabel?: string; // X軸ラベル
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'progress' | 'challenge'; // 洞察のタイプ
  title: string; // 洞察のタイトル（例: "パターン発見"）
  description: string; // 洞察の詳細
  importance: 'high' | 'medium' | 'low'; // 重要度
}

export interface AIRecommendation {
  id: string;
  priority: number; // 優先順位（1が最高）
  title: string; // 推奨事項のタイトル
  description: string; // 推奨事項の詳細
  actionable: boolean; // 実行可能かどうか
  category?: 'time_optimization' | 'habit_improvement' | 'success_pattern' | 'other'; // 推奨カテゴリー
}

export interface AIAnalysisReportDetailed extends Omit<AIAnalysisReport, 'insights' | 'recommendations'> {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  summary?: string; // 分析サマリー
  confidencePercentage: number; // 信頼度（パーセント表示用、0-100）
}

export interface ActionItem {
  id: string;
  order: number; // 実行順序
  description: string; // アクション内容
  completed: boolean; // 完了フラグ
  dueDate?: Date; // 期限（任意）
}

export interface ActionPlanForm {
  title: string;
  description: string;
  actionItems: string[]; // 作成時は文字列配列
  reportId?: string; // 参照するAI分析レポートID
}

export interface ActionPlanDetailed extends Omit<ActionPlan, 'actionItems'> {
  actionItems: ActionItem[]; // 詳細なActionItem配列に変換
  progress: number; // 進捗率（パーセント、0-100）
  completedItems: number; // 完了アイテム数
  totalItems: number; // 総アイテム数
}

// Check/Action ページ全体のデータ型
export interface CheckActionPageData {
  period: PeriodOption;
  stats: ProgressStats;
  chartData: ChartData;
  reflections: Reflection[];
  latestReport?: AIAnalysisReportDetailed;
  actionPlans: ActionPlanDetailed[];
}

// Plan/Do ページ関連型定義
export type TabType = 'plan' | 'do';

export interface EmotionOption {
  value: Emotion; // 'happy' | 'neutral' | 'sad' | 'anxious'
  emoji: string; // 絵文字（例: "😊", "😐", "😢", "😰"）
  label: string; // ラベル（例: "嬉しい", "普通", "悲しい", "不安"）
}

export interface PlanDoPageData {
  activeTab: TabType; // 現在のタブ（'plan' または 'do'）
  goals: GoalWithProgress[]; // 目標一覧（進捗率付き）
  todayTasks: TaskWithGoal[]; // 今日のタスク一覧
  emotionOptions: EmotionOption[]; // 感情選択肢
}

// AIアシスタント関連型定義（C-004: AIアシスタント）
export interface ChatMessageForm {
  content: string;
  mode: AIAssistantMode;
}

export interface ChatContext {
  userId: string;
  mode: AIAssistantMode;
  recentGoals?: Goal[]; // 最新の目標（最大5件）
  recentTasks?: Task[]; // 最新のタスク（最大10件）
  recentLogs?: Log[]; // 最新のログ（最大10件）
  recentReflections?: Reflection[]; // 最新の振り返り（最大5件）
}

// Production API response (only assistant message)
export interface AIChatResponseProduction {
  messageId: string;
  content: string;
  mode: AIAssistantMode;
  timestamp: string;
}

// E2E test mock response (both user and assistant messages)
export interface AIChatResponseE2E {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// Union type for both response formats
export type AIChatResponse = AIChatResponseProduction | AIChatResponseE2E;

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  hasMore: boolean; // さらに過去のメッセージがあるか
  nextCursor?: string; // ページネーション用カーソル
}

export interface AIAssistantPageData {
  selectedMode: AIAssistantMode; // 現在選択されているモード
  modeOptions: AIAssistantModeInfo[]; // 利用可能なモード一覧
  chatHistory: ChatMessage[]; // チャット履歴
  isLoading: boolean; // AI応答待機中かどうか
}

// ============================================================================
// メンター機能関連型定義（フェーズ2）
// ============================================================================

// メンター-クライアント関係のステータス
export type MentorClientRelationshipStatus = 'pending' | 'active' | 'terminated';

// クライアントステータス（M-001: メンターダッシュボード）
export type ClientStatus = 'on_track' | 'stagnant' | 'needs_followup';

// ソート順（M-001: メンターダッシュボード）
export type ClientSortOrder = 'progress' | 'last_activity' | 'name';

// フィルター種別（M-001: メンターダッシュボード）
export type ClientFilterType = 'all' | 'on_track' | 'stagnant' | 'needs_followup';

// 統計サマリー（M-001: メンターダッシュボード）
export interface DashboardStatistics {
  totalClients: number; // 担当クライアント総数
  activeClients: number; // アクティブクライアント（今週活動あり）
  needsFollowUp: number; // 要フォロークライアント
  averageProgress: number; // 平均進捗率（0-100）
}

// クライアント一覧の各アイテム（M-001: メンターダッシュボード）
export interface ClientSummary {
  id: string; // クライアントID
  name: string; // 名前
  email: string; // メールアドレス
  avatarUrl?: string; // アバター画像URL（任意）
  initials: string; // イニシャル（例: "田中太郎" → "田"）
  overallProgress: number; // 総合進捗率（0-100）
  lastActivityDate: Date; // 最終活動日時
  lastActivityLabel: string; // 最終活動ラベル（例: "今日", "2日前", "10日前"）
  status: ClientStatus; // ステータス（on_track/stagnant/needs_followup）
  relationshipId: string; // MentorClientRelationshipのID
}

// メンターダッシュボード全体のデータ（M-001: メンターダッシュボード）
export interface MentorDashboardData {
  statistics: DashboardStatistics; // 統計サマリー
  clients: ClientSummary[]; // クライアント一覧
}

// メンターノートタイプ（M-002: クライアント詳細）
export type MentorNoteType = 'general' | 'observation' | 'concern' | 'achievement';

// ノートタイプ表示情報（M-002: クライアント詳細）
export interface NoteTypeDisplay {
  value: MentorNoteType;
  label: string; // 日本語ラベル（例: "一般", "観察"）
  badgeColor: string; // バッジ背景色
  textColor: string; // バッジテキスト色
}

// ノートタイプ表示マッピング定数
export const NOTE_TYPE_DISPLAY_MAP: Record<MentorNoteType, NoteTypeDisplay> = {
  general: { value: 'general', label: '一般', badgeColor: 'rgba(113, 128, 150, 0.1)', textColor: '#718096' },
  observation: { value: 'observation', label: '観察', badgeColor: 'rgba(66, 153, 225, 0.1)', textColor: '#4299e1' },
  concern: { value: 'concern', label: '懸念事項', badgeColor: 'rgba(236, 201, 75, 0.1)', textColor: '#ecc94b' },
  achievement: { value: 'achievement', label: '成果', badgeColor: 'rgba(72, 187, 120, 0.1)', textColor: '#48bb78' },
};

// クライアントステータス表示情報（M-001, M-002で使用）
export interface ClientStatusDisplay {
  value: ClientStatus;
  label: string; // 日本語ラベル（例: "順調", "停滞中"）
  icon: string; // Material Icons name
  badgeColor: string; // バッジ背景色
  textColor: string; // バッジテキスト色
}

// クライアントステータス表示マッピング定数
export const CLIENT_STATUS_DISPLAY_MAP: Record<ClientStatus, ClientStatusDisplay> = {
  on_track: { value: 'on_track', label: '順調', icon: 'check_circle', badgeColor: 'rgba(72, 187, 120, 0.1)', textColor: '#48bb78' },
  stagnant: { value: 'stagnant', label: '停滞中', icon: 'warning', badgeColor: 'rgba(236, 201, 75, 0.1)', textColor: '#ecc94b' },
  needs_followup: { value: 'needs_followup', label: 'フォローアップ要', icon: 'error', badgeColor: 'rgba(229, 62, 62, 0.1)', textColor: '#e53e3e' },
};

// 進捗レポート期間（M-002: クライアント詳細）
export type ReportPeriodType = 'weekly' | 'monthly';

// データアクセス許可（M-002: クライアント詳細、C-005: 設定）
export interface ClientDataAccessPermission {
  id: string;
  relationshipId: string;
  clientId: string;
  allowGoals: boolean; // 目標閲覧許可
  allowTasks: boolean; // タスク閲覧許可
  allowLogs: boolean; // ログ閲覧許可
  allowReflections: boolean; // 振り返り閲覧許可
  allowAiReports: boolean; // AI分析レポート閲覧許可
  isActive: boolean; // 許可が有効かどうか
  createdAt: Date;
  updatedAt: Date;
}

// メンター-クライアント関係（M-002: クライアント詳細）
export interface MentorClientRelationship {
  id: string;
  mentorId: string; // メンターのユーザーID
  clientId: string; // クライアントのユーザーID
  status: MentorClientRelationshipStatus; // pending/active/terminated
  invitedBy: string; // 招待者のユーザーID
  invitedAt: Date; // 招待日時
  acceptedAt?: Date; // 承認日時（任意）
  terminatedAt?: Date; // 終了日時（任意）
  createdAt: Date;
  updatedAt: Date;
}

// メンターノート（M-002: クライアント詳細）
export interface MentorNote {
  id: string;
  mentorId: string; // メンターのユーザーID
  clientId: string; // クライアントのユーザーID
  title: string; // タイトル
  content: string; // 内容
  noteType: MentorNoteType; // ノートタイプ
  isSharedWithClient: boolean; // クライアントと共有するか（true: 公開、false: 非公開）
  tags: string[]; // タグ（複数可）
  linkedDataType?: 'goal' | 'task' | 'log' | 'reflection'; // リンクするデータタイプ（任意）
  linkedDataId?: string; // リンクするデータのID（任意）
  createdAt: Date;
  updatedAt: Date;
}

// メンターノート作成フォーム（M-002: クライアント詳細）
export interface MentorNoteForm {
  title: string;
  content: string;
  noteType: MentorNoteType;
  isSharedWithClient: boolean; // クライアントと共有するか（true: 公開、false: 非公開）
  tags: string[];
  linkedDataType?: 'goal' | 'task' | 'log' | 'reflection';
  linkedDataId?: string;
}

// クライアント進捗レポート（M-002: クライアント詳細）
export interface ClientProgressReport {
  id: string;
  clientId: string; // クライアントのユーザーID
  mentorId: string; // メンターのユーザーID
  reportPeriod: ReportPeriodType; // weekly/monthly
  startDate: Date; // 期間開始日
  endDate: Date; // 期間終了日
  overallProgress: number; // 総合進捗率（0-100）
  completedGoals: number; // 完了した目標数
  completedTasks: number; // 完了したタスク数
  logCount: number; // ログ記録数
  reflectionCount: number; // 振り返り記録数
  mentorComments?: string; // メンターコメント（任意）
  mentorRating?: number; // 評価（1-5段階、任意）
  areasOfImprovement: string[]; // 改善が必要な領域
  strengths: string[]; // 強みとして認識された領域
  nextSteps?: string; // 次のアクション（任意）
  followUpDate?: Date; // フォローアップ予定日（任意）
  isSharedWithClient: boolean; // クライアントと共有
  sharedAt?: Date; // 共有日時（任意）
  createdAt: Date;
  updatedAt: Date;
}

// 進捗レポート生成フォーム（M-002: クライアント詳細）
export interface ClientProgressReportForm {
  reportPeriod: ReportPeriodType;
  startDate: Date;
  endDate: Date;
  mentorComments?: string;
  mentorRating?: number;
  areasOfImprovement: string[];
  strengths: string[];
  nextSteps?: string;
  followUpDate?: Date;
  isSharedWithClient: boolean;
}

// クライアント詳細情報（M-002: クライアント詳細）
export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string; // イニシャル（例: "田中太郎" → "田"）
  registeredAt: Date;
  relationshipStartDate: Date;
  overallProgress: number; // 総合進捗率（0-100）
  status: ClientStatus; // クライアントステータス（on_track/stagnant/needs_followup）
}

// クライアント詳細タブタイプ（M-002: クライアント詳細）
export type ClientDetailTabType = 'goals' | 'tasks' | 'logs' | 'reflections' | 'ai-reports' | 'notes';

// タブ情報（M-002: クライアント詳細）
export interface ClientDetailTab {
  id: ClientDetailTabType;
  label: string; // タブ表示名（例: "目標一覧", "タスク一覧"）
  requiresPermission: boolean; // アクセス権限が必要かどうか
  permissionKey?: keyof Pick<ClientDataAccessPermission, 'allowGoals' | 'allowTasks' | 'allowLogs' | 'allowReflections' | 'allowAiReports'>; // 必要な権限キー
}

// クライアント詳細タブ定義（M-002: クライアント詳細）
export const CLIENT_DETAIL_TABS: ClientDetailTab[] = [
  { id: 'goals', label: '目標一覧', requiresPermission: true, permissionKey: 'allowGoals' },
  { id: 'tasks', label: 'タスク一覧', requiresPermission: true, permissionKey: 'allowTasks' },
  { id: 'logs', label: 'ログ履歴', requiresPermission: true, permissionKey: 'allowLogs' },
  { id: 'reflections', label: '振り返り', requiresPermission: true, permissionKey: 'allowReflections' },
  { id: 'ai-reports', label: 'AI分析レポート', requiresPermission: true, permissionKey: 'allowAiReports' },
  { id: 'notes', label: 'メンターノート', requiresPermission: false },
];

// クライアント詳細ページのデータ（M-002: クライアント詳細）
export interface ClientDetailData {
  clientInfo: ClientInfo; // クライアント基本情報
  permissions: ClientDataAccessPermission; // アクセス権限
  progressData: {
    overallProgress: number; // 総合進捗率
    goals: GoalWithProgress[]; // 目標一覧（許可されている場合のみ）
    tasks: TaskWithGoal[]; // タスク一覧（許可されている場合のみ）
    logs: Log[]; // ログ履歴（許可されている場合のみ）
    reflections: Reflection[]; // 振り返り（許可されている場合のみ）
    aiReports: AIAnalysisReportDetailed[]; // AI分析レポート（許可されている場合のみ）
  };
  mentorNotes: MentorNote[]; // メンターノート一覧
}

// データ閲覧監査ログ（セキュリティ・GDPR対応）
export interface ClientDataViewLog {
  id: string;
  mentorId: string; // メンターのユーザーID
  clientId: string; // クライアントのユーザーID
  dataType: 'goal' | 'task' | 'log' | 'reflection' | 'ai_report'; // データタイプ
  dataId: string; // データのID
  action: 'view' | 'export'; // アクション
  createdAt: Date;
}

// メンター登録フォーム（C-005: 設定）
export interface MentorRegistrationForm {
  isMentor: boolean;
  bio?: string; // 自己紹介（500文字以内）
  expertise: MentorExpertise[]; // 専門分野（複数選択可）
}

// データアクセス許可設定フォーム（C-005: 設定）
export interface DataAccessPermissionForm {
  allowGoals: boolean;
  allowTasks: boolean;
  allowLogs: boolean;
  allowReflections: boolean;
  allowAiReports: boolean;
}

// ============================================================================
// Rag-Base統合用型定義（Dify統合）
// ============================================================================

// メッセージロール（Rag-Base用）
export type MessageRole = 'user' | 'assistant';

// 引用元情報（RAG検索結果）
export interface Citation {
  source: string; // ドキュメント名
  content: string; // 引用テキスト
  dataset_type: 'system' | 'user'; // システムRAG or ユーザーRAG
  chunk_number?: number; // チャンク番号
  similarity_score?: number; // 類似度スコア 0-1
}

// 会話情報（Rag-Base用）
export interface Conversation {
  session_id: string; // UUID
  user_id: string;
  title?: string;
  created_at: string; // ISO 8601
  updated_at?: string; // ISO 8601
  message_count?: number;
  crisis_flag?: boolean; // 危機フラグ
}

// メッセージ情報（Rag-Base用）
export interface Message {
  message_id: string; // UUID
  session_id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[]; // 引用元情報
  created_at: string; // ISO 8601
  tokens_used?: number;
  crisis_detected?: boolean; // 危機キーワード検出フラグ
}

// チャットメッセージ送信リクエスト
export interface ChatMessageRequest {
  session_id?: string; // 新規会話の場合は省略
  content: string;
  user_id?: string; // ユーザーID
}

// チャットメッセージレスポンス
export interface ChatMessageResponse {
  message: Message;
  session_id: string;
}

// 会話要約情報
export interface ConversationSummary {
  summary_id: string; // UUID
  session_id: string;
  user_id: string;
  topics: string[]; // 主なトピック
  problems: string[]; // 問題・課題
  advice: string[]; // 提供したアドバイス
  insights: string[]; // クライアントの気づき
  next_steps: string[]; // 次のステップ
  mentor_notes?: string; // メンターメモ（任意）
  crisis_flags?: string[]; // 危機フラグ（検出されたキーワード等）
  created_at: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

// 会話要約生成リクエスト
export interface GenerateSummaryRequest {
  session_id: string;
  user_id: string;
  messages: Message[];
}

// 会話要約生成レスポンス
export interface GenerateSummaryResponse {
  summary: ConversationSummary;
  success: boolean;
  message?: string;
}
