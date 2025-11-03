# AI Assistant E2Eテスト 引き継ぎ指示書（ガンマ担当）

## 📋 引き継ぎ概要

**担当エージェント**: ガンマ（Gamma）
**引き継ぎ元**: ベータ（Beta）
**引き継ぎ日**: 2025-11-03
**タスク**: AI Assistant ページ E2Eテスト修正 - 66.0% → 80%+達成

---

## 🎯 ミッション

AI Assistant ページ (`/ai-assistant`) のE2Eテストを修正し、成功率を **80%以上** に引き上げる。

**現在の状態**:
- ✅ 成功: 33テスト (66.0%)
- ❌ 失敗: 17テスト (34.0%)
- 📊 総数: 50テスト

**目標**:
- 🎯 成功: 40テスト以上 (80%+)
- 📈 失敗: 10テスト以下

---

## 📂 テストファイル構成

AI Assistant E2Eテストは以下の6ファイルに分散しています:

```
tests/e2e/ai-assistant/
├── ai-assistant-basic.spec.ts          # 基本機能テスト（16テスト）
├── ai-assistant-messaging.spec.ts      # メッセージング機能（15テスト）
├── ai-assistant-modes.spec.ts          # モード切り替え（8テスト）
├── ai-assistant-errors.spec.ts         # エラーハンドリング（6テスト）
├── ai-assistant-responsive.spec.ts     # レスポンシブ（3テスト）
└── ai-assistant-security.spec.ts       # セキュリティ（2テスト）
```

---

## ❌ 失敗中のテスト一覧（17テスト）

### 1. ai-assistant-basic.spec.ts（3テスト失敗）
- ❌ **E2E-AIA-004**: チャット履歴が表示される
- ❌ **E2E-AIA-005**: 新しいメッセージ入力欄が表示される
- ❌ **E2E-AIA-006**: モード切り替えボタンが表示される

### 2. ai-assistant-messaging.spec.ts（6テスト失敗）
- ❌ **E2E-AIA-011**: メッセージ送信後にレスポンスが表示される
- ❌ **E2E-AIA-012**: メッセージ送信中は送信ボタンが無効化される
- ❌ **E2E-AIA-014**: 連続でメッセージを送信できる
- ❌ **E2E-AIA-015**: メッセージの削除ができる
- ❌ **E2E-AIA-023**: メッセージ送信時にタイムスタンプが表示される

### 3. ai-assistant-errors.spec.ts（4テスト失敗）
- ❌ **E2E-AIA-025**: 空のメッセージは送信できない
- ❌ **E2E-AIA-026**: ネットワークエラー時にエラーメッセージが表示される
- ❌ **E2E-AIA-030**: APIエラー時にリトライボタンが表示される

### 4. ai-assistant-responsive.spec.ts（3テスト失敗）
- ❌ **E2E-AIA-042**: モバイル表示でチャット履歴が正しく表示される
- ❌ **E2E-AIA-043**: モバイル表示でメッセージ入力欄が正しく表示される
- ❌ **E2E-AIA-044**: タブレット表示でレイアウトが適切に調整される

### 5. ai-assistant-security.spec.ts（1テスト失敗）
- ❌ **E2E-AIA-038**: XSS攻撃に対する保護

---

## 🔧 環境セットアップ

### 1. フロントエンドサーバー起動

```bash
cd /Users/nishiyamayoshimitsu/Desktop/ブルーランプ開発/Mental-Base
export VITE_SKIP_AUTH=true
npm run dev
```

- ポート: `3247`
- モック認証: `VITE_SKIP_AUTH=true` 必須
- ブラウザで確認: http://localhost:3247

### 2. E2Eテスト実行方法

#### 全テスト実行
```bash
cd /Users/nishiyamayoshimitsu/Desktop/ブルーランプ開発/Mental-Base
npx playwright test tests/e2e/ai-assistant/ --project=chromium
```

#### 個別ファイル実行
```bash
npx playwright test tests/e2e/ai-assistant/ai-assistant-basic.spec.ts --project=chromium
```

#### ヘッドレスモード無効（デバッグ用）
```bash
npx playwright test tests/e2e/ai-assistant/ai-assistant-basic.spec.ts --headed
```

#### 特定テスト実行（テストID指定）
```bash
npx playwright test tests/e2e/ai-assistant/ai-assistant-basic.spec.ts -g "E2E-AIA-004"
```

---

## 🎯 作業手順

### Step 1: 現状確認（30分）
1. AI Assistantページを手動で確認 (`http://localhost:3247/ai-assistant`)
2. 失敗中の17テストを1つずつ実行し、エラーログを確認
3. 共通するエラーパターンを特定

### Step 2: 実装状態の確認（30分）
確認すべきファイル:
- `app/(protected)/ai-assistant/page.tsx` - ページコンポーネント
- `components/chat/` - チャット関連コンポーネント
- `hooks/useAIAssistant.ts` - AIアシスタントカスタムフック
- `lib/services/AIAssistantService.ts` - AIアシスタントサービス
- `app/api/ai-assistant/chat/` - APIルート

### Step 3: Mock実装の強化（2-3時間）
優先度の高い修正:
1. **チャット履歴Mock** (E2E-AIA-004関連)
   - APIレスポンスが正しく返っているか
   - フロントエンドでの表示処理が正しいか

2. **メッセージ送受信Mock** (E2E-AIA-011, 012, 014関連)
   - 送信ボタンの状態管理
   - レスポンス待機ロジック
   - 連続送信の状態管理

3. **モード切り替え時の履歴保持** (E2E-AIA-006関連)
   - モード変更時のデータ永続化
   - 履歴のクリア/保持ロジック

