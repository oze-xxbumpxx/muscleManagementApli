# バックエンド Phase 3 実装計画

## 概要

Phase 3 では GraphQL スキーマ定義済みだが未実装の Query 2 本・Mutation 1 本を追加する。

| 対象 | 種別 | 担当レイヤー |
|---|---|---|
| `recentExerciseFrequency` | Query | Domain型 / Repository IF / UseCase / Resolver / DI |
| `exerciseConsecutiveCount` | Query | Domain型 / Repository IF / UseCase / Resolver / DI |
| `reorderExercises` | Mutation | Repository IF / UseCase / Resolver / DI |

---

## アーキテクチャ制約（既存踏襲）

```
Resolver → UseCase → Domain ← Infrastructure(Repository実装) → DB
```

- `any` / `as` 禁止。不明な値は型ガード関数（`isXxx`）で絞り込む
- `enum` 禁止 → Union Type
- UseCase への入力は必ず **Zod** でバリデーション
- Repository Interface はドメイン層（`domain/repositories/`）に定義し、実装は Infrastructure 層に置く

---

## 依存関係図

```
backend/src/
│
├── domain/
│   ├── types/
│   │   ├── exercise.ts          ← ExerciseFrequency 型追加 (1)
│   │   └── trainingSession.ts   ← 変更なし
│   └── repositories/
│       ├── exerciseRepository.ts        ← reorder メソッド追加 (3)
│       └── trainingSessionRepository.ts ← findRecentExerciseFrequency, findConsecutiveExerciseCount 追加 (2)
│
├── usecases/
│   ├── getRecentExerciseFrequencyUseCase.ts  ← 新規 (4)
│   ├── getExerciseConsecutiveCountUseCase.ts ← 新規 (5)
│   └── reorderExercisesUseCase.ts            ← 新規 (6)
│
├── infrastructure/sequelize/repositories/
│   ├── trainingSessionRepository.ts ← findRecentExerciseFrequency, findConsecutiveExerciseCount 実装追加 (7)
│   └── exerciseRepository.ts        ← reorder 実装追加 (8)
│
├── resolvers/
│   ├── trainingResolver.ts  ← recentExerciseFrequency 追加 (9)
│   └── exerciseResolver.ts  ← exerciseConsecutiveCount, reorderExercises 追加 (10)
│
└── index.ts  ← DI 追加 (11)
```

### コンポーネント依存グラフ

```
                     ┌─────────────────────────────┐
                     │        index.ts (DI)         │
                     └────────────┬────────────────┘
                                  │ インスタンス生成
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐
  │ trainingResolver│  │ exerciseResolver  │  │  (既存Resolver群)  │
  └────────┬────────┘  └────────┬─────────┘  └────────────────────┘
           │                    │
  ┌────────▼────────┐  ┌────────┴────────────────────────┐
  │ GetRecentExercise│  │ GetExerciseConsecutiveCountUC    │
  │ FrequencyUseCase │  │ ReorderExercisesUseCase         │
  └────────┬────────┘  └───────┬───────────┬─────────────┘
           │                   │           │
           ▼                   ▼           ▼
  ITrainingSessionRepository   ITrainingSessionRepository  IExerciseRepository
           │                   │                           │
           ▼                   ▼                           ▼
  TrainingSessionRepository実装(Sequelize)          ExerciseRepository実装(Sequelize)
```

---

## 実装手順

---

### (1) `ExerciseFrequency` 型を domain/types/exercise.ts に追加

**ファイル**: `backend/src/domain/types/exercise.ts`（既存ファイルに追記）

```typescript
// 追加（ファイル末尾）
export interface ExerciseFrequency {
  exerciseName: string;
  count: number;
}
```

`ExerciseReorderInput` は既存定義済みのため変更不要:
```typescript
// 既存（確認のみ）
export interface ExerciseReorderInput {
  id: number;
  order: number;
}
```

---

### (2) `ITrainingSessionRepository` にメソッド追加

**ファイル**: `backend/src/domain/repositories/trainingSessionRepository.ts`（既存ファイルに追記）

