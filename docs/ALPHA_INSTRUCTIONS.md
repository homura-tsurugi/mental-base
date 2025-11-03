# アルファ担当: Check-Action 80%+達成 実装指示書

**担当者**: アルファ (Alpha)
**目標**: Check-Action 48.3% → 80%+達成 (目標47/58テスト = 81.0%)
**推定時間**: 2-3時間
**優先度**: 高

---

## 現状分析

### テスト結果
- **現在**: 28/58テスト成功 (48.3%)
- **目標**: 47/58テスト成功 (81.0%)
- **必要**: +19テスト成功

### 主な失敗原因

#### 1. AI分析後のタブ切り替え未実装 (全ブラウザ失敗)
**失敗テスト**: E2E-CHKACT-014
**問題**: AI分析ボタンをクリックしても、Actionタブに自動切り替えされない
**ファイル**: `app/(protected)/check-action/page.tsx`

#### 2. 成功アラート未実装 (全ブラウザ失敗)
**失敗テスト**: E2E-CHKACT-026
**問題**: `[data-testid="alert-success"]` が存在しない
**ファイル**: `components/check-action/ActionPlanForm.tsx` (推定)

#### 3. エラーハンドリング未実装 (E2E-CHKACT-027~037)
**問題**: `[data-testid="error-card"]` が存在しない
**ファイル**: `app/(protected)/check-action/page.tsx`

---

## 実装手順

### フェーズ1: AI分析タブ切り替え実装 (30分)

#### 修正ファイル: `app/(protected)/check-action/page.tsx`

**現在のコード箇所** (推定210行目付近):
```typescript
const handleAIAnalyze = async () => {
  setIsAnalyzing(true);
  try {
    const latestReflection = data.reflections[0];
    await generateAIAnalysis(latestReflection.id);
    // ここでタブ切り替えが抜けている
  } catch (err) {
    console.error('AI analysis error:', err);
  } finally {
    setIsAnalyzing(false);
  }
};
```

**修正後**:
```typescript
const handleAIAnalyze = async () => {
  setIsAnalyzing(true);
  try {
    const latestReflection = data.reflections[0];
    await generateAIAnalysis(latestReflection.id);

    // AI分析完了後、Actionタブに自動切り替え
    setActiveTab('action');
  } catch (err) {
    console.error('AI analysis error:', err);
  } finally {
    setIsAnalyzing(false);
  }
};
```

**テスト対象**: E2E-CHKACT-014 (全ブラウザ)
**検証コマンド**:
```bash
npx playwright test tests/e2e/check-action/check-action-basic.spec.ts:232 --project=chromium
```

---

### フェーズ2: 成功アラート実装 (45分)

#### 2-1. Alert コンポーネント作成

**新規ファイル**: `components/ui/alert.tsx`

```typescript
'use client';

import React from 'react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning';
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'success', children, onClose }) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div
      data-testid={`alert-${variant}`}
      className={`p-4 rounded-lg border ${bgColors[variant]} flex items-center justify-between`}
    >
      <span>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-sm underline hover:no-underline"
        >
          閉じる
        </button>
      )}
    </div>
  );
};
```

#### 2-2. ActionPlanForm に Alert 統合

**修正ファイル**: `components/check-action/ActionPlanForm.tsx`

**追加インポート**:
```typescript
import { Alert } from '@/components/ui/alert';
```

**状態追加**:
```typescript
const [showSuccess, setShowSuccess] = useState(false);
```

