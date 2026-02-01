# API仕様書

muscleManagementApli - GraphQL API Specification

---

## 概要

### エンドポイント

| 環境 | URL |
|------|-----|
| 開発 | `http://localhost:4000/graphql` |
| 本番 | TBD |

### 認証

MVP1では認証なし（個人利用のため）

### レスポンス形式

```json
{
  "data": { ... },
  "errors": [ ... ]  // エラー時のみ
}
```

---

## スカラー型

### Date

日付を表すカスタムスカラー型

- **形式**: `YYYY-MM-DD`（ISO 8601 日付部分）
- **例**: `"2026-01-29"`
- **バリデーション**: 正規表現 `/^\d{4}-\d{2}-\d{2}$/`
- **実装**: `graphql-scalars` ライブラリ使用

### DateTime

日時を表すカスタムスカラー型

- **形式**: `YYYY-MM-DDTHH:mm:ss.sssZ`（ISO 8601）
- **例**: `"2026-01-29T10:30:00.000Z"`
- **実装**: `graphql-scalars` ライブラリ使用

---

## 型定義

### TrainingSession

トレーニングセッション（日付単位の記録）

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| id | ID! | No | 一意識別子 |
| date | Date! | No | トレーニング実施日 |
| bodyWeight | Float | Yes | 体重（kg） |
| notes | String | Yes | メモ・備考 |
| exercises | [Exercise!]! | No | 実施した種目一覧 |
| createdAt | DateTime! | No | 作成日時 |
| updatedAt | DateTime! | No | 更新日時 |

### Exercise

エクササイズ（種目の詳細）

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| id | ID! | No | 一意識別子 |
| exerciseName | String! | No | 種目名 |
| weight | Float | Yes | 加重（kg）※自重の場合はnull |
| reps | Int | Yes | 回数 ※時間ベースの場合はnull |
| durationSeconds | Int | Yes | 継続時間（秒）※回数ベースの場合はnull |
| sets | Int! | No | セット数（1以上） |
| order | Int! | No | 実施順序 |
| notes | String | Yes | メモ・備考 |
| createdAt | DateTime! | No | 作成日時 |
| updatedAt | DateTime! | No | 更新日時 |

**バリデーションルール**:

- `reps` または `durationSeconds` のどちらか1つは必須（排他的）
- `sets` は1以上

### ExerciseHistory

種目の履歴（成長グラフ用）

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| date | Date! | No | 実施日 |
| exerciseName | String! | No | 種目名 |
| weight | Float | Yes | 加重（kg） |
| reps | Int | Yes | 回数 |
| durationSeconds | Int | Yes | 継続時間（秒） |
| sets | Int! | No | セット数 |
| bodyWeight | Float | Yes | その日の体重 |

### ExerciseFrequency

種目の出現回数

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| exerciseName | String! | No | 種目名 |
| count | Int! | No | 出現回数 |

### StreakInfo

ストリーク情報（継続可視化）

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| currentStreak | Int! | No | 現在の連続日数 |
| longestStreak | Int! | No | 最長連続日数 |
| thisMonthCount | Int! | No | 今月のトレーニング回数 |
| totalCount | Int! | No | 総トレーニング回数 |

### TrainingDay

カレンダー用のトレーニング日データ

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| date | Date! | No | トレーニング実施日 |
| exerciseCount | Int! | No | その日の種目数 |

### DeleteResult

削除操作の結果

| フィールド | 型 | Null許容 | 説明 |
|-----------|-----|---------|------|
| success | Boolean! | No | 削除成功フラグ |
| deletedId | ID! | No | 削除されたリソースのID |

---

## Query

### trainingSessions

トレーニングセッション一覧を取得（日付降順）

**引数**:

| 引数 | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| limit | Int | 20 | 取得件数 |
| offset | Int | 0 | スキップ件数 |

**戻り値**: `[TrainingSession!]!`

**使用例**:

```graphql
query GetTrainingSessions {
  trainingSessions(limit: 10, offset: 0) {
    id
    date
    bodyWeight
    exercises {
      exerciseName
      reps
      sets
    }
  }
}
```

---

### trainingSession

特定のトレーニングセッションを取得

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| id | ID! | Yes | セッションID |

**戻り値**: `TrainingSession`（存在しない場合はnull）

**使用例**:

```graphql
query GetTrainingSession($id: ID!) {
  trainingSession(id: $id) {
    id
    date
    bodyWeight
    notes
    exercises {
      id
      exerciseName
      weight
      reps
      durationSeconds
      sets
      order
      notes
    }
  }
}
```

---

### trainingSessionByDate

日付でトレーニングセッションを取得

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| date | Date! | Yes | 日付（YYYY-MM-DD） |

**戻り値**: `TrainingSession`（存在しない場合はnull）

**使用例**:

```graphql
query GetSessionByDate {
  trainingSessionByDate(date: "2026-01-29") {
    id
    exercises {
      exerciseName
    }
  }
}
```

---

### exerciseHistory

