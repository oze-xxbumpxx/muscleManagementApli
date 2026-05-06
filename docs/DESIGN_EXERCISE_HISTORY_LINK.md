# 設計書 — 成長グラフへの導線追加

Codex への実装依頼用ドキュメント。

---

## 1. 目的・ゴール

### 目的

実装済みの成長グラフページ（`/exercises/:name`）へのアクセス手段がないため、既存 UI から種目名をクリックして遷移できるようにする。

### 完了ゴール

- トレーニング詳細ページの種目名をクリックすると `/exercises/:name` へ遷移する
- ダッシュボードの種目統計カードの種目名をクリックすると `/exercises/:name` へ遷移する
- 新規ファイルは作成しない（既存コンポーネントへの最小変更のみ）

### スコープ

| 区分 | 内容 |
|---|---|
| 対象 | 下記2ファイルへの `<Link>` 追加のみ |
| 前提 | `/exercises/:name` ルートおよび `ExerciseHistoryPage` は実装済み |
| 対象外 | 新規コンポーネント作成・Hook 追加・API 追加・スタイルの大幅変更 |

---

## 2. 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `frontend/src/components/shared/training/trainingSessionDetail.tsx` | 種目名 `<span>` を `<Link>` に変更 |
| `frontend/src/components/shared/dashboard/ExerciseStatsCard.tsx` | 種目名 `<span>` を `<Link>` に変更 |

新規ファイルの作成は不要。

---

## 3. URL の生成ルール

遷移先は `/exercises/:name`。`:name` は **種目名を `encodeURIComponent` でエンコードした値**。

```ts
// 例
const to = `/exercises/${encodeURIComponent(exerciseName)}`;
// exerciseName = 'ベンチプレス' → '/exercises/%E3%83%99%E3%83%B3%E3%83%81%E3%83%97%E3%83%AC%E3%82%B9'
```

`ExerciseHistoryPage` 側では `decodeURIComponent` で復元済みのため、日本語種目名でも正しく表示される。

---

## 4. 変更箇所の詳細

### 4-1. `trainingSessionDetail.tsx`

**変更前**（33行目付近）

```tsx
<span className="font-medium text-slate-900">{ex.exerciseName}</span>
```

**変更後**

```tsx
<Link
  to={`/exercises/${encodeURIComponent(ex.exerciseName)}`}
  className="font-medium text-slate-900 underline hover:text-emerald-700"
>
  {ex.exerciseName}
</Link>
```

- `Link` は既に `react-router-dom` から import 済み（ファイル内で `編集` リンクに使用中）
- 新たな import 追加は不要

---

### 4-2. `ExerciseStatsCard.tsx`（`ExerciseConsecutiveItem` 内）

**変更前**（`ExerciseConsecutiveItem` の return 内、種目名部分）

```tsx
<span className="font-medium text-slate-900">{props.exerciseName}</span>
```

**変更後**

```tsx
<Link
  to={`/exercises/${encodeURIComponent(props.exerciseName)}`}
  className="font-medium text-slate-900 underline hover:text-emerald-700"
>
  {props.exerciseName}
</Link>
```

- `Link` を `react-router-dom` から import する（現在未 import）

```ts
// 追加する import
import { Link } from 'react-router-dom';
```

---

## 5. スタイル方針

| 項目 | 値 | 理由 |
|---|---|---|
| `underline` | あり | リンクであることを示す |
| `hover:text-emerald-700` | あり | 既存バーの `emerald-500` と色調統一 |
| フォントウェイト | `font-medium`（既存のまま） | 変更なし |

---

## 6. 実装チェックリスト（Codex 完了基準）

- [ ] `trainingSessionDetail.tsx` の種目名 `<span>` を `<Link>` に変更
- [ ] `ExerciseStatsCard.tsx` の種目名 `<span>` を `<Link>` に変更
- [ ] `ExerciseStatsCard.tsx` に `import { Link } from 'react-router-dom'` を追加
- [ ] 遷移先 URL に `encodeURIComponent` を使用している
- [ ] 新規ファイルを作成していない
- [ ] `any` / `as` / `enum` を使用していない

---

## 7. 参照ファイル（既存）

| ファイル | 参照目的 |
|---|---|
| `frontend/src/components/shared/training/trainingSessionDetail.tsx` | 変更対象（`Link` import 済み・変更箇所を確認） |
| `frontend/src/components/shared/dashboard/ExerciseStatsCard.tsx` | 変更対象（`ExerciseConsecutiveItem` 内の種目名 `<span>` を変更） |
| `frontend/src/pages/ExerciseHistoryPage.tsx` | 遷移先（`decodeURIComponent` で復元している実装を確認） |
| `frontend/src/routes/index.tsx` | `/exercises/:name` ルートが定義済みであることを確認 |
