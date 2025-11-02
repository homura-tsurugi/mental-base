// Mock Service for Client Detail Page (M-002)
// すべての関数に @MOCK_TO_API マークが付いています
// 実際のAPI実装時にこのマークを検索して置き換えてください

import {
  ClientDetailData,
  ClientInfo,
  ClientDataAccessPermission,
  GoalWithProgress,
  TaskWithGoal,
  Log,
  Reflection,
  AIAnalysisReportDetailed,
  MentorNote,
  MentorNoteForm,
  ClientProgressReport,
  ClientProgressReportForm,
} from '@/types';

// @MOCK_TO_API
// クライアント詳細情報を取得
export async function getClientDetail(
  clientId: string
): Promise<ClientDetailData> {
  // モックデータ
  return {
    clientInfo: {
      id: clientId,
      name: '田中太郎',
      email: 'tanaka@example.com',
      initials: '田',
      registeredAt: new Date('2025-01-15'),
      relationshipStartDate: new Date('2025-01-20'),
      overallProgress: 85,
      status: 'on_track',
    },
    permissions: {
      id: 'perm-1',
      relationshipId: 'rel-1',
      clientId: clientId,
      allowGoals: true,
      allowTasks: true,
      allowLogs: true,
      allowReflections: true,
      allowAiReports: true,
      isActive: true,
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
    },
    progressData: {
      overallProgress: 85,
      goals: [],
      tasks: [],
      logs: [],
      reflections: [],
      aiReports: [],
    },
    mentorNotes: [],
  };
}

// @MOCK_TO_API
// クライアントの基本情報を取得
export async function getClientInfo(clientId: string): Promise<ClientInfo> {
  return {
    id: clientId,
    name: '田中太郎',
    email: 'tanaka@example.com',
    initials: '田',
    registeredAt: new Date('2025-01-15'),
    relationshipStartDate: new Date('2025-01-20'),
    overallProgress: 85,
    status: 'on_track',
  };
}

// @MOCK_TO_API
// アクセス権限を取得
export async function getClientPermissions(
  clientId: string
): Promise<ClientDataAccessPermission> {
  return {
    id: 'perm-1',
    relationshipId: 'rel-1',
    clientId: clientId,
    allowGoals: true,
    allowTasks: true,
    allowLogs: true,
    allowReflections: true,
    allowAiReports: true,
    isActive: true,
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
  };
}

// @MOCK_TO_API
// クライアントの目標一覧を取得
export async function getClientGoals(
  clientId: string
): Promise<GoalWithProgress[]> {
  return [
    {
      id: 'goal-1',
      userId: clientId,
      title: '健康的な生活習慣を身につける',
      description: '毎日7時間以上の睡眠と週3回の運動を習慣化する',
      deadline: new Date('2025-03-31'),
      status: 'active',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-11-02'),
      completedTasks: 18,
      totalTasks: 25,
      progressPercentage: 72,
    },
    {
      id: 'goal-2',
      userId: clientId,
      title: '英語のスピーキング力向上',
      description: 'オンライン英会話で週2回レッスンを受ける',
      deadline: new Date('2025-06-30'),
      status: 'active',
      createdAt: new Date('2025-01-25'),
      updatedAt: new Date('2025-11-01'),
      completedTasks: 9,
      totalTasks: 20,
      progressPercentage: 45,
    },
    {
      id: 'goal-3',
      userId: clientId,
      title: 'プログラミングスキル習得',
      description: 'JavaScriptとReactを学習し、簡単なWebアプリを作成する',
      deadline: new Date('2025-05-31'),
      status: 'completed',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-10-28'),
      completedTasks: 27,
      totalTasks: 30,
      progressPercentage: 90,
    },
  ];
}

// @MOCK_TO_API
// クライアントのタスク一覧を取得
export async function getClientTasks(
  clientId: string
): Promise<TaskWithGoal[]> {
  return [
    {
      id: 'task-1',
      userId: clientId,
      goalId: 'goal-1',
      title: '今週の運動計画を立てる',
      dueDate: new Date('2025-11-05'),
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-02'),
      goalName: '健康的な生活習慣を身につける',
    },
    {
      id: 'task-2',
      userId: clientId,
      goalId: 'goal-2',
      title: '英会話レッスンを予約する',
      dueDate: new Date('2025-11-08'),
      priority: 'medium',
      status: 'pending',
      createdAt: new Date('2025-11-02'),
      updatedAt: new Date('2025-11-02'),
      goalName: '英語のスピーキング力向上',
    },
    {
      id: 'task-3',
      userId: clientId,
      goalId: 'goal-1',
      title: '睡眠時間を記録する',
      dueDate: new Date('2025-11-03'),
      priority: 'low',
      status: 'completed',
      completedAt: new Date('2025-11-03'),
      createdAt: new Date('2025-10-31'),
      updatedAt: new Date('2025-11-03'),
      goalName: '健康的な生活習慣を身につける',
    },
  ];
}