種目の履歴を取得（成長グラフ用）

**引数**:

| 引数 | 型 | 必須 | デフォルト | 説明 |
|------|-----|-----|----------|------|
| exerciseName | String! | Yes | - | 種目名 |
| limit | Int | No | 30 | 取得件数 |

**戻り値**: `[ExerciseHistory!]!`

**使用例**:

```graphql
query GetExerciseHistory {
  exerciseHistory(exerciseName: "プッシュアップ", limit: 30) {
    date
    reps
    sets
    bodyWeight
  }
}
```

---

### recentExerciseFrequency

直近N回のトレーニングで実施した種目の頻度

**引数**:

| 引数 | 型 | デフォルト | 説明 |
|------|-----|----------|------|
| sessionCount | Int | 5 | 対象セッション数 |

**戻り値**: `[ExerciseFrequency!]!`（出現回数降順）

**使用例**:

```graphql
query GetRecentExercises {
  recentExerciseFrequency(sessionCount: 5) {
    exerciseName
    count
  }
}
```

**レスポンス例**:

```json
{
  "data": {
    "recentExerciseFrequency": [
      { "exerciseName": "プッシュアップ", "count": 4 },
      { "exerciseName": "スクワット", "count": 3 },
      { "exerciseName": "プランク", "count": 2 }
    ]
  }
}
```

---

### exerciseConsecutiveCount

特定種目の連続実施回数を取得

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| exerciseName | String! | Yes | 種目名 |

**戻り値**: `Int!`

**使用例**:

```graphql
query GetConsecutiveCount {
  exerciseConsecutiveCount(exerciseName: "プッシュアップ")
}
```

---

### streakInfo

ストリーク情報を取得

**引数**: なし

**戻り値**: `StreakInfo!`

**使用例**:

```graphql
query GetStreakInfo {
  streakInfo {
    currentStreak
    longestStreak
    thisMonthCount
    totalCount
  }
}
```

---

### trainingDaysInMonth

指定月のトレーニング日一覧を取得（カレンダー用）

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| year | Int! | Yes | 年（例: 2026） |
| month | Int! | Yes | 月（1-12） |

**戻り値**: `[TrainingDay!]!`

**使用例**:

```graphql
query GetTrainingDays {
  trainingDaysInMonth(year: 2026, month: 1) {
    date
    exerciseCount
  }
}
```

---

### exerciseNames

全種目名の一覧を取得（オートコンプリート用）

**引数**: なし

**戻り値**: `[String!]!`

**使用例**:

```graphql
query GetExerciseNames {
  exerciseNames
}
```

---

## Mutation

### createTrainingSession

トレーニングセッションを作成（エクササイズも同時作成）

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| input | CreateTrainingSessionInput! | Yes | 作成データ |

**CreateTrainingSessionInput**:

```graphql
input CreateTrainingSessionInput {
  date: Date!                          # トレーニング日
  bodyWeight: Float                    # 体重（任意）
  notes: String                        # メモ（任意）
  exercises: [CreateExerciseInput!]!   # 種目一覧（1件以上）
}

"""
エクササイズ入力
注意: reps と durationSeconds は排他的（どちらか1つのみ指定）
"""
input CreateExerciseInput {
  exerciseName: String!    # 種目名
  weight: Float            # 加重（任意、自重の場合は省略）
  reps: Int                # 回数（回数ベース種目の場合に指定）
  durationSeconds: Int     # 継続時間（秒、時間ベース種目の場合に指定）
  sets: Int!               # セット数（1以上）
  order: Int               # 順序（省略時は自動採番）
  notes: String            # メモ（任意）
}
# ※ reps または durationSeconds のどちらか1つは必須
```

**戻り値**: `TrainingSession!`

**使用例**:

```graphql
mutation CreateSession($input: CreateTrainingSessionInput!) {
  createTrainingSession(input: $input) {
    id
    date
    exercises {
      id
      exerciseName
    }
  }
}
```

**変数例**:

```json
{
  "input": {
    "date": "2026-01-29",
    "bodyWeight": 65.5,
    "notes": "調子良かった",
    "exercises": [
      {
        "exerciseName": "プッシュアップ",
        "reps": 20,
        "sets": 3
      },
      {
        "exerciseName": "プランク",
        "durationSeconds": 60,
        "sets": 3
      }
    ]
  }
}
```

---

### updateTrainingSession

トレーニングセッションの基本情報を更新

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| id | ID! | Yes | セッションID |
| input | UpdateTrainingSessionInput! | Yes | 更新データ |

**UpdateTrainingSessionInput**:

```graphql
input UpdateTrainingSessionInput {
  date: Date          # 日付（変更時は重複チェックあり）
  bodyWeight: Float   # 体重
  notes: String       # メモ
}
```

**戻り値**: `TrainingSession!`

**使用例**:

```graphql
mutation UpdateSession($id: ID!, $input: UpdateTrainingSessionInput!) {
  updateTrainingSession(id: $id, input: $input) {
    id
    bodyWeight
    notes
  }
}
```

