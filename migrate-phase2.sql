-- フェーズ2: メンター機能のスキーマ追加
-- 実行日: 2025-11-02

-- Step 1: Userテーブルにメンター機能用カラム追加
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS "isMentor" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}';

-- Step 2: メンター-クライアント関係テーブル作成
CREATE TABLE IF NOT EXISTS mentor_client_relationships (
  id TEXT PRIMARY KEY,
  "mentorId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  "invitedBy" TEXT NOT NULL,
  "invitedAt" TIMESTAMP DEFAULT NOW(),
  "acceptedAt" TIMESTAMP,
  "terminatedAt" TIMESTAMP,
  "terminationReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("mentorId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE("mentorId", "clientId")
);

CREATE INDEX IF NOT EXISTS idx_mentor_client_relationships_mentorId ON mentor_client_relationships("mentorId");
CREATE INDEX IF NOT EXISTS idx_mentor_client_relationships_clientId ON mentor_client_relationships("clientId");
CREATE INDEX IF NOT EXISTS idx_mentor_client_relationships_status ON mentor_client_relationships(status);

-- Step 3: データアクセス権限テーブル作成
CREATE TABLE IF NOT EXISTS client_data_access_permissions (
  id TEXT PRIMARY KEY,
  "relationshipId" TEXT NOT NULL UNIQUE,
  "clientId" TEXT NOT NULL,
  "allowGoals" BOOLEAN DEFAULT false,
  "allowTasks" BOOLEAN DEFAULT false,
  "allowLogs" BOOLEAN DEFAULT false,
  "allowReflections" BOOLEAN DEFAULT false,
  "allowAiReports" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("relationshipId") REFERENCES mentor_client_relationships(id) ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_data_access_permissions_clientId ON client_data_access_permissions("clientId");
CREATE INDEX IF NOT EXISTS idx_client_data_access_permissions_isActive ON client_data_access_permissions("isActive");

-- Step 4: データ閲覧監査ログテーブル作成
CREATE TABLE IF NOT EXISTS client_data_view_logs (
  id TEXT PRIMARY KEY,
  "mentorId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "dataType" VARCHAR(50) NOT NULL,
  "dataId" TEXT NOT NULL,
  action VARCHAR(20) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("mentorId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_data_view_logs_mentorId ON client_data_view_logs("mentorId");
CREATE INDEX IF NOT EXISTS idx_client_data_view_logs_clientId ON client_data_view_logs("clientId");
CREATE INDEX IF NOT EXISTS idx_client_data_view_logs_dataType ON client_data_view_logs("dataType");
CREATE INDEX IF NOT EXISTS idx_client_data_view_logs_createdAt ON client_data_view_logs("createdAt");

-- Step 5: メンターノートテーブル作成
CREATE TABLE IF NOT EXISTS mentor_notes (
  id TEXT PRIMARY KEY,
  "mentorId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  "noteType" VARCHAR(20) DEFAULT 'general',
  "isPrivate" BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  "linkedDataType" VARCHAR(50),
  "linkedDataId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("mentorId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentorId ON mentor_notes("mentorId");
CREATE INDEX IF NOT EXISTS idx_mentor_notes_clientId ON mentor_notes("clientId");
CREATE INDEX IF NOT EXISTS idx_mentor_notes_noteType ON mentor_notes("noteType");
CREATE INDEX IF NOT EXISTS idx_mentor_notes_createdAt ON mentor_notes("createdAt");

-- Step 6: クライアント進捗レポートテーブル作成
CREATE TABLE IF NOT EXISTS client_progress_reports (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "reportPeriod" VARCHAR(20) NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "overallProgress" DOUBLE PRECISION NOT NULL,
  "completedGoals" INTEGER DEFAULT 0,
  "completedTasks" INTEGER DEFAULT 0,
  "logCount" INTEGER DEFAULT 0,
  "reflectionCount" INTEGER DEFAULT 0,
  "mentorComments" TEXT,
  "mentorRating" INTEGER,
  "areasOfImprovement" TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  "nextSteps" TEXT,
  "followUpDate" TIMESTAMP,
  "isSharedWithClient" BOOLEAN DEFAULT false,
  "sharedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("clientId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("mentorId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_progress_reports_clientId ON client_progress_reports("clientId");
CREATE INDEX IF NOT EXISTS idx_client_progress_reports_mentorId ON client_progress_reports("mentorId");
CREATE INDEX IF NOT EXISTS idx_client_progress_reports_reportPeriod ON client_progress_reports("reportPeriod");
CREATE INDEX IF NOT EXISTS idx_client_progress_reports_createdAt ON client_progress_reports("createdAt");

-- 完了
SELECT 'フェーズ2マイグレーション完了' AS status;
