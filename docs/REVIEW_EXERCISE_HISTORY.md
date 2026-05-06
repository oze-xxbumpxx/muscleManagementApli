# コードレビュー: 成長グラフ（フェーズ6）

**対象**: `ExerciseHistoryPage` / `ExerciseHistoryContainer` / `useExerciseHistory` / `ExerciseHistoryChart`  
**レビュー日**: 2026-05-06  
**設計書**: `docs/DESIGN_EXERCISE_HISTORY.md`

---

## サマリー

設計書の主要要件は概ね満たされており、3層分離・Recharts の使い方・null データ点の扱い・空状態ハンドリングなど丁寧な実装。  
**必須修正は4件**（タイポ・ファイル配置・import type 欠落・duration 強制無効化バグ）。

---

## 🔴 Critical（マージ前に必須修正）

### C-1. Props 型名タイポ `ExerciseHistroyChartProps`

**対象ファイル**: `frontend/src/components/exercise/ExerciseHistoryChart.tsx`

**問題**  
`ExerciseHistroyChartProps`（Histroy）と綴りが誤っている。設計書では `ExerciseHistoryChartProps`。

**修正**
```ts
export interface ExerciseHistoryChartProps { ... }
export function ExerciseHistoryChart(props: ExerciseHistoryChartProps): React.JSX.Element { ... }
```

---

### C-2. ファイル配置パスが設計書と不一致

**対象ファイル**: `frontend/src/components/exercise/ExerciseHistoryChart.tsx`

**問題**  
設計書 §3・§4・§8 はいずれも `components/shared/exercise/ExerciseHistoryChart.tsx` を指定。実装は `components/exercise/` に置かれており、ダッシュボード系（`shared/dashboard/`）との配置規約が崩れる。

**修正方針**（どちらか選択）
- **コードを直す**（推奨）: `frontend/src/components/shared/exercise/` に移動し、Container 側の import パスも更新
- **設計書を直す**: 設計書 §3/§4/§8 の全 `shared/exercise/` を `exercise/` に変更

いずれかで必ず揃える。

---

### C-3. `import type` が型専用 import に使われていない（規約違反）

**対象ファイル**: 以下の3ファイル

**問題**  
型としてのみ使われているのに `import type` が使われていない。Google TypeScript Style Guide・プロジェクト規約に反する。

**修正**
```ts
// useExerciseHistory.ts
import { ExerciseHistoryDocument } from '@/graphql/generated/graphql';
import type { ExerciseHistoryQuery } from '@/graphql/generated/graphql';

// ExerciseHistoryChart.tsx
import type { ChartMode, ExerciseHistoryEntry } from '@/hooks/useExerciseHistory';

// ExerciseHistoryContainer.tsx
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import type { ChartMode } from '@/hooks/useExerciseHistory';
```

---

### C-4. `hasDuration` による weight/reps 強制無効化が仕様逸脱

**対象ファイル**: `frontend/src/containers/ExerciseHistoryContainer.tsx`

**問題**  
1件でも `durationSeconds !== null` のエントリがあると、他のエントリに weight/reps が記録されていても両タブが消えて「グラフ表示できません」になる。

```ts
// 現状（バグ）
const hasDuration = hasDurationData(entries);
const hasWeight = hasDuration ? false : hasWeightData(entries);
const hasReps = hasDuration ? false : hasRepsData(entries);
```

**設計書の仕様**（§6・§12・§15）  
「weight/reps が **全 null** のときだけタブを隠す」。`durationSeconds` を持つ種目でも weight/reps が記録されていればグラフを描くべき。時間ベース種目「**だけ**」（weight/reps が全 null）の場合に表示不可メッセージを出す。

**修正**
```ts
// duration ガードを削除
const hasWeight = hasWeightData(entries);
const hasReps = hasRepsData(entries);
```

Chart 側の `!hasWeightData && !hasRepsData` 分岐が「どちらも null 一色の時」を正しく処理するため、Container での duration による強制無効は不要。

---

## 🟡 Warning（推奨修正）

### W-1. mode 補正 `useEffect` の `return` が抜けている

**対象ファイル**: `frontend/src/containers/ExerciseHistoryContainer.tsx`

**問題**  
設計書サンプルでは `setMode('reps'); return;` と明示的にガードしているが、実装では `return` が抜けている。現状は両分岐が同時に真になることはないため動作差はないが、将来条件が増えると事故りやすい。

**修正**
```ts
if (mode === 'weight' && !hasWeight && hasReps) {
  setMode('reps');
  return;
}
if (mode === 'reps' && !hasReps && hasWeight) {
  setMode('weight');
}
```

