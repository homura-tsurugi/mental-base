# RAGベースAIコーチングbot - デザインシステム

## 概要

このデザインシステムは、既存の**COM:PASS**プロジェクトのデザイン言語を継承し、RAGベースAIコーチングbotに統一されたUI/UXを提供します。

参照元: COM:PASSメンターダッシュボード（既存HTMLコード）

---

## 1. カラーパレット

### プライマリカラー
```css
--primary: #2c5282;          /* メインブランドカラー */
--primary-light: #4a69a7;    /* ホバー時の明るめ */
--primary-dark: #1e3a5f;     /* サイドナビ背景など */
```

### セカンダリカラー
```css
--secondary: #4299e1;        /* アクセントカラー */
--secondary-light: #63b3ed;  /* 軽いアクセント */
```

### 背景色
```css
--background: #ffffff;       /* カード背景 */
--surface: #f7fafc;          /* 淡い背景 */
--page-background: #f5f7fa;  /* ページ全体の背景 */
```

### テキストカラー
```css
--text: #2d3748;             /* メインテキスト */
--text-secondary: #718096;   /* 補助テキスト */
```

### ステータスカラー
```css
--success: #48bb78;          /* 成功・完了 */
--warning: #ecc94b;          /* 警告・注意 */
--error: #e53e3e;            /* エラー・危険 */
--info: #63b3ed;             /* 情報 */
--ai: #9f7aea;               /* AI機能カラー（パープル） */
```

---

## 2. タイポグラフィ

### フォントファミリー
```css
font-family: 'Roboto', 'Noto Sans JP', sans-serif;
```

### フォントサイズ
```css
--font-xs: 12px;   /* 小さいテキスト（タイムスタンプ等） */
--font-sm: 14px;   /* 小さめテキスト（説明文等） */
--font-md: 16px;   /* 標準テキスト */
--font-lg: 18px;   /* 大きめテキスト（セクションタイトル等） */
--font-xl: 24px;   /* 見出し */
--font-xxl: 32px;  /* 大見出し */
```

### フォントウェイト
```css
font-weight: 300;  /* Light */
font-weight: 400;  /* Regular */
font-weight: 500;  /* Medium */
font-weight: 700;  /* Bold */
```

---

## 3. スペーシング

```css
--spacing-xs: 4px;   /* 極小 */
--spacing-sm: 8px;   /* 小 */
--spacing-md: 16px;  /* 中（標準） */
--spacing-lg: 24px;  /* 大 */
--spacing-xl: 32px;  /* 特大 */
```

---

## 4. ボーダー・角丸

```css
--radius-sm: 4px;    /* 小さい角丸 */
--radius-md: 8px;    /* 標準角丸（カード等） */
--radius-lg: 12px;   /* 大きい角丸 */
--radius-full: 9999px; /* 完全な円形 */
```

---

## 5. シャドウ

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
```

---

## 6. レイアウト構造

### サイドナビゲーション
```css
width: 240px;
background-color: var(--primary-dark);
position: fixed;
height: 100vh;
z-index: 100;
```

### メインコンテンツ
```css
margin-left: 240px; /* サイドナビの幅に合わせる */
padding: var(--spacing-xl);
background-color: #f5f7fa;
min-height: 100vh;
```

### グリッドシステム
```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: var(--spacing-md);
```

---

## 7. コンポーネント

### ボタン

#### プライマリボタン
```css
background-color: var(--primary);
color: white;
padding: var(--spacing-sm) var(--spacing-md);
border-radius: var(--radius-md);
border: none;
cursor: pointer;
```

#### アイコンボタン
```css
width: 40px;
height: 40px;
border-radius: 50%;
background: none;
border: none;
cursor: pointer;
```

### カード
```css
background-color: var(--background);
border-radius: var(--radius-md);
box-shadow: var(--shadow-sm);
overflow: hidden;
```

### アバター
```css
width: 40px;
height: 40px;
border-radius: 50%;
background-color: var(--secondary);
```

### フィルターチップ
```css
background-color: var(--surface);
border: 1px solid #e2e8f0;
border-radius: var(--radius-full);
padding: 4px var(--spacing-sm);
font-size: var(--font-xs);
cursor: pointer;
```

#### アクティブ状態
```css
background-color: var(--primary);
border-color: var(--primary);
color: white;
```

### アラートアイコン（優先度別）
```css
/* 高優先 */
background-color: rgba(229, 62, 62, 0.1);
color: var(--error);

/* 中優先 */
background-color: rgba(236, 201, 75, 0.1);
color: var(--warning);