**フォーム送信処理修正** (約63行目):
```typescript
const handleSubmit = async () => {
  if (!title.trim()) return;

  setIsSubmitting(true);
  try {
    await onSubmit({ title, actionItems });

    // 成功アラート表示
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);  // 5秒後に非表示

    // フォームクリア
    setTitle('');
    setActionItems([{ id: Date.now().toString(), content: '', completed: false }]);
  } catch (error) {
    console.error('Failed to submit action plan:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

**JSX追加** (フォームの上部):
```typescript
return (
  <div>
    {/* 成功アラート */}
    {showSuccess && (
      <Alert variant="success" onClose={() => setShowSuccess(false)}>
        改善計画を作成しました
      </Alert>
    )}

    {/* 既存のフォーム */}
    <form onSubmit={handleSubmit}>
      ...
    </form>
  </div>
);
```

**テスト対象**: E2E-CHKACT-026 (全ブラウザ)
**検証コマンド**:
```bash
npx playwright test tests/e2e/check-action/check-action-basic.spec.ts:502 --project=chromium
```

---

### フェーズ3: エラーハンドリング実装 (1時間)

#### 3-1. エラー状態管理

**修正ファイル**: `app/(protected)/check-action/page.tsx`

**状態追加**:
```typescript
const [error, setError] = useState<string | null>(null);
```

**データ取得エラーハンドリング**:
```typescript
useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);  // エラーリセット

    try {
      const result = await getCheckActionData(period);
      setData(result);
    } catch (err) {
      setError('データの取得に失敗しました。もう一度お試しください。');
      console.error('Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [period]);
```

#### 3-2. エラー表示UI

**JSX追加** (ページコンテナ内の最上部):
```typescript
return (
  <MainLayout user={mockUser}>
    <div data-testid="page-container" className="px-6 py-6">
      {/* エラー表示 */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 既存のコンテンツ */}
      ...
    </div>
  </MainLayout>
);
```

#### 3-3. APIエラーMock対応

**修正ファイル**: `hooks/useCheckActionData.ts` (推定)

**エラーMock追加**:
```typescript
export const useCheckActionData = (period: string) => {
  const [data, setData] = useState<CheckActionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // URLからエラーMockパラメータを確認
        const url = new URL(window.location.href);
        const mockError = url.searchParams.get('mockError');

        if (mockError === 'api') {
          throw new Error('API接続エラーが発生しました');
        }

        // 通常のデータ取得
        const response = await fetch(`/api/check-action?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, isLoading, error };
};
```

**テスト対象**: E2E-CHKACT-027~037 (エラー系テスト)
**検証コマンド**:
```bash
npx playwright test tests/e2e/check-action/check-action-error.spec.ts --project=chromium
```

---

## 検証方法

### ステップ1: 個別テスト実行
```bash
# フェーズ1検証
npx playwright test tests/e2e/check-action/check-action-basic.spec.ts:232

# フェーズ2検証
npx playwright test tests/e2e/check-action/check-action-basic.spec.ts:502

# フェーズ3検証
npx playwright test tests/e2e/check-action/check-action-error.spec.ts
```

### ステップ2: 全テスト実行
```bash
npx playwright test tests/e2e/check-action --reporter=list
```

### ステップ3: 成功率確認
**目標**: 47/58テスト以上 (81.0%+)

**確認コマンド**:
```bash
npx playwright test tests/e2e/check-action --reporter=list 2>&1 | grep -E "passed|failed"
```

---

## 成功基準

- [x] E2E-CHKACT-014: AI分析後のタブ切り替え (3ブラウザ)
- [x] E2E-CHKACT-026: 成功アラート表示 (3ブラウザ)
- [x] E2E-CHKACT-027~037: エラーハンドリング (一部)
- [x] **全体**: 81.0%以上 (47/58テスト)

---

## トラブルシューティング

### 問題1: テストがタイムアウトする
**解決策**: Message Timing を5秒に延長
```typescript
setTimeout(() => setShowSuccess(false), 5000);  // 3000 → 5000に変更
```

### 問題2: アラートが表示されない
**解決策**: `data-testid="alert-success"` が正しく設定されているか確認

### 問題3: エラーMockが動作しない
**解決策**: URLパラメータ `?mockError=api` を正しく読み取っているか確認

---

## 完了報告

実装完了後、以下を報告してください：

1. **テスト結果**: `npx playwright test tests/e2e/check-action --reporter=list`の最終行
2. **成功率**: XX/58テスト (XX.X%)
3. **修正ファイル**: 変更したファイルの一覧
4. **所要時間**: 実際にかかった時間

**報告先**: オーケストレーター（ユーザー）

---

**重要**: ベータがAI Assistant担当と並行作業します。Git競合を避けるため、Check-Actionページ関連ファイルのみ編集してください。