```typescript
import type { ExerciseFrequency } from '../types/exercise'; // 追加

export interface ITrainingSessionRepository {
  // ... 既存メソッドはそのまま ...

  // Aggregations（既存）
  getStreakSummary(): Promise<TrainingSessionStreakSummary>;

  // 追加 (Phase 3)
  findRecentExerciseFrequency(sessionCount: number): Promise<ExerciseFrequency[]>;
  findConsecutiveExerciseCount(exerciseName: string): Promise<number>;
}
```

---

### (3) `IExerciseRepository` に `reorder` メソッド追加

**ファイル**: `backend/src/domain/repositories/exerciseRepository.ts`（既存ファイルに追記）

```typescript
import type { ExerciseReorderInput } from '../types/exercise'; // ExerciseReorderInput は既存

export interface IExerciseRepository {
  // ... 既存メソッドはそのまま ...

  // 追加 (Phase 3)
  reorder(inputs: ExerciseReorderInput[], transaction?: Transaction): Promise<Exercise[]>;
}
```

---

### (4) `GetRecentExerciseFrequencyUseCase` 新規作成

**ファイル**: `backend/src/usecases/getRecentExerciseFrequencyUseCase.ts`（新規）

```typescript
import { z } from 'zod';
import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import { ExerciseFrequency } from '@/domain/types/exercise';

const schema = z.object({
  sessionCount: z.number().int().positive().max(20).default(5),
});

type Input = z.infer<typeof schema>;

export class GetRecentExerciseFrequencyUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: Input): Promise<ExerciseFrequency[]> {
    const validated = schema.parse(input);
    return this.trainingSessionRepository.findRecentExerciseFrequency(validated.sessionCount);
  }
}
```

---

### (5) `GetExerciseConsecutiveCountUseCase` 新規作成

**ファイル**: `backend/src/usecases/getExerciseConsecutiveCountUseCase.ts`（新規）

```typescript
import { z } from 'zod';
import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';

const schema = z.object({
  exerciseName: z.string().trim().min(1),
});

type Input = z.infer<typeof schema>;

export class GetExerciseConsecutiveCountUseCase {
  constructor(private readonly trainingSessionRepository: ITrainingSessionRepository) {}

  async execute(input: Input): Promise<number> {
    const validated = schema.parse(input);
    return this.trainingSessionRepository.findConsecutiveExerciseCount(validated.exerciseName);
  }
}
```

---

### (6) `ReorderExercisesUseCase` 新規作成

**ファイル**: `backend/src/usecases/reorderExercisesUseCase.ts`（新規）

```typescript
import { z } from 'zod';
import { IExerciseRepository } from '@/domain/repositories/exerciseRepository';
import { ITrainingSessionRepository } from '@/domain/repositories/trainingSessionRepository';
import { Exercise } from '@/domain/types/exercise';

const schema = z.object({
  trainingSessionId: z.number().int().positive(),
  exerciseIds: z.array(z.number().int().positive()).min(1),
});

type Input = z.infer<typeof schema>;

export class ReorderExercisesUseCase {
  constructor(
    private readonly exerciseRepository: IExerciseRepository,
    private readonly trainingSessionRepository: ITrainingSessionRepository
  ) {}

  async execute(input: Input): Promise<Exercise[]> {
    const validated = schema.parse(input);

    // セッション存在確認
    const session = await this.trainingSessionRepository.findById(validated.trainingSessionId);
    if (session === null) {
      throw new Error(`TrainingSession ${validated.trainingSessionId} not found`);
    }

    const reorderInputs = validated.exerciseIds.map((id, index) => ({
      id,
      order: index + 1, // 1-origin
    }));

    return this.exerciseRepository.reorder(reorderInputs);
  }
}
```

> **設計メモ**: `exerciseIds` の順序が新しい `order` になる。index 0 → order 1。

---

### (7) Infrastructure: `TrainingSessionRepository` に実装追加

**ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`（既存ファイルに追記）

#### `findRecentExerciseFrequency`

```typescript
// ITrainingSessionRepository 実装
async findRecentExerciseFrequency(sessionCount: number): Promise<ExerciseFrequency[]> {
  // 直近 N セッションを取得
  const sessions = await TrainingSessionModel.findAll({
    order: [['date', 'DESC']],
    limit: sessionCount,
    include: [{ model: ExerciseModel, as: 'exercises', attributes: ['exerciseName'] }],
  });

  // exerciseName をフラット化してカウント集計
  const countMap = new Map<string, number>();
  for (const session of sessions) {
    for (const exercise of session.exercises ?? []) {
      const name = exercise.exerciseName;
      countMap.set(name, (countMap.get(name) ?? 0) + 1);
    }
  }

  // count 降順でソート
  return [...countMap.entries()]
    .map(([exerciseName, count]) => ({ exerciseName, count }))
    .sort((a, b) => b.count - a.count);
}
```

#### `findConsecutiveExerciseCount`

```typescript
// ITrainingSessionRepository 実装
async findConsecutiveExerciseCount(exerciseName: string): Promise<number> {
  // 全セッションを日付降順で取得（個人利用のためデータ量は少ない前提）
  const sessions = await TrainingSessionModel.findAll({
    order: [['date', 'DESC']],
    include: [{ model: ExerciseModel, as: 'exercises', attributes: ['exerciseName'] }],
  });

  let count = 0;
  for (const session of sessions) {
    const hasExercise = (session.exercises ?? []).some(
      (e) => e.exerciseName === exerciseName
    );
    if (!hasExercise) {
      break; // 途切れたら終了
    }
    count++;
  }
  return count;
}
```

---

### (8) Infrastructure: `ExerciseRepository` に `reorder` 実装追加

**ファイル**: `backend/src/infrastructure/sequelize/repositories/exerciseRepository.ts`（既存ファイルに追記）

```typescript
// IExerciseRepository 実装
async reorder(inputs: ExerciseReorderInput[], transaction?: Transaction): Promise<Exercise[]> {
  // 各 Exercise の order を並列更新
  await Promise.all(
    inputs.map((input) =>
      ExerciseModel.update(
        { order: input.order },
        { where: { id: input.id }, transaction }
      )
    )
  );

  // 更新後の Exercise を order 昇順で返却
  const ids = inputs.map((i) => i.id);
  const updated = await ExerciseModel.findAll({
    where: { id: ids },
    order: [['order', 'ASC']],
    transaction,
  });
  return updated.map(mapExerciseToDomain);
}
```

---

### (9) `trainingResolver.ts` に `recentExerciseFrequency` 追加

**ファイル**: `backend/src/resolvers/trainingResolver.ts`（既存ファイルを変更）

```typescript
// 追加 import
import { GetRecentExerciseFrequencyUseCase } from '@/usecases/getRecentExerciseFrequencyUseCase';

// 追加 args 型
interface GetRecentExerciseFrequencyArgs {
  sessionCount: number;
}

// TrainingResolverDeps に追加
interface TrainingResolverDeps {
  // ... 既存 ...
  GetRecentExerciseFrequencyUseCase: GetRecentExerciseFrequencyUseCase; // 追加
}

// Query に追加
Query: {
  // ... 既存 ...
  recentExerciseFrequency: async (_parent: unknown, args: GetRecentExerciseFrequencyArgs) => {
    return deps.GetRecentExerciseFrequencyUseCase.execute({ sessionCount: args.sessionCount });
  },
},
```

---

### (10) `exerciseResolver.ts` に 2 メソッド追加

**ファイル**: `backend/src/resolvers/exerciseResolver.ts`（既存ファイルを変更）

```typescript
// 追加 import
import { GetExerciseConsecutiveCountUseCase } from '@/usecases/getExerciseConsecutiveCountUseCase';
import { ReorderExercisesUseCase } from '@/usecases/reorderExercisesUseCase';

// 追加 args 型
interface GetExerciseConsecutiveCountArgs {
  exerciseName: string;
}
interface ReorderExercisesArgs {
  trainingSessionId: number;
  exerciseIds: number[];
}

// ExerciseResolverDeps に追加
interface ExerciseResolverDeps {
  // ... 既存 ...
  GetExerciseConsecutiveCountUseCase: GetExerciseConsecutiveCountUseCase; // 追加
  ReorderExercisesUseCase: ReorderExercisesUseCase;                       // 追加
}

// Query に追加
Query: {
  // ... 既存 ...
  exerciseConsecutiveCount: async (_parent: unknown, args: GetExerciseConsecutiveCountArgs) => {
    return deps.GetExerciseConsecutiveCountUseCase.execute(args);
  },
},

