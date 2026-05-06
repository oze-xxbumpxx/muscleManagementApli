# 成長グラフ レビュー修正方針

`docs/REVIEW_EXERCISE_HISTORY.md` のレビュー結果をもとに、どこが問題で、どう直すかを実装者向けに整理する。

---

## 1. 修正の全体方針

今回のレビューで必須修正になっているのは、主に次の4点。

| 優先度 | 指摘 | 修正対象 |
|---|---|---|
| Critical | Props 型名タイポ | `ExerciseHistoryChart.tsx` |
| Critical | ファイル配置が設計書と不一致 | `ExerciseHistoryChart.tsx` と import パス |
| Critical | 型専用 import が `import type` になっていない | `useExerciseHistory.ts` / `ExerciseHistoryChart.tsx` / `ExerciseHistoryContainer.tsx` |
| Critical | `durationSeconds` を含むだけで weight/reps も無効化している | `ExerciseHistoryContainer.tsx` |

MVP1 では `durationSeconds` のグラフ表示は対象外。  
ただし、設計書上は「時間ベースだけの種目はグラフ不可」であり、「時間データが1件でも混ざったら weight/reps もすべて非表示」ではない。

---

## 2. C-1 Props 型名タイポ

### 何がいけないか

`ExerciseHistoryChart.tsx` で Props 型名が `ExerciseHistroyChartProps` になっている。

```ts
export interface ExerciseHistroyChartProps {
```

`History` が `Histroy` になっており、設計書の `ExerciseHistoryChartProps` と一致しない。  
動作には大きく影響しないが、検索性・可読性・設計書との整合性が落ちる。

### どう直すか

型名を `ExerciseHistoryChartProps` に変更し、関数引数の型も合わせる。

```ts
export interface ExerciseHistoryChartProps {
  readonly entries: readonly ExerciseHistoryEntry[];
  readonly mode: ChartMode;
  readonly onModeChange: (mode: ChartMode) => void;
  readonly hasWeightData: boolean;
  readonly hasRepsData: boolean;
  readonly loading: boolean;
  readonly error: Error | undefined;
}

export function ExerciseHistoryChart(props: ExerciseHistoryChartProps): React.JSX.Element {
  // ...
}
```

---

## 3. C-2 ファイル配置パス不一致

### 何がいけないか

設計書では以下の配置を想定している。

```text
frontend/src/components/shared/exercise/ExerciseHistoryChart.tsx
```

現在の実装は以下。

```text
frontend/src/components/exercise/ExerciseHistoryChart.tsx
```

このプロジェクトでは、ダッシュボード系の共有 UI は `components/shared/...` に置いている。  
設計書と実装がズレると、後から探しづらくなり、同じ種類のコンポーネントの置き場が分散する。

### どう直すか

推奨は、コード側を設計書に合わせること。

1. ディレクトリを作成する

```text
frontend/src/components/shared/exercise/
```

2. ファイルを移動する

```text
frontend/src/components/exercise/ExerciseHistoryChart.tsx
↓
frontend/src/components/shared/exercise/ExerciseHistoryChart.tsx
```

3. Container 側の import を変更する

修正前:

```ts
import { ExerciseHistoryChart } from '@/components/exercise/ExerciseHistoryChart';
```

修正後:

```ts
import { ExerciseHistoryChart } from '@/components/shared/exercise/ExerciseHistoryChart';
```

### 注意

もし `components/exercise/` 配置を正式採用するなら、設計書側を修正する。  
ただし今回は既存の `components/shared/dashboard/...` と揃えるため、`shared/exercise` へ移動する方が自然。

---

## 4. C-3 `import type` の不足

### 何がいけないか

型としてしか使わない import が通常 import になっている。  
プロジェクト規約上、型専用 import は `import type` に分ける。

### どう直すか

#### `frontend/src/hooks/useExerciseHistory.ts`

修正前:

```ts
import { ExerciseHistoryDocument, ExerciseHistoryQuery } from '@/graphql/generated/graphql';
```

修正後:

```ts
import { ExerciseHistoryDocument } from '@/graphql/generated/graphql';
import type { ExerciseHistoryQuery } from '@/graphql/generated/graphql';
```

#### `frontend/src/components/shared/exercise/ExerciseHistoryChart.tsx`

修正前:

```ts
import { ChartMode, ExerciseHistoryEntry } from '@/hooks/useExerciseHistory';
```

修正後:

```ts
import type { ChartMode, ExerciseHistoryEntry } from '@/hooks/useExerciseHistory';
```

#### `frontend/src/containers/ExerciseHistoryContainer.tsx`

修正前:

```ts
import { ChartMode, useExerciseHistory } from '@/hooks/useExerciseHistory';
```

修正後:

```ts
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import type { ChartMode } from '@/hooks/useExerciseHistory';
```

---

## 5. C-4 `durationSeconds` 強制無効化

### 何がいけないか

現在の実装では、履歴に `durationSeconds` が1件でも含まれると、`weight` / `reps` の有無に関係なく両方を false にしている。

```ts
const hasDuration = hasDurationData(entries);
const hasWeight = hasDuration ? false : hasWeightData(entries);
const hasReps = hasDuration ? false : hasRepsData(entries);
```

これだと、たとえば同じ種目名で以下のような履歴がある場合に問題になる。

| 日付 | weight | reps | durationSeconds |
|---|---:|---:|---:|
| 2026-05-01 | null | 10 | null |
| 2026-05-02 | null | null | 60 |

`reps` データが存在するにもかかわらず、`durationSeconds` が1件あるだけで回数グラフも消えてしまう。

### 設計上の正しい扱い

MVP1 では `durationSeconds` グラフは対象外。  
ただし、`weight` または `reps` が存在するなら、それらのグラフは表示してよい。

