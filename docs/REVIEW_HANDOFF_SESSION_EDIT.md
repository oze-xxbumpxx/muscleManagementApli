# Claude レビュー用メモ — セッション編集フォーム（設計・プラン）

この文書は **実装前の設計・プラン**を Claude（ClaudeCode 等）にレビューしてもらうための受け渡し用です。  
詳細な実装コードテンプレートは Cursor プラン **「SessionEdit フォーム」**（`sessionedit_フォーム_52d58039.plan.md`）の **§5.8 付録** にあります。

---

## 受け渡しテンプレ（.cursorrules 準拠）

```
【担当】レビュー・設計判断
【対象】SessionEdit（記録編集）フロント実装プラン
【変更予定（主なパス）】
  - frontend/src/graphql/operations/trainingSessions.graphql（Mutation 追記）
  - frontend/src/validation/trainingSessionUpdate.ts（新規）
  - frontend/src/hooks/useUpdateTrainingSessionForm.ts（新規）
  - frontend/src/hooks/useTrainingSessionDetail.ts（skip 対応の拡張）
  - frontend/src/components/shared/training/TrainingSessionEditForm.tsx（新規・**PascalCase.tsx**／[CLAUDE.md](../CLAUDE.md) 準拠）
  - frontend/src/containers/TrainingSessionEditContainer.tsx（新規）
  - frontend/src/pages/SessionEditPage.tsx（差し替え）
  - 任意: frontend/src/components/shared/training/trainingSessionDetail.tsx（編集リンク）
【未解決点・レビューしてほしい点】
  - **空欄仕様**: MVP を「空欄 = omit（A）」とするか「空欄 = null クリア（B）」とするか（プラン推奨は A。決定後に Zod / buildUpdateInput を確定）
  - useTrainingSessionDetail に **`skip: sessionId === undefined`**（**Hooks 違反ではなく、`id: 0` への不要リクエスト防止**が主目的）
  - 成功後の遷移先（詳細固定でよいか）
【参照】本文書 / Cursor プラン sessionedit_フォーム_52d58039.plan.md §5.8
```

---

## 1. 背景

- ルートは既存: `/sessions/:id/edit` → [SessionEditPage.tsx](../frontend/src/pages/SessionEditPage.tsx)（現状プレースホルダー）。
- バックエンドの `updateTrainingSession` は **基本情報のみ**（`date`, `bodyWeight`, `notes`）。種目は別 Mutation 群。

---

## 2. ゴール（MVP）

- 既存セッションを取得し、日付・体重・メモを編集して保存。
- クライアント Zod は [updateTrainingSessionUsecase.ts](../backend/src/usecases/updateTrainingSessionUsecase.ts) と整合（少なくとも1フィールド必須など）。
- Apollo: Mutation 追加、`refetchQueries` で一覧＋詳細クエリを整合。

---

## 3. アーキテクチャ（要点）

- **Page** → **Container** → **Presentational** + **Hooks**（作成画面と同パターン）。
- データ取得: 既存 `useTrainingSessionDetail` を流用。**`sessionId === undefined` のとき `useQuery` に `skip: true`** を付け、`id: 0` での誤実行を防ぐ（詳細 Container は既に NotFound 先 return だが、Hook は常に呼ばれるため `skip` が必要）。

---

## 4. スコープ外（明示）

- 種目の追加・更新・削除・並び替え（別フェーズ）。

---

## 5. レビュー観点（依頼したいこと）

1. **クリーンアーキテクチャ / フロント3層**（Presentational に Apollo を持ち込まない）の遵守。
2. **`useTrainingSessionDetail` の `skip`**（`sessionId === undefined` 時のネットワーク抑止で十分か）。
3. **更新ペイロード**: 先に **A（omit）か B（null クリア）か**を決めたうえで、UI・Zod・GraphQL が一貫するか。
4. **Google TS スタイル**: `any` / `as` / `enum` 不使用、interface 優先。
5. **セキュリティ・エッジケース**: 不正 id、存在しないセッション、Mutation 失敗時の UX（Toast 等）。

---

## 6. 実装コードテンプレの場所

全文のコピペ用スニペット（GraphQL / Zod / Hook / Form / Container / Page / リンク例）は、  
**Cursor プラン「SessionEdit フォーム」→ セクション 5.8 付録** を参照してください。  
（リポジトリ外: `~/.cursor/plans/sessionedit_フォーム_52d58039.plan.md`）

---

## 7. 関連ファイル（既存）

| ファイル | 用途 |
|----------|------|
| [backend/src/graphql/schema.graphql](../backend/src/graphql/schema.graphql) | `UpdateTrainingSessionInput`, Mutation |
| [backend/src/usecases/updateTrainingSessionUsecase.ts](../backend/src/usecases/updateTrainingSessionUsecase.ts) | サーバ側 Zod |
| [frontend/src/hooks/useTrainingSessionDetail.ts](../frontend/src/hooks/useTrainingSessionDetail.ts) | 詳細取得（skip 拡張候補） |
| [frontend/src/containers/TrainingDetailContainer.tsx](../frontend/src/containers/TrainingDetailContainer.tsx) | id パース・NotFound パターンの参考 |
| [frontend/src/utils/parseSessionId.ts](../frontend/src/utils/parseSessionId.ts) | `parseSessionIdParam` |

---

*作成意図: Claude へのレビュー依頼を1ファイルにまとめる。実装完了後は本メモを更新するかアーカイブしてよい。*