/* 低優先 */
background-color: rgba(99, 179, 237, 0.1);
color: var(--info);
```

### 統計カード
```css
background-color: var(--surface);
border-radius: var(--radius-md);
padding: var(--spacing-md);
```

---

## 8. アイコン

**Material Icons** を使用
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

---

## 9. チャート

**Chart.js** を使用
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
```

---

## 10. レスポンシブデザイン

### ブレークポイント（推奨）
```css
/* モバイル */
@media (max-width: 767px) { ... }

/* タブレット */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* デスクトップ */
@media (min-width: 1024px) { ... }
```

---

## 11. アクセシビリティ

- **フォーカス状態**: 明確なアウトライン表示
- **カラーコントラスト**: WCAG AA基準準拠
- **キーボード操作**: 全インタラクティブ要素で対応

---

## 12. アニメーション

### トランジション
```css
transition: all 0.3s;
```

### ホバー効果
```css
.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
```

---

## 13. RAGベースAIチャット固有のデザイン要件

### クライアント向けチャットUI
- **背景**: `--page-background` (#f5f7fa)
- **チャットバブル（ユーザー）**: `--secondary` (#4299e1)
- **チャットバブル（AI）**: `--background` (#ffffff) + `--shadow-sm`
- **入力フィールド**: `--surface` (#f7fafc) + `border: 1px solid #e2e8f0`

### 引用元表示
```css
background-color: rgba(66, 153, 225, 0.1);
border-left: 3px solid var(--secondary);
padding: var(--spacing-sm);
font-size: var(--font-xs);
color: var(--text-secondary);
```

### 会話履歴リスト
```css
background-color: var(--surface);
border-radius: var(--radius-md);
padding: var(--spacing-md);
border-bottom: 1px solid rgba(0, 0, 0, 0.05);
```

### AI機能コンポーネント

#### AI提案カード
```css
background-color: rgba(159, 122, 234, 0.1);
border: 1px dashed var(--ai);
border-radius: var(--radius-md);
padding: var(--spacing-md);
```

#### AIボタン
```css
background-color: var(--ai);
color: white;
border-radius: var(--radius-full);
transition: all 0.3s;
```

#### AIボタン（ホバー）
```css
background-color: #8a63d2;
```

#### AI感情分析バー
```css
/* 肯定的 */
background-color: var(--success);

/* 否定的 */
background-color: var(--error);

/* 中立 */
background-color: var(--info);
```

#### AIトピックタグ
```css
background-color: rgba(159, 122, 234, 0.1);
color: var(--ai);
border-radius: var(--radius-full);
padding: 2px 6px;
font-size: var(--font-xs);
```

#### AIコンテキストセクション
```css
background-color: rgba(159, 122, 234, 0.05);
border-radius: var(--radius-md);
padding: var(--spacing-md);
```

---

## 14. 実装方針

### Dify標準ページ（D-001〜D-009）
- **方針**: Dify標準UIをそのまま使用
- **カスタマイズ**: 不要（MVP段階）
- **理由**: 開発工数ゼロ、スマホ対応済み

### COM:PASSカスタム開発（C-001）
- **方針**: 既存COM:PASSデザインシステムを踏襲
- **実装**: 上記カラー・タイポグラフィ・コンポーネントを使用
- **フレームワーク**: FastAPI + 既存COM:PASSフロントエンド

---

## 15. デザイントークン（CSS変数）全体

```css
:root {
  /* カラー */
  --primary: #2c5282;
  --primary-light: #4a69a7;
  --primary-dark: #1e3a5f;
  --secondary: #4299e1;
  --secondary-light: #63b3ed;
  --background: #ffffff;
  --surface: #f7fafc;
  --text: #2d3748;
  --text-secondary: #718096;
  --success: #48bb78;
  --warning: #ecc94b;
  --error: #e53e3e;
  --info: #63b3ed;
  --ai: #9f7aea; /* AI機能カラー */

  /* シャドウ */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);

  /* スペーシング */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* ボーダー */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* タイポグラフィ */
  --font-xs: 12px;
  --font-sm: 14px;
  --font-md: 16px;
  --font-lg: 18px;
  --font-xl: 24px;
  --font-xxl: 32px;
}
```

---

---

## 16. 参照HTMLモックアップ

デザインシステムの参照用HTMLモックアップ：
- `mockups/dashboard-page.html` - メンターダッシュボード（グリッドレイアウト、統計カード、チャート）
- `mockups/messaging-page.html` - メッセージング（チャットUI、AI機能統合、感情分析）

---

**最終更新日**: 2025-11-02
**作成者**: BlueLamp レコンX + Claude Code
**参照元**: COM:PASSメンターダッシュボードHTML、メッセージングページHTML