### Step 4: テスト修正・実行（3-4時間）
1. 1つのファイルずつ修正 → テスト実行 → 確認
2. 修正内容をコミット（小さくコミット）
3. 進捗を `docs/SCOPE_PROGRESS.md` に記録

### Step 5: 進捗報告（15分）
- `docs/SCOPE_PROGRESS.md` の「AI Assistant」行を更新
- 成功率が80%を超えたら完了報告

---

## 📊 進捗管理

### SCOPE_PROGRESS.md 更新方法

**ファイル**: `docs/SCOPE_PROGRESS.md`

#### 1. ページ別進捗表の更新（67行目）

現在の行（67行目）:
```markdown
| **AI Assistant** (/ai-assistant) | 33 | 0 | 50 | **66.0%** | 🚧 実装中 | **Gamma** |
```

**例**: 40テスト成功した場合
```markdown
| **AI Assistant** (/ai-assistant) | 40 | 0 | 50 | **80.0%** | ✅ 完了 | **Gamma** |
```

**変更箇所**:
- 1列目: Pass数を更新（33 → 40）
- 4列目: 成功率を更新（66.0% → 80.0%）
- 5列目: 状態を更新（🚧 実装中 → ✅ 完了）※80%達成時

#### 2. 全体進捗サマリーの更新（47行目・52-55行目）

**必須**: 全体進捗サマリーを更新したら**必ず更新日時を記載**してください。

現在の更新日時（47行目）:
```markdown
**最終更新**: 2025-11-03 12:30
```

更新例:
```markdown
**最終更新**: 2025-11-03 14:45
```

**フォーマット**: `YYYY-MM-DD HH:MM`（24時間形式）

さらに、以下の数値も更新:
- 52行目: **テスト成功**（502項目 → AI Assistant成功数が増えたら更新）
- 54行目: **80%達成ページ**（4/6ページ → 80%達成したら5/6ページ）
- 55行目: **実装中ページ**（3/6ページ → 80%達成したら2/6ページ）

#### 3. ページ別進捗の注記の更新（74行目）

現在の注記（74行目）:
```markdown
- **AI Assistant**: 66.0%達成（33/50テスト）、17テスト要修正 - **Gamma担当（新規引き継ぎ）**
```

更新例（40テスト成功の場合）:
```markdown
- **AI Assistant**: 80.0%達成（40/50テスト）、10テスト要修正 - **Gamma担当**
```

または完了時:
```markdown
- **AI Assistant**: 80.0%達成（40/50テスト）- **Gamma担当（完了）**
```

### テスト実行結果の記録

E2Eテスト進捗サマリーに追記:

```markdown
#### ✅ ガンマ担当: AI Assistant E2Eテスト修正 (2025-11-03)

| テストファイル | Pass | Fail | 総数 | 成功率 |
|---------------|------|------|------|--------|
| ai-assistant-basic.spec.ts | 13 | 3 | 16 | 81.3% |
| ai-assistant-messaging.spec.ts | 9 | 6 | 15 | 60.0% |
| ai-assistant-modes.spec.ts | 8 | 0 | 8 | 100% |
| ai-assistant-errors.spec.ts | 2 | 4 | 6 | 33.3% |
| ai-assistant-responsive.spec.ts | 0 | 3 | 3 | 0.0% |
| ai-assistant-security.spec.ts | 1 | 1 | 2 | 50.0% |
| **合計** | **33** | **17** | **50** | **66.0%** |
```

---

## 🆘 トラブルシューティング

### Q1: フロントエンドサーバーが起動しない
```bash
# ポート3247が使用中の場合
lsof -ti:3247 | xargs kill -9
npm run dev
```

### Q2: テストが全て失敗する
- `VITE_SKIP_AUTH=true` を設定しているか確認
- http://localhost:3247 がアクセス可能か確認
- ブラウザのキャッシュをクリア

### Q3: Playwrightがインストールされていない
```bash
npx playwright install chromium
```

### Q4: テストがタイムアウトする
- `playwright.config.ts` の timeout 設定を確認
- テスト内の `page.waitForTimeout()` を調整

---

## 📝 重要な注意事項

1. **ベータの作業に影響を与えない**
   - Plan-Do ページ関連ファイルは編集しない
   - `docs/SCOPE_PROGRESS.md` の Phase 2 セクションは触らない

2. **アルファの進捗は更新しない**
   - Check-Action ページは担当外

3. **小さくコミット**
   - 1ファイル修正 → 1コミット
   - コミットメッセージ例: `fix: AI Assistant E2E-AIA-004 チャット履歴表示を修正`

4. **80%達成が目標**
   - 50テスト中40テスト成功 = 80.0%
   - 全テストを100%にする必要はない（時間効率重視）

---

## 🎯 成功の定義

以下の条件を満たせば引き継ぎタスク完了:

- [ ] AI Assistantページ E2Eテスト成功率 **80%以上** (40/50テスト以上)
- [ ] `docs/SCOPE_PROGRESS.md` の進捗表を更新
- [ ] 修正内容をGitにコミット
- [ ] フェーズ1他ページに影響を与えていないことを確認

---

## 🔗 参考リソース

- **プロジェクト設定**: `CLAUDE.md`
- **進捗管理**: `docs/SCOPE_PROGRESS.md`
- **要件定義**: `docs/requirements.md`
- **Playwright公式ドキュメント**: https://playwright.dev/

---

**頑張ってください！ガンマ！🚀**

---

**作成者**: ベータ (Beta)
**作成日**: 2025-11-03
**バージョン**: 1.0
