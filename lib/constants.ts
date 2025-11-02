// ============================================================================
// Mental-Base Constants
// APIエンドポイント、定数値の一元管理
// ============================================================================

// ============================================================================
// API エンドポイント
// ============================================================================

export const API_PATHS = {
  // 認証API
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    PASSWORD_RESET: '/api/auth/password-reset',
    PASSWORD_RESET_CONFIRM: '/api/auth/password-reset/confirm',
  },

  // クライアントAPI（フェーズ1）
  DASHBOARD: '/api/dashboard',
  GOALS: '/api/goals',
  TASKS: '/api/tasks',
  LOGS: '/api/logs',
  REFLECTIONS: '/api/reflections',
  AI_ANALYSIS: '/api/analysis',
  CHAT: '/api/chat',
  USER_SETTINGS: '/api/user/settings',
  NOTIFICATIONS: '/api/notifications',

  // メンターAPI（フェーズ2）
  MENTOR: {
    // メンターダッシュボード
    DASHBOARD: '/api/mentor/dashboard',

    // メンター-クライアント関係管理
    RELATIONSHIPS: '/api/mentor/relationships',
    INVITE: '/api/mentor/invite',
    RELATIONSHIP_ACCEPT: (id: string) => `/api/mentor/relationships/${id}/accept`,
    RELATIONSHIP_TERMINATE: (id: string) => `/api/mentor/relationships/${id}/terminate`,

    // クライアントデータアクセス
    CLIENT_DETAIL: (clientId: string) => `/api/mentor/client/${clientId}`,
    CLIENT_GOALS: (clientId: string) => `/api/mentor/client/${clientId}/goals`,
    CLIENT_TASKS: (clientId: string) => `/api/mentor/client/${clientId}/tasks`,
    CLIENT_LOGS: (clientId: string) => `/api/mentor/client/${clientId}/logs`,
    CLIENT_REFLECTIONS: (clientId: string) => `/api/mentor/client/${clientId}/reflections`,
    CLIENT_AI_REPORTS: (clientId: string) => `/api/mentor/client/${clientId}/ai-reports`,

    // メンターノート
    NOTES: '/api/mentor/notes',
    NOTE_DETAIL: (noteId: string) => `/api/mentor/notes/${noteId}`,

    // 進捗レポート
    REPORTS: '/api/mentor/reports',
    REPORT_GENERATE: '/api/mentor/reports/generate',
    REPORT_DETAIL: (reportId: string) => `/api/mentor/reports/${reportId}`,
    REPORT_SHARE: (reportId: string) => `/api/mentor/reports/${reportId}/share`,
  },

  // クライアント側データアクセス制御
  CLIENT: {
    DATA_ACCESS: '/api/client/data-access',
    VIEW_LOGS: '/api/client/view-logs',
  },
} as const;

// ============================================================================
// アプリケーション定数
// ============================================================================

// ローカルストレージキー
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mentalbase_auth_token',
  USER_PREFERENCES: 'mentalbase_user_prefs',
  THEME: 'mentalbase_theme',
} as const;

// ページパス
export const PAGE_PATHS = {
  AUTH: '/auth',
  HOME: '/',
  PLAN_DO: '/plan-do',
  CHECK_ACTION: '/check-action',
  AI_ASSISTANT: '/ai-assistant',
  SETTINGS: '/settings',
  MENTOR_DASHBOARD: '/mentor',
  CLIENT_DETAIL: (clientId: string) => `/mentor/client/${clientId}`,
} as const;

// タイムアウト設定（ミリ秒）
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30秒
  AI_REQUEST: 60000, // 60秒（AI分析は時間がかかる可能性）
} as const;

// ページネーション
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// バリデーション制限
export const VALIDATION_LIMITS = {
  GOAL_TITLE_MAX: 200,
  TASK_TITLE_MAX: 200,
  LOG_CONTENT_MAX: 5000,
  CHAT_MESSAGE_MAX: 2000,
  MENTOR_BIO_MAX: 500,
  MENTOR_NOTE_TITLE_MAX: 200,
  MENTOR_NOTE_CONTENT_MAX: 5000,
  PROGRESS_REPORT_COMMENT_MAX: 5000,
} as const;

// メンター専門分野ラベル（UI表示用）
export const MENTOR_EXPERTISE_LABELS: Record<string, string> = {
  career: 'キャリア',
  mental_health: 'メンタルヘルス',
  learning: '学習',
  life_coaching: 'ライフコーチング',
  health_wellness: '健康・ウェルネス',
  entrepreneurship: '起業・ビジネス',
  other: 'その他',
} as const;

// クライアントステータス判定閾値（日数）
export const CLIENT_STATUS_THRESHOLDS = {
  ACTIVE_DAYS: 7, // 7日以内に活動があれば「アクティブ」
  STAGNANT_DAYS: 14, // 14日以上活動がなければ「停滞中」
  NEEDS_FOLLOWUP_DAYS: 21, // 21日以上活動がなければ「フォローアップ要」
} as const;

// 進捗率の閾値（パーセント）
export const PROGRESS_THRESHOLDS = {
  ON_TRACK: 70, // 70%以上で「順調」
  STAGNANT: 30, // 30%未満で「停滞中」
} as const;

// レート制限（将来的な実装用）
export const RATE_LIMITS = {
  AI_REQUESTS_PER_MINUTE: 5,
  API_REQUESTS_PER_MINUTE: 60,
} as const;