// Mutation に追加
Mutation: {
  // ... 既存 ...
  reorderExercises: async (_parent: unknown, args: ReorderExercisesArgs) => {
    return deps.ReorderExercisesUseCase.execute(args);
  },
},
```

---

### (11) `index.ts` DI 追加

**ファイル**: `backend/src/index.ts`（既存ファイルを変更）

```typescript
// 追加 import
import { GetRecentExerciseFrequencyUseCase } from '@/usecases/getRecentExerciseFrequencyUseCase';
import { GetExerciseConsecutiveCountUseCase } from '@/usecases/getExerciseConsecutiveCountUseCase';
import { ReorderExercisesUseCase } from '@/usecases/reorderExercisesUseCase';

// UseCase インスタンス追加（既存インスタンス群の下に追記）
const getRecentExerciseFrequencyUseCase = new GetRecentExerciseFrequencyUseCase(
  trainingSessionRepository
);
const getExerciseConsecutiveCountUseCase = new GetExerciseConsecutiveCountUseCase(
  trainingSessionRepository
);
const reorderExercisesUseCase = new ReorderExercisesUseCase(
  exerciseRepository,
  trainingSessionRepository
);

// createTrainingResolver の deps に追加
const trainingResolver = createTrainingResolver({
  // ... 既存 ...
  GetRecentExerciseFrequencyUseCase: getRecentExerciseFrequencyUseCase, // 追加
});

// createExerciseResolver の deps に追加
const exerciseResolver = createExerciseResolver({
  // ... 既存 ...
  GetExerciseConsecutiveCountUseCase: getExerciseConsecutiveCountUseCase, // 追加
  ReorderExercisesUseCase: reorderExercisesUseCase,                       // 追加
});
```

---

## 実装順序

依存関係の順に実装する。各ステップは独立してコンパイル確認できる。

```
(1) domain/types/exercise.ts      → ExerciseFrequency 型追加
(2) domain/repositories/*.ts      → Interface メソッド追加
(3) usecases/get*.ts, reorder*.ts → UseCase 新規作成（型エラーが出るが後続で解消）
(4) infrastructure/repositories/  → Repository 実装追加（型エラー解消）
(5) resolvers/                    → Resolver 追加
(6) index.ts                      → DI 配線
```

---

## 参照すべき既存実装

| 参照ファイル | 何を参考にするか |
|---|---|
| `usecases/getExerciseHistoryUsecase.ts` | Zod バリデーション + Repository 呼び出しパターン |
| `usecases/getStreakInfoUseCase.ts` | シンプルな委譲パターン（バリデーションなし） |
| `infrastructure/sequelize/repositories/trainingSessionRepository.ts` | `getStreakSummary` の全件取得ループパターン |
| `infrastructure/sequelize/repositories/exerciseRepository.ts` | `findExerciseHistory` の JOIN + 型ガードパターン |
| `resolvers/trainingResolver.ts` | Deps 型定義 + Query 追加パターン |
| `resolvers/exerciseResolver.ts` | Mutation 追加パターン |
| `index.ts` | UseCase インスタンス生成 + Resolver 配線パターン |

---

## 制約・注意点

- `findConsecutiveExerciseCount` は全セッション取得（ページネーションなし）。個人利用前提のため許容。
- `reorder` の `Promise.all` は楽観的並列更新。`exerciseIds` に他セッションの ID が混入しても DB 制約で防げるが、UseCase 側での事前チェックは行わない（YAGNI）。
- `ExerciseReorderInput` は `domain/types/exercise.ts` に既存定義済み。新規作成不要。

---

## 完了条件

- [ ] `npm run dev` でサーバー起動しエラーなし
- [ ] GraphQL Playground で `recentExerciseFrequency(sessionCount: 5)` が結果を返す
- [ ] GraphQL Playground で `exerciseConsecutiveCount(exerciseName: "ベンチプレス")` が数値を返す
- [ ] GraphQL Playground で `reorderExercises(trainingSessionId: 1, exerciseIds: [2,1,3])` が order 更新済みの Exercise[] を返す
- [ ] TypeScript コンパイルエラーなし（`tsc --noEmit`）
