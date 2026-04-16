# 設計書 — ダッシュボード（フェーズ3）

Codex への実装計画依頼用ドキュメント。

---

## 1. 概要

`/`（DashboardPage）にストリーク情報とトレーニングカレンダーを実装する。

### 表示内容

| セクション | 表示項目 |
|---|---|
| ストリーク | 現在の連続日数・最長連続記録・今月の実施日数 |
| カレンダー | 月単位・トレーニング実施日をマーク・実施日クリックで詳細へ遷移 |

---

## 2. 使用する GraphQL API

バックエンドは実装済み。フロントの `.graphql` オペレーションファイルが未作成なので新規追加が必要。

### `streakInfo` Query

```graphql
type StreakInfo {
  currentStreak: Int!
  longestStreak: Int!
  thisMonthCount: Int!
  totalCount: Int!
}
```

### `trainingDaysInMonth` Query

```graphql
type TrainingDay {
  date: Date!        # YYYY-MM-DD
  exerciseCount: Int!
}

query TrainingDaysInMonth(year: Int!, month: Int!): [TrainingDay!]!
```

---

## 3. アーキテクチャ（3層）

```
DashboardPage
  ├── StreakInfoContainer    ← useStreakInfo フック
  │     └── StreakInfoCard   ← Presentational
  └── TrainingCalendarContainer ← useTrainingDaysInMonth フック + 月ナビ状態
        └── TrainingCalendar     ← Presentational（react-day-picker ラップ）
```

### 層の責務

| 層 | ファイル | 責務 |
|---|---|---|
| Page | `pages/DashboardPage.tsx` | Container を並べるだけ |
| Container | `containers/StreakInfoContainer.tsx` | Hook 呼び出し・エラー処理 |
| Container | `containers/TrainingCalendarContainer.tsx` | Hook 呼び出し・月状態管理・詳細遷移 |
| Hook | `hooks/useStreakInfo.ts` | `streakInfo` Query ラップ |
| Hook | `hooks/useTrainingDaysInMonth.ts` | `trainingDaysInMonth` Query ラップ |
| Component | `components/shared/dashboard/StreakInfoCard.tsx` | ストリーク表示（props のみ） |
| Component | `components/shared/dashboard/TrainingCalendar.tsx` | カレンダー表示（props のみ） |

---

## 4. インターフェース定義

### `useStreakInfo` の返却型

```ts
interface UseStreakInfoResult {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly thisMonthCount: number;
  readonly loading: boolean;
  readonly error: Error | undefined;
}
```

### `useTrainingDaysInMonth` の返却型

```ts
interface UseTrainingDaysInMonthResult {
  readonly trainingDays: readonly TrainingDay[];  // { date: string; exerciseCount: number }
  readonly loading: boolean;
  readonly error: Error | undefined;
}
```

### `TrainingCalendarContainer` の内部状態

```ts
// 月ナビ用状態（Container 内で管理）
const [year, setYear] = useState<number>(currentYear);
const [month, setMonth] = useState<number>(currentMonth); // 1-12
```

### `StreakInfoCard` の props

```ts
interface StreakInfoCardProps {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly thisMonthCount: number;
  readonly loading: boolean;
}
```

### `TrainingCalendar` の props

```ts
interface TrainingCalendarProps {
  readonly year: number;
  readonly month: number;                          // 1-12
  readonly trainingDays: readonly TrainingDay[];
  readonly loading: boolean;
  readonly onMonthChange: (year: number, month: number) => void;
  readonly onDayClick: (date: string) => void;     // YYYY-MM-DD
}
```

---

## 5. 追加するファイル一覧

| パス | 新規/変更 | 内容 |
|---|---|---|
| `frontend/src/graphql/operations/dashboard.graphql` | 新規 | StreakInfo・TrainingDaysInMonth クエリ定義 |
| `frontend/src/hooks/useStreakInfo.ts` | 新規 | streakInfo Query フック |
| `frontend/src/hooks/useTrainingDaysInMonth.ts` | 新規 | trainingDaysInMonth Query フック |
| `frontend/src/components/shared/dashboard/StreakInfoCard.tsx` | 新規 | ストリーク表示 Presentational |
| `frontend/src/components/shared/dashboard/TrainingCalendar.tsx` | 新規 | カレンダー表示 Presentational |
| `frontend/src/containers/StreakInfoContainer.tsx` | 新規 | ストリーク Container |
| `frontend/src/containers/TrainingCalendarContainer.tsx` | 新規 | カレンダー Container |
| `frontend/src/pages/DashboardPage.tsx` | 変更 | プレースホルダー → Container を並べる実装に差し替え |

---

## 6. react-day-picker の導入

**未インストール**（package.json に記載なし）。実装前に追加が必要。

```bash
npm install react-day-picker
```

- バージョン: v9 系（React 18 対応）
- Tailwind でのスタイル上書き: `classNames` prop を使用
- トレーニングあり日のマーク: `modifiers` / `modifiersClassNames` prop を使用

---

## 7. 日付の扱い方針

- API から返る `date` は `YYYY-MM-DD` 文字列（UTC）
- カレンダーへの渡し方: `date` 文字列を `new Date(date + 'T00:00:00')` でローカル日付として生成（タイムゾーンずれ防止）
- カレンダーの `onDayClick` は `Date` オブジェクトを受け取るので、`YYYY-MM-DD` に変換して `useNavigate` で `/sessions?date=YYYY-MM-DD` または `trainingSessionByDate` 経由で詳細に遷移

### 遷移先の仕様（確定）

実施日クリック時は `/sessions`（一覧ページ）へ遷移するのみ。

- `trainingSessionByDate` は呼ばない
- クエリパラメータも不要
- `TrainingCalendar` の `onDayClick` コールバックで `navigate('/sessions')` を呼ぶ

---

## 8. エラー・ローディング方針

- ローディング中: スケルトンまたはスピナー（既存の `TrainingDetailView` と同パターン）
- エラー発生時: `useEffect` で `showToast(error.message, 'error')` （既存 Container と同パターン）
- ストリーク・カレンダーはそれぞれ独立した Container なので、片方のエラーが片方に影響しない

---

## 9. GraphQL codegen の再実行

`dashboard.graphql` 追加後、codegen を実行して型を生成する。

```bash
cd frontend && npm run codegen
```

---

## 10. スコープ外（MVP3 では実装しない）

- `recentExerciseFrequency` / `exerciseConsecutiveCount`（種目統計）→ フェーズ5
- ストリーク計算ロジックの変更（バックエンドで完結）
- プッシュ通知・アラート

---

## 11. 参照ファイル（既存）

| ファイル | 参照目的 |
|---|---|
| `backend/src/graphql/schema.graphql` | StreakInfo・TrainingDay 型の確認 |
| `frontend/src/hooks/useTrainingSessionDetail.ts` | Query フックの実装パターン |
| `frontend/src/containers/TrainingDetailContainer.tsx` | Container の実装パターン（エラー Toast・NotFound 分岐） |
| `frontend/src/containers/TrainingListContainer.tsx` | Container の実装パターン |
| `frontend/src/components/shared/training/trainingDetailView.tsx` | ローディング・エラー表示パターン |
| `frontend/src/graphql/operations/trainingSessions.graphql` | Query オペレーション定義の書き方 |