// @MOCK_TO_API
// クライアントのログ履歴を取得
export async function getClientLogs(clientId: string): Promise<Log[]> {
  return [
    {
      id: 'log-1',
      userId: clientId,
      content:
        '今朝は6時に起床し、30分のジョギングを完了。朝食もしっかり食べて気持ち良い一日のスタートを切れた。運動後のリフレッシュ感が心地よい。',
      emotion: 'happy',
      state: 'energetic',
      type: 'daily',
      createdAt: new Date('2025-11-02T09:30:00'),
    },
    {
      id: 'log-2',
      userId: clientId,
      content:
        '英会話レッスンを受講。まだまだスムーズに話せないが、少しずつ慣れてきている実感がある。継続が大切だと感じる。',
      emotion: 'neutral',
      state: 'focused',
      type: 'daily',
      createdAt: new Date('2025-11-01T20:15:00'),
    },
    {
      id: 'log-3',
      userId: clientId,
      content:
        '仕事が忙しくて運動する時間が取れなかった。睡眠時間も6時間と少なめ。明日は早めに仕事を切り上げて運動したい。',
      emotion: 'sad',
      state: 'stressed',
      type: 'daily',
      createdAt: new Date('2025-10-31T22:00:00'),
    },
  ];
}

// @MOCK_TO_API
// クライアントの振り返り一覧を取得
export async function getClientReflections(
  clientId: string
): Promise<Reflection[]> {
  return [
    {
      id: 'ref-1',
      userId: clientId,
      period: 'weekly',
      startDate: new Date('2025-10-25'),
      endDate: new Date('2025-10-31'),
      content: '週次振り返り',
      achievements:
        '・週3回の運動を達成（ジョギング2回、筋トレ1回）\n・毎日7時間以上の睡眠を6日間達成\n・英会話レッスンを2回受講',
      challenges:
        '・仕事が忙しいと運動の時間を確保しづらい\n・朝型生活にシフトすることで時間を確保しやすいと気づいた\n・英会話は継続が必要だが、少しずつ上達を実感',
      createdAt: new Date('2025-10-31'),
    },
    {
      id: 'ref-2',
      userId: clientId,
      period: 'monthly',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-30'),
      content: '月次振り返り',
      achievements:
        '・プログラミング学習を30日間継続\n・Reactの基礎を習得し、簡単なTodoアプリを作成\n・健康習慣の基盤を構築（睡眠・運動の重要性を認識）',
      challenges:
        '・複数の目標を同時進行すると優先順位が曖昧になる\n・習慣化には最低21日間かかるという実感\n・自己管理には定期的な振り返りが不可欠',
      createdAt: new Date('2025-09-30'),
    },
  ];
}

// @MOCK_TO_API
// クライアントのAI分析レポート一覧を取得
export async function getClientAIReports(
  clientId: string
): Promise<AIAnalysisReportDetailed[]> {
  return [
    {
      id: 'report-1',
      userId: clientId,
      analysisType: 'progress',
      confidence: 0.85,
      confidencePercentage: 85,
      createdAt: new Date('2025-10-31'),
      summary:
        '田中さんは健康習慣の構築において着実な進歩を見せています。特に運動と睡眠の習慣化において、週ごとの達成率が向上しています。',
      insights: [
        {
          id: 'insight-1',
          type: 'progress',
          title: '健康習慣の着実な進歩',
          description:
            '運動と睡眠の習慣化において週ごとの達成率が向上しています。仕事の繁忙期でも習慣を維持しようとする姿勢が見られます。',
          importance: 'high',
        },
      ],
      recommendations: [
        {
          id: 'rec-1',
          priority: 1,
          title: '朝型生活へのシフト',
          description:
            'ログから朝の運動後に生産性が高いことが読み取れます。朝型生活へのシフトを検討してみてください。',
          actionable: true,
          category: 'habit_improvement',
        },
        {
          id: 'rec-2',
          priority: 2,
          title: '英会話の実践機会を増やす',
          description:
            'オンラインコミュニティへの参加も有効です。実践的な会話機会を増やすことで上達が加速します。',
          actionable: true,
          category: 'success_pattern',
        },
      ],
    },
  ];
}