---

### deleteTrainingSession

トレーニングセッションを削除（関連エクササイズも削除）

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| id | ID! | Yes | セッションID |

**戻り値**: `DeleteResult!`

**DeleteResult**:

```graphql
type DeleteResult {
  success: Boolean!   # 削除成功フラグ
  deletedId: ID!      # 削除されたリソースのID
}
```

**使用例**:

```graphql
mutation DeleteSession($id: ID!) {
  deleteTrainingSession(id: $id) {
    success
    deletedId
  }
}
```

---

### addExercise

既存セッションにエクササイズを追加

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| trainingSessionId | ID! | Yes | セッションID |
| input | CreateExerciseInput! | Yes | エクササイズデータ |

**戻り値**: `Exercise!`

**使用例**:

```graphql
mutation AddExercise($sessionId: ID!, $input: CreateExerciseInput!) {
  addExercise(trainingSessionId: $sessionId, input: $input) {
    id
    exerciseName
    order
  }
}
```

---

### updateExercise

エクササイズを更新

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| id | ID! | Yes | エクササイズID |
| input | UpdateExerciseInput! | Yes | 更新データ |

**UpdateExerciseInput**:

```graphql
input UpdateExerciseInput {
  exerciseName: String
  weight: Float
  reps: Int
  durationSeconds: Int
  sets: Int
  notes: String
}
```

**戻り値**: `Exercise!`

**使用例**:

```graphql
mutation UpdateExercise($id: ID!, $input: UpdateExerciseInput!) {
  updateExercise(id: $id, input: $input) {
    id
    exerciseName
    reps
    sets
  }
}
```

---

### deleteExercise

エクササイズを削除

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| id | ID! | Yes | エクササイズID |

**戻り値**: `DeleteResult!`

**使用例**:

```graphql
mutation DeleteExercise($id: ID!) {
  deleteExercise(id: $id) {
    success
    deletedId
  }
}
```

---

### reorderExercises

エクササイズの並び順を更新

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|-----|------|
| trainingSessionId | ID! | Yes | セッションID |
| exerciseIds | [ID!]! | Yes | 新しい順序でのID配列 |

**戻り値**: `[Exercise!]!`（更新後の一覧）

**使用例**:

```graphql
mutation ReorderExercises($sessionId: ID!, $ids: [ID!]!) {
  reorderExercises(trainingSessionId: $sessionId, exerciseIds: $ids) {
    id
    exerciseName
    order
  }
}
```

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "data": null,
  "errors": [
    {
      "message": "エラーメッセージ",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["mutationName"],
      "extensions": {
        "code": "ERROR_CODE",
        "details": { ... }
      }
    }
  ]
}
```

### エラーコード一覧

| コード | 説明 |
|--------|------|
| `VALIDATION_ERROR` | 入力値バリデーションエラー |
| `NOT_FOUND` | リソースが見つからない |
| `DUPLICATE_DATE` | 同一日付のセッションが既に存在 |
| `INTERNAL_ERROR` | サーバー内部エラー |

### バリデーションエラー例

```json
{
  "errors": [
    {
      "message": "入力値が不正です",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "details": {
          "field": "exercises[0]",
          "message": "回数または時間のどちらかは必須です"
        }
      }
    }
  ]
}
```

### 日付重複エラー例

```json
{
  "errors": [
    {
      "message": "指定された日付のトレーニングセッションは既に存在します",
      "extensions": {
        "code": "DUPLICATE_DATE",
        "details": {
          "date": "2026-01-29",
          "existingSessionId": "123"
        }
      }
    }
  ]
}
```

---

## バリデーションルール

### TrainingSession

| フィールド | ルール |
|-----------|--------|
| date | 必須、YYYY-MM-DD形式、同一日付の重複不可 |
| bodyWeight | 0より大きい値 |
| exercises | 1件以上必須 |

### Exercise

| フィールド | ルール |
|-----------|--------|
| exerciseName | 必須、1-255文字 |
| weight | 0より大きい値（指定時） |
| reps | 1以上の整数（指定時） |
| durationSeconds | 1以上の整数（指定時） |
| sets | 必須、1以上の整数 |
| reps/durationSeconds | どちらか1つは必須 |

---

## バリデーション実装（Zod）

フロントエンド・バックエンドで共有するZodスキーマ

```typescript
// shared/validation/exercise.ts
import { z } from 'zod';

export const createExerciseSchema = z.object({
  exerciseName: z.string().min(1, '種目名は必須です').max(255),
  weight: z.number().positive().nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  durationSeconds: z.number().int().positive().nullable().optional(),
  sets: z.number().int().positive('セット数は1以上必須'),
  order: z.number().int().optional(),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => data.reps != null || data.durationSeconds != null,
  { message: '回数または時間のどちらかは必須です' }
);

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2026-01-29 | 1.1.0 | DateTime型追加、DeleteResult型追加、排他制約明確化、date更新対応 |
| 2026-01-29 | 1.0.0 | 初版作成 |