---

### W-2. `getModeLabel` とボタン表記が表記ゆれ

**対象ファイル**: `frontend/src/components/exercise/ExerciseHistoryChart.tsx`

**問題**  
`getModeLabel('weight')` は `'重量（kg）'`（全角括弧）、ボタンは `重量(kg)`（半角括弧）で表記が混在している。

**修正**: 半角括弧に統一
```ts
function getModeLabel(mode: ChartMode): string {
  return mode === 'weight' ? '重量(kg)' : '回数';
}
```

---

### W-3. ローディング/エラー時に `<section>` ラッパーが消えてレイアウトが揺れる

**対象ファイル**: `frontend/src/components/exercise/ExerciseHistoryChart.tsx`

**問題**  
loading / error / empty 時は `<p>` のみを返すためカード枠が消え、ページ上でレイアウトが崩れる。

**修正案**: 状態分岐時も `<section>` で囲む
```tsx
if (props.loading) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-slate-600">読み込み中...</p>
    </section>
  );
}
// error / empty も同様
```

---

## 🔵 Info（任意対応）

### I-1. Tooltip の日付が ISO 形式のまま表示される

**対象ファイル**: `frontend/src/components/exercise/ExerciseHistoryChart.tsx`

X 軸は `MM/DD` 形式に整形しているが、Tooltip のラベルが `2025-04-29` のまま。

**修正案**
```tsx
<Tooltip labelFormatter={(label) => formatDateLabel(String(label))} />
```

---

### I-2. `decodeURIComponent` 失敗時のログ追加（任意）

**対象ファイル**: `frontend/src/pages/ExerciseHistoryPage.tsx`

```ts
} catch (e) {
  console.warn('decodeURIComponent failed', e);
  return name;
}
```

---

## 実装チェックリスト充足状況

| チェック項目 | 状態 |
|---|---|
| `recharts` インストール | ✅ |
| `exercises.graphql` 新規作成 | ✅ |
| `npm run codegen` 実施 | ✅ |
| `useExerciseHistory.ts` 実装（`UseExerciseHistoryResult` export） | ✅ |
| `ExerciseHistoryChart.tsx` 実装 | ⚠️ タイポ・配置・import type（C-1〜C-3） |
| `ExerciseHistoryContainer.tsx` 実装（切替 useState・Toast） | ✅ |
| `ExerciseHistoryPage.tsx` 差し替え | ✅ |
| weight 全 null 時 weight タブ非表示 | ✅ |
| reps 全 null 時 reps タブ非表示 | ✅ |
| entries 0 件で「記録がありません」 | ✅ |
| durationSeconds のみで「グラフ不可」 | ⚠️ 過剰実装（C-4：weight/reps がある場合も消えてしまう） |
| `any`/`as`/`enum` 不使用 | ✅ |
| `interface` でオブジェクト型定義 | ✅ |

---

## 良かった点

- **3層分離が守られている** — Chart は Apollo / useToast を一切持たず、Container だけがデータ取得と状態を管理
- **Recharts の正しい使い方** — `ResponsiveContainer`・`connectNulls={false}`・`type="monotone"` が設計書の注意点を押さえている
- **`any`/`as`/`enum` の不使用** — 型安全方針を完全に守れている
- **純粋関数への切り出し** — `toChartPoint`・`formatDateLabel`・`getModeLabel`・`hasWeightData`・`hasRepsData` と分離されており、テスト容易性が高い
- **`EMPTY_ENTRIES` 定数化** — 参照同一性を保ち、useEffect の無限再レンダリングを防ぐ設計
- **アクセシビリティ配慮** — `aria-labelledby`・`aria-label`・グラフの代替説明文が Recharts の補完として機能
- **URL デコードの `try/catch`** — `URIError` を適切に捕捉し、画面クラッシュを防止
- **`skip` 制御** — 種目名が空の場合は API を呼ばない実装

---

## 修正優先度サマリー

| 優先度 | 項目 | 影響 |
|---|---|---|
| 🔴 必須 | C-1 タイポ | 命名一貫性 |
| 🔴 必須 | C-2 ファイル配置 | アーキテクチャ整合性 |
| 🔴 必須 | C-3 `import type` | 規約準拠 |
| 🔴 必須 | C-4 duration 強制無効化 | 仕様バグ（weight/reps のあるセッションでもグラフが出ない） |
| 🟡 推奨 | W-1 `return` 欠落 | 将来の事故防止 |
| 🟡 推奨 | W-2 表記ゆれ | UX 一貫性 |
| 🟡 推奨 | W-3 ローディング時のレイアウト | UX 安定性 |