// @MOCK_TO_API
// メンターノート一覧を取得
export async function getMentorNotes(clientId: string): Promise<MentorNote[]> {
  return [
    {
      id: 'note-1',
      mentorId: 'mentor-1',
      clientId: clientId,
      title: '健康習慣への取り組みが素晴らしい',
      content:
        '田中さんは先月から運動と睡眠の習慣化に真剣に取り組んでおり、着実に成果を上げています。特に朝型生活へのシフトを自ら発見し、実践しようとする姿勢は高く評価できます。',
      noteType: 'achievement',
      isSharedWithClient: true,
      tags: ['健康', '成果', 'モチベーション'],
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-01'),
    },
    {
      id: 'note-2',
      mentorId: 'mentor-1',
      clientId: clientId,
      title: '英語学習のペースに注意',
      content:
        '英会話レッスンの頻度が週2回と設定されているが、実際には週1回程度になっているようです。仕事の繁忙期が影響している可能性があります。',
      noteType: 'observation',
      isSharedWithClient: false,
      tags: ['英語学習', 'ペース調整'],
      createdAt: new Date('2025-10-28'),
      updatedAt: new Date('2025-10-28'),
    },
    {
      id: 'note-3',
      mentorId: 'mentor-1',
      clientId: clientId,
      title: '初回ミーティング実施',
      content:
        '田中さんとの初回ミーティングを実施しました。健康習慣の改善と英語学習、そしてプログラミングスキル習得という3つの目標を持っており、それぞれに明確な理由があります。',
      noteType: 'general',
      isSharedWithClient: false,
      tags: ['初回ミーティング', '目標設定'],
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-01-20'),
    },
  ];
}

// @MOCK_TO_API
// メンターノートを作成
export async function createMentorNote(
  clientId: string,
  note: MentorNoteForm
): Promise<MentorNote> {
  const newNote: MentorNote = {
    id: `note-${Date.now()}`,
    mentorId: 'mentor-1',
    clientId: clientId,
    title: note.title,
    content: note.content,
    noteType: note.noteType,
    isSharedWithClient: note.isSharedWithClient,
    tags: note.tags,
    linkedDataType: note.linkedDataType,
    linkedDataId: note.linkedDataId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return newNote;
}

// @MOCK_TO_API
// メンターノートを更新
export async function updateMentorNote(
  noteId: string,
  note: Partial<MentorNoteForm>
): Promise<MentorNote> {
  // モックでは既存データを返す
  const existingNote: MentorNote = {
    id: noteId,
    mentorId: 'mentor-1',
    clientId: 'client-1',
    title: note.title || 'Updated Note',
    content: note.content || 'Updated content',
    noteType: note.noteType || 'general',
    isSharedWithClient: note.isSharedWithClient ?? false,
    tags: note.tags || [],
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date(),
  };

  return existingNote;
}

// @MOCK_TO_API
// メンターノートを削除
export async function deleteMentorNote(noteId: string): Promise<void> {
  // モックでは何もしない
  console.log('Deleted note:', noteId);
}

// @MOCK_TO_API
// 進捗レポートを生成
export async function generateProgressReport(
  clientId: string,
  data: ClientProgressReportForm
): Promise<ClientProgressReport> {
  const newReport: ClientProgressReport = {
    id: `report-${Date.now()}`,
    clientId: clientId,
    mentorId: 'mentor-1',
    reportPeriod: data.reportPeriod,
    startDate: data.startDate,
    endDate: data.endDate,
    overallProgress: 85, // モック値
    completedGoals: 1,
    completedTasks: 27,
    logCount: 15,
    reflectionCount: 2,
    mentorComments: data.mentorComments,
    mentorRating: data.mentorRating,
    areasOfImprovement: data.areasOfImprovement,
    strengths: data.strengths,
    nextSteps: data.nextSteps,
    followUpDate: data.followUpDate,
    isSharedWithClient: data.isSharedWithClient,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return newReport;
}
