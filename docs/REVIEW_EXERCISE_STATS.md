# コードレビュー: 種目統計 UI（フェーズ5）

**対象**: `ExerciseStatsContainer` / `ExerciseStatsCard` / `useExerciseStats` の実装  
**レビュー日**: 2026-05-03  
**設計書**: `docs/DESIGN_EXERCISE_STATS.md`

---

## サマリー

設計書への整合性は非常に高く、3層分離・型安全性・既存パターンとの一貫性も良好。  
**必須修正は1件のみ（型名タイポ）**。その他は MVP として現状許容。

---

## 🔴 Critical（マージ前に必須修正）

### C-1. 型名タイポ `UseExerciseStatusResult` → `UseExerciseStatsResult`

**対象ファイル**: `frontend/src/hooks/useExerciseStatus.ts`

**問題**  
設計書 §7 のインターフェース定義および §11 のチェックリスト項目では `UseExerciseStatsResult`（Stats）と定義されているが、実装では `UseExerciseStatusResult`（Status）になっている。  
ファイル名（`useExerciseStats.ts`）・関数名（`useExerciseStats`）は正しいが、**型名だけ「統計」ではなく「状態」になっており**、意味のズレと設計書との不整合が生じている。

**修正箇所**（14行目・29行目）

```ts
// 修正前
export interface UseExerciseStatusResult { ... }
export function useExerciseStats(sessionCount?: number): UseExerciseStatusResult

// 修正後
export interface UseExerciseStatsResult { ... }
export function useExerciseStats(sessionCount?: number): UseExerciseStatsResult
```

---

## 🟡 Warning（推奨修正）

### W-1. 連続回数の表示ロジックが読みにくい

**対象ファイル**: `frontend/src/components/shared/dashboard/ExerciseStatsCard.tsx:42-45`

**問題**  
2つの条件 `{loading || error !== undefined ? '—' : null}` と `{shouldShowConsecutive ? '...' : null}` が並列に並んでおり、一見「両方表示される可能性」があるように見える。実際は排他だが、コード上にその排他性が表れていない。

**修正案**

```tsx
// ヘルパー関数で整理
function formatConsecutive(
  loading: boolean,
  error: Error | undefined,
  count: number
): string | null {
  if (loading || error !== undefined) return '—';
  if (count > 0) return `${count}回連続`;
  return null;
}

// 使用箇所（shouldShowConsecutive 変数も不要になる）
<span className="text-sm font-medium text-slate-700">
  {formatConsecutive(loading, error, consecutiveCount)}
</span>
```

---

### W-2. 進捗バーにアクセシビリティ属性が不足

**対象ファイル**: `frontend/src/components/shared/dashboard/ExerciseStatsCard.tsx:35-40`

**問題**  
現状は `aria-hidden="true"` で視覚的なバーをスクリーンリーダーから完全に隠しているため、視覚障害者には頻度情報が伝わらない。

**修正案**

```tsx
<span
  role="progressbar"
  aria-label={`${props.exerciseName}の登場頻度`}
  aria-valuenow={props.frequencyCount}
  aria-valuemin={0}
  aria-valuemax={props.sessionCount}
  className="block h-2 rounded-full bg-slate-100"
>
  <span
    className="block h-2 rounded-full bg-emerald-500"
    style={{ width: `${barPercent}%` }}
    aria-hidden="true"
  />
</span>
```

---

## 🔵 Info（任意対応）

### I-1. `import type` の分離

**対象ファイル**: `frontend/src/hooks/useExerciseStats.ts:1-4`

`RecentExerciseFrequencyQuery` は型としてのみ使用されているため `import type` に分離すべき（Google Style Guide / バンドラ最適化）。

```ts
// 修正前
import {
  RecentExerciseFrequencyDocument,
  RecentExerciseFrequencyQuery,
} from '@/graphql/generated/graphql';

// 修正後
import { RecentExerciseFrequencyDocument } from '@/graphql/generated/graphql';
import type { RecentExerciseFrequencyQuery } from '@/graphql/generated/graphql';
```

---

### I-2. `ExerciseFrequency` 型が Hook と Card で重複定義

**対象ファイル**:  
- `frontend/src/hooks/useExerciseStats.ts:9-12`  
- `frontend/src/components/shared/dashboard/ExerciseStatsCard.tsx:4-7`

同名・同形の `interface ExerciseFrequency` が2箇所に存在。Hook 側で `export` 済みなので Card 側は import で統一できる。

```ts
// ExerciseStatsCard.tsx
import type { ExerciseFrequency } from '@/hooks/useExerciseStatus';
```

---

## 設計書チェックリスト充足状況

| チェック項目 | 状態 |
|---|---|
| `dashboard.graphql` に2オペレーション追記 | ✅ |
| `npm run codegen` 実行・型再生成 | ✅ |
| `useExerciseStats.ts` 実装（`UseExerciseStatsResult` を export） | ⚠️ 型名タイポ（C-1） |
| `ExerciseStatsCard.tsx` 実装（`ExerciseConsecutiveItem` 内包） | ✅ |
| `ExerciseStatsContainer.tsx` 実装（エラー Toast 対応） | ✅ |
| `DashboardPage.tsx` に追加 | ✅ |
| `frequencies` 空のとき「記録がありません」表示 | ✅ |
| 連続回数 `0` のとき連続表示を省略 | ✅ |
| `any` / `as` / `enum` 不使用 | ✅ |
| `interface` でオブジェクト型を定義 | ✅ |

---

## 良かった点

- 設計書の疑似コードに忠実で、構造が予測しやすい
- `useStreakInfo` / `StreakInfoContainer` / `StreakInfoCard` と同じ温度感で統一されている
- `QueryExerciseFrequency` 型を生成型から `[number]` 派生で取り出しており、スキーマ変化に追従できる
- `EMPTY_FREQUENCIES` 定数で空配列の参照を安定させており、不要な再レンダリングを防いでいる
- `ExerciseConsecutiveItem` の Apollo 例外使用が設計書で明示的に許容され、責務が明確
- `shouldShowConsecutive` で連続回数 `0` 時の省略が正しく実装されている
- `barPercent` の `sessionCount > 0` ガードで将来の可変化に備えている