つまり表示判定は次のようにする。

| データ状態 | 表示 |
|---|---|
| weight あり | 重量タブを表示 |
| reps あり | 回数タブを表示 |
| durationSeconds のみ | グラフ不可メッセージ |
| weight/reps/durationSeconds すべてなし | グラフ不可メッセージ |

### どう直すか

`hasDurationData` と `hasDuration` による強制無効化を削除し、`hasWeightData` / `hasRepsData` の結果をそのまま使う。

修正前:

```ts
function hasDurationData(entries: readonly { readonly durationSeconds: number | null }[]): boolean {
  return entries.some(entry => entry.durationSeconds !== null);
}

const hasDuration = hasDurationData(entries);
const hasWeight = hasDuration ? false : hasWeightData(entries);
const hasReps = hasDuration ? false : hasRepsData(entries);
```

修正後:

```ts
const hasWeight = hasWeightData(entries);
const hasReps = hasRepsData(entries);
```

`ExerciseHistoryChart` 側にはすでに以下の分岐があるため、`durationSeconds` のみの種目はここでグラフ不可になる。

```tsx
if (!props.hasWeightData && !props.hasRepsData) {
  return <p className="text-slate-600">グラフ表示できる重量・回数の記録がありません</p>;
}
```

### 補足

以前の暫定対応では「duration が1件でも含まれる種目は非表示」としていた。  
これは安全側ではあるが、レビュー基準および設計書とはズレる。  
レビューを通す方針なら、「duration のみ非表示、weight/reps がある場合は表示」に戻す。

---

## 6. W-1 mode 補正 `useEffect` の return 追加

### 何がいけないか

現在は `setMode('reps')` 後に `return` がない。

```ts
if (mode === 'weight' && !hasWeight && hasReps) {
  setMode('reps');
}
```

今の条件では同時に次の分岐へ入る可能性は低いが、将来 `durationSeconds` モードなどが追加されると分岐事故が起きやすい。

### どう直すか

```ts
if (mode === 'weight' && !hasWeight && hasReps) {
  setMode('reps');
  return;
}

if (mode === 'reps' && !hasReps && hasWeight) {
  setMode('weight');
  return;
}
```

---

## 7. W-2 表記ゆれ

### 何がいけないか

説明文では `重量（kg）`、ボタンでは `重量(kg)` になっている。  
見た目の統一感が落ちる。

### どう直すか

半角括弧に統一する。

```ts
function getModeLabel(mode: ChartMode): string {
  return mode === 'weight' ? '重量(kg)' : '回数';
}
```

---

## 8. W-3 状態表示時のカード枠

### 何がいけないか

loading / error / empty 時に `<p>` だけ返している。

```tsx
if (props.loading) {
  return <p className="text-slate-600">読み込み中...</p>;
}
```

通常表示時はカード枠があるのに、状態表示時だけカード枠が消える。  
そのため、読み込み中やエラー時に画面の見た目が揺れる。

### どう直すか

共通の状態表示ラッパーを作ると見通しがよい。

```tsx
function ExerciseHistoryChartMessage(props: { readonly message: string }): React.JSX.Element {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-slate-600">{props.message}</p>
    </section>
  );
}
```

状態分岐ではそれを使う。

```tsx
if (props.loading) {
  return <ExerciseHistoryChartMessage message="読み込み中..." />;
}

if (props.error !== undefined) {
  return <ExerciseHistoryChartMessage message="データを取得できませんでした。" />;
}

if (props.entries.length === 0) {
  return <ExerciseHistoryChartMessage message="記録がありません" />;
}

if (!props.hasWeightData && !props.hasRepsData) {
  return <ExerciseHistoryChartMessage message="グラフ表示できる重量・回数の記録がありません" />;
}
```

---

## 9. 任意対応

### I-1 Tooltip の日付表示

X 軸は `MM/DD` だが、Tooltip は `YYYY-MM-DD` のまま。  
揃えるなら以下にする。

```tsx
<Tooltip labelFormatter={label => formatDateLabel(String(label))} />
```

### I-2 decode 失敗時のログ

URL デコード失敗時に原因を追いやすくするなら、`console.warn` を追加する。

```ts
try {
  return decodeURIComponent(name);
} catch (error) {
  console.warn('decodeURIComponent failed', error);
  return name;
}
```

---

## 10. 修正後の確認観点

### コマンド

```bash
cd frontend
npm run build
```

必要に応じて GraphQL operation を触った場合のみ、先に codegen を行う。

```bash
cd frontend
npm run codegen
```

### 画面確認

| ケース | 期待結果 |
|---|---|
| weight のみ存在 | 重量タブだけ表示され、グラフが出る |
| reps のみ存在 | 回数タブだけ表示され、グラフが出る |
| weight と reps が存在 | 重量・回数タブが表示され、切替できる |
| durationSeconds のみ存在 | グラフ不可メッセージがカード枠内に出る |
| reps と durationSeconds が混在 | 回数タブは表示される |
| weight と durationSeconds が混在 | 重量タブは表示される |
| データ0件 | `記録がありません` がカード枠内に出る |
| APIエラー | `データを取得できませんでした。` と Toast が出る |

---

## 11. 推奨修正順

1. `ExerciseHistoryChartProps` のタイポ修正
2. `ExerciseHistoryChart.tsx` を `components/shared/exercise/` に移動
3. import パスと `import type` を修正
4. `durationSeconds` による `hasWeight` / `hasReps` 強制 false を削除
5. mode 補正 `useEffect` に `return` を追加
6. 表記ゆれを修正
7. 状態表示をカード枠で包む
8. `npm run build` と画面確認
