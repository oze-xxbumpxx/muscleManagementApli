# コーディング規約

muscleManagementApli - Coding Standards

**準拠**：Google TypeScript Style Guide + プロジェクト独自ルール

---

## 目的

本ドキュメントは、muscleManagementApliにおけるコーディング規約を定めたものである。

**基準**：[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) に準拠し、業界最高水準の品質を目指す。

### 規約の目的

- **一貫性**：プロジェクト全体で統一されたコードスタイル
- **可読性**：誰が読んでも理解しやすいコード
- **保守性**：将来の変更・拡張に強いコード
- **品質**：バグの少ない堅牢なコード
- **型安全性**：Googleレベルの厳格な型チェック

---

## 基本方針

### プログラミング原則

1. **SOLID原則**を意識する
   - Single Responsibility（単一責任）
   - Open/Closed（開放/閉鎖）
   - Liskov Substitution（リスコフの置換）
   - Interface Segregation（インターフェース分離）
   - Dependency Inversion（依存性逆転）

2. **DRY原則**（Don't Repeat Yourself）
   - 重複コードを避ける
   - 共通化できる処理は関数・モジュール化

3. **YAGNI原則**（You Aren't Gonna Need It）
   - 今必要ないものは実装しない
   - 過度な抽象化を避ける

4. **KISS原則**（Keep It Simple, Stupid）
   - シンプルで分かりやすいコード
   - 不必要な複雑さを避ける

---

## TypeScript コーディング規約

### 1. TypeScript設定

#### tsconfig.json（基本方針）

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**ポイント**：
- ✅ `strict: true` で最大限の型安全性
- ✅ 未使用の変数・パラメータを警告

---

### 2. 型定義

#### interface vs type（Google規約準拠）

**Google TypeScript Style Guide**：
> "Use interfaces to define object types, not type aliases."

**原則**：オブジェクトの形状には `interface` を使用、ユニオン型などは `type` を使用

```typescript
// ✅ Good: オブジェクトの形状は interface（Google推奨）
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ Good: ユニオン型は type（Google許容）
type Status = 'pending' | 'in_progress' | 'completed';

// ✅ Good: 関数型は type（Google許容）
type Callback = (value: string) => void;

// ❌ Bad: オブジェクトに type を使うのは避ける（Google非推奨）
type User = {
  id: number;
  name: string;
};
```

**Googleの方針**：
- オブジェクト型は **interface を必ず使う**
- `interface` は拡張しやすい（declaration merging）
- エラーメッセージが分かりやすい
- `type` はユニオン型、交差型、マップ型など interface で表現できない場合のみ

---

#### 型推論 vs 明示的な型宣言

```typescript
// ✅ Good: 型推論に任せる（シンプル）
const count = 10;
const name = 'John';

// ✅ Good: 関数の引数・戻り値は明示的に
function createUser(name: string, age: number): User {
  return { id: 1, name, age };
}

// ✅ Good: 複雑な型は明示的に
const users: User[] = [];

// ❌ Bad: 冗長な型宣言
const count: number = 10;
```

---

#### any の使用禁止（Google規約準拠）

**Google TypeScript Style Guide**：
> "Do not use `any` as a type unless you are in the process of migrating code to TypeScript."

```typescript
// ❌ Bad: any は使用しない（Googleで明示的に禁止）
function processData(data: any) {
  return data.value;
}

// ✅ Good: unknown を使う（Google推奨）
function processData(data: unknown) {
  if (isDataWithValue(data)) {
    return data.value;  // 型ガードで安全
  }
  throw new Error('Invalid data');
}

// 型ガード関数
function isDataWithValue(data: unknown): data is { value: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as { value: unknown }).value === 'string'
  );
}

// ✅ Better: 適切な型を定義（Google推奨）
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue) {
  return data.value;
}
```

**Googleの方針**：
- `any` は**明示的に禁止**
- TypeScript移行中のレガシーコードのみ一時的に許容
- `unknown` は安全性を保ちつつ柔軟性を確保
- ESLint で `@typescript-eslint/no-explicit-any: error` を設定

---

#### 型アサーション（as）の使用制限

**原則**：`as` による型アサーションは可能な限り避ける

```typescript
// ❌ Bad: 型アサーションで強制変換（危険）
function getUserName(data: unknown): string {
  return (data as User).name;  // ランタイムエラーの可能性
}

// ❌ Bad: any経由の型アサーション（最悪）
const user = data as any as User;

// ✅ Good: 型ガードを使う
function getUserName(data: unknown): string {
  if (isUser(data)) {
    return data.name;  // 型安全
  }
  throw new Error('Invalid user data');
}

function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as { id: unknown; name: unknown }).id === 'number' &&
    typeof (data as { id: unknown; name: unknown }).name === 'string'
  );
}

// ✅ Better: Zodなどのバリデーションライブラリを使う
import { z } from 'zod';

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

function getUserName(data: unknown): string {
  const user = userSchema.parse(data);  // バリデーション + 型推論
  return user.name;
}
```

**型アサーションが許容される例外的なケース**：

```typescript
// ✅ 許容: DOM要素の型アサーション（型が確実な場合）
const input = document.getElementById('username') as HTMLInputElement;

// ✅ 許容: const assertion（値が変更されない保証）
const STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

// ✅ 許容: 型の絞り込み後の明示的な変換（型ガードと組み合わせ）
function processData(data: unknown) {
  if (typeof data === 'string') {
    const upperCase = data.toUpperCase();
    return upperCase;
  }
  // ...
}
```

**理由**：
- 型アサーションは型チェックをバイパスする
- ランタイムエラーの原因になる
- 型ガードはコンパイル時とランタイムの両方で安全

---

#### Optional vs Nullable

```typescript
// ✅ Good: オプショナルプロパティ
interface TrainingSession {
  id: number;
  date: Date;
  bodyWeight?: number;  // 未定義の可能性
  notes?: string;
}

// ✅ Good: null を許可する場合は明示的に
interface Exercise {
  id: number;
  reps: number | null;  // null の可能性
  durationSeconds: number | null;
}

// ❌ Bad: 曖昧
interface Exercise {
  reps?: number | null;  // undefined と null の両方？
}
```

**使い分け**：
- `?`：値が存在しない可能性（オプショナル）
- `| null`：値が明示的にnullの可能性

---

### 3. Enum vs Union Type（Google規約準拠）

**Google TypeScript Style Guide**：
> "Avoid the `enum` keyword. Use string literal union types instead."

```typescript
// ❌ Bad: Enum は避ける（Googleで非推奨）
enum Status {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed'
}

// ✅ Good: Union Type + const を使う（Google推奨）
const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];

// ✅ Good: シンプルなUnion Type（Google推奨）
type Status = 'pending' | 'in_progress' | 'completed';
```

**Googleの方針**：
- `enum` は**避けるべき**
- 実行時にコードが生成される（バンドルサイズ増加）
- Union Typeは型レベルのみで、実行時コストなし
- より型安全で予測可能

---

### 4. Generic（ジェネリクス）

```typescript
// ✅ Good: 汎用的な関数にはジェネリクスを使う
function findById<T extends { id: number }>(
  items: T[],
  id: number
): T | undefined {
  return items.find(item => item.id === id);
}

// ✅ Good: 制約を設ける
interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}

// ❌ Bad: 制約なしのジェネリクス
function process<T>(data: T) {
  return data.toString();  // T に toString があるか不明
}
```

---

### 5. 型ガード（Type Guard）

**重要**：`as` による型アサーションの代わりに型ガードを使用する

#### ユーザー定義型ガード

```typescript
// ✅ Good: 型ガード関数の定義
interface TrainingSession {
  id: number;
  date: Date;
  exercises: Exercise[];
}

function isTrainingSession(data: unknown): data is TrainingSession {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('id' in data) ||
    !('date' in data) ||
    !('exercises' in data)
  ) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    typeof record['id'] === 'number' &&
    record['date'] instanceof Date &&
    Array.isArray(record['exercises'])
  );
}

// 使用例
function processSession(data: unknown) {
  if (isTrainingSession(data)) {
    // ここでは data は TrainingSession 型
    console.log(data.id, data.date);
  } else {
    throw new Error('Invalid training session data');
  }
}
```

#### 組み込み型ガード

```typescript
// ✅ Good: typeof による型ガード
function formatValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}

// ✅ Good: instanceof による型ガード
function formatDate(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

// ✅ Good: in による型ガード
interface WithReps {
  reps: number;
}

interface WithDuration {
  durationSeconds: number;
}

function getExerciseInfo(exercise: WithReps | WithDuration): string {
  if ('reps' in exercise) {
    return `${exercise.reps} reps`;
  }
  return `${exercise.durationSeconds} seconds`;
}

// ✅ Good: Array.isArray による型ガード
function processData(data: string | string[]): number {
  if (Array.isArray(data)) {
    return data.length;
  }
  return data.length;
}
```

#### 複雑な型ガード

```typescript
// ✅ Good: 複数プロパティのチェック
interface Exercise {
  id: number;
  exerciseName: string;
  reps: number | null;
  durationSeconds: number | null;
  sets: number;
}

function isExercise(data: unknown): data is Exercise {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  return (
    typeof obj.id === 'number' &&
    typeof obj.exerciseName === 'string' &&
    (obj.reps === null || typeof obj.reps === 'number') &&
    (obj.durationSeconds === null || typeof obj.durationSeconds === 'number') &&
    typeof obj.sets === 'number' &&
    obj.sets > 0 &&
    (obj.reps !== null || obj.durationSeconds !== null)  // ビジネスルールも含む
  );
}
```

#### Zodを使った型ガード（推奨）

```typescript
// ✅ Best: Zodでバリデーション + 型推論
import { z } from 'zod';

const exerciseSchema = z.object({
  id: z.number(),
  exerciseName: z.string(),
  reps: z.number().nullable(),
  durationSeconds: z.number().nullable(),
  sets: z.number().positive(),
}).refine(
  data => data.reps !== null || data.durationSeconds !== null,
  { message: 'Either reps or durationSeconds must be provided' }
);

type Exercise = z.infer<typeof exerciseSchema>;

function processExercise(data: unknown): Exercise {
  // parseでバリデーション + 型変換
  const exercise = exerciseSchema.parse(data);
  return exercise;  // Exercise型として安全
}

// safeParseでエラーハンドリング
function processExerciseSafe(data: unknown): Exercise | null {
  const result = exerciseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('Validation failed:', result.error);
  return null;
}
```

#### 型ガード関数の命名規則

```typescript
// ✅ Good: is + 型名
function isString(value: unknown): value is string { }
function isUser(data: unknown): data is User { }
function isTrainingSession(data: unknown): data is TrainingSession { }

// ✅ Good: has + プロパティ名（プロパティ存在チェック）
function hasId(data: unknown): data is { id: number } { }
function hasName(data: unknown): data is { name: string } { }

// ❌ Bad: 曖昧な命名
function checkUser(data: unknown): data is User { }  // check は曖昧
function validateData(data: unknown): data is Data { }  // validate は別の意味
```

#### 型ガードのテスト

```typescript
describe('isExercise', () => {
  it('正しいExerciseオブジェクトの場合、trueを返す', () => {
    const validExercise = {
      id: 1,
      exerciseName: 'プッシュアップ',
      reps: 20,
      durationSeconds: null,
      sets: 3,
    };
    
    expect(isExercise(validExercise)).toBe(true);
  });
  
  it('repsとdurationSecondsが両方nullの場合、falseを返す', () => {
    const invalidExercise = {
      id: 1,
      exerciseName: 'プッシュアップ',
      reps: null,
      durationSeconds: null,
      sets: 3,
    };
    
    expect(isExercise(invalidExercise)).toBe(false);
  });
  
  it('setsが0以下の場合、falseを返す', () => {
    const invalidExercise = {
      id: 1,
      exerciseName: 'プッシュアップ',
      reps: 20,
      durationSeconds: null,
      sets: 0,
    };
    
    expect(isExercise(invalidExercise)).toBe(false);
  });
});
```

---

## 命名規約

### 1. ケーススタイル

| 対象 | スタイル | 例 |
|------|---------|-----|
| 変数 | camelCase | `userName`, `isActive` |
| 関数 | camelCase | `getUserById`, `calculateTotal` |
| クラス | PascalCase | `TrainingSession`, `ExerciseRepository` |
| インターフェース | PascalCase | `User`, `TrainingSessionAttributes` |
| 型エイリアス | PascalCase | `Status`, `Callback` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| プライベートメンバー | _camelCase | `_privateMethod`, `_internalState` |
| ファイル名（コンポーネント） | PascalCase.tsx | `TrainingList.tsx` |
| ファイル名（その他） | camelCase.ts | `trainingService.ts`, `dateUtils.ts` |
| ディレクトリ | camelCase | `components`, `hooks`, `api` |

---

### 2. 命名のベストプラクティス

#### 変数名

```typescript
// ✅ Good: 意味のある名前
const trainingSessionCount = sessions.length;
const isTrainingCompleted = status === 'completed';
const currentUser = await getUserById(userId);

// ❌ Bad: 略語、意味不明
const cnt = sessions.length;
const flag = status === 'completed';
const u = await getUserById(userId);
```

#### Boolean変数

```typescript
// ✅ Good: is, has, can, should で始める
const isActive = true;
const hasPermission = false;
const canEdit = checkPermission(user);
const shouldShowModal = isActive && hasPermission;

// ❌ Bad: 意図が不明確
const active = true;
const permission = false;
```

#### 関数名

```typescript
// ✅ Good: 動詞で始める
function getUserById(id: number): User { }
function createTrainingSession(data: TrainingSessionInput): TrainingSession { }
function validateExerciseData(data: unknown): boolean { }

// ✅ Good: 副作用のある関数は動詞を明確に
async function saveTrainingSession(session: TrainingSession): Promise<void> { }
async function deleteExercise(id: number): Promise<void> { }

// ❌ Bad: 名詞のみ
function user(id: number) { }
function training(data: any) { }
```

#### クラス名

```typescript
// ✅ Good: 名詞、責務が明確
class TrainingSessionRepository { }
class ExerciseValidator { }
class DateFormatter { }

// ❌ Bad: 動詞、責務が不明確
class DoTraining { }
class Manager { }
```

---

### 3. 定数

```typescript
// ✅ Good: UPPER_SNAKE_CASE
const MAX_EXERCISE_COUNT = 20;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'http://localhost:4000/graphql';

// ✅ Good: オブジェクトの定数
const EXERCISE_TYPE = {
  REPS_BASED: 'reps_based',
  DURATION_BASED: 'duration_based',
} as const;

// ❌ Bad: camelCase
const maxExerciseCount = 20;
```

---

## ファイル・ディレクトリ構造

### 1. ディレクトリ構成（フロントエンド）

```
src/
├── features/              # 機能単位
│   └── training/
│       ├── components/    # Reactコンポーネント（PascalCase.tsx）
│       │   ├── TrainingList.tsx
│       │   ├── TrainingForm.tsx
│       │   └── ExerciseCard.tsx
│       ├── pages/         # ページコンポーネント（PascalCase.tsx）
│       │   ├── TrainingListPage.tsx
│       │   └── TrainingDetailPage.tsx
│       ├── hooks/         # カスタムフック（camelCase.ts）
│       │   ├── useTrainingData.ts
│       │   ├── useTrainingFormViewModel.ts
│       │   └── useTimer.ts
│       ├── api/           # GraphQL操作（camelCase.ts）
│       │   ├── trainingQueries.ts
│       │   └── trainingMutations.ts
│       ├── models/        # 型定義（camelCase.ts）
│       │   └── training.ts
│       └── validation/    # Zodスキーマ（camelCase.ts）
│           └── trainingSchema.ts
├── shared/
│   ├── components/        # 共通コンポーネント
│   ├── hooks/             # 共通フック
│   └── utils/             # ユーティリティ
└── graphql/
    └── generated/         # 自動生成
```

---

### 2. ディレクトリ構成（バックエンド）

```
src/
├── resolvers/             # GraphQL Resolver
│   └── training/
│       ├── trainingSessionResolver.ts
│       └── exerciseResolver.ts
├── usecases/              # ビジネスロジック
│   └── training/
│       ├── CreateTrainingSessionUseCase.ts
│       └── GetTrainingHistoryUseCase.ts
├── repositories/          # データアクセス
│   ├── TrainingSessionRepository.ts
│   └── ExerciseRepository.ts
├── models/                # Sequelizeモデル
│   ├── TrainingSession.ts
│   └── Exercise.ts
├── types/                 # 型定義
│   └── graphql.ts
├── config/                # 設定
│   └── database.ts
└── migrations/            # DBマイグレーション
    ├── 001-create-training-sessions.ts
    └── 002-create-exercises.ts
```

---

### 3. ファイル命名規則

#### Reactコンポーネント

```typescript
// ✅ Good: PascalCase.tsx
TrainingList.tsx
ExerciseCard.tsx
TrainingForm.tsx

// ❌ Bad
training-list.tsx
trainingList.tsx
```

#### フック

```typescript
// ✅ Good: use + PascalCase.ts
useTrainingData.ts
useTrainingFormViewModel.ts
useTimer.ts

// ❌ Bad
trainingData.ts
training-hook.ts
```

#### ユーティリティ・サービス

```typescript
// ✅ Good: camelCase.ts
dateUtils.ts
trainingService.ts
validationHelper.ts

// ❌ Bad
DateUtils.ts
training_service.ts
```

---

## インポート順序

### ルール

1. 外部ライブラリ（React, Apolloなど）
2. 内部の絶対パス（@/から始まる）
3. 内部の相対パス（../から始まる）
4. 型インポート（type import）
5. スタイル（CSSなど）

```typescript
// ✅ Good
// 1. 外部ライブラリ
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { z } from 'zod';

// 2. 内部の絶対パス
import { Button } from '@/shared/components/Button';
import { formatDate } from '@/shared/utils/dateUtils';

// 3. 内部の相対パス
import { TrainingCard } from '../components/TrainingCard';
import { useTrainingData } from '../hooks/useTrainingData';

// 4. 型インポート
import type { TrainingSession } from '../models/training';
import type { User } from '@/types/user';

// 5. スタイル
import './TrainingList.css';
```

---

## React コーディング規約

### 1. 関数コンポーネント

```typescript
// ✅ Good: アロー関数 + 型定義
interface TrainingListProps {
  sessions: TrainingSession[];
  onSelect: (id: number) => void;
}

export const TrainingList: React.FC<TrainingListProps> = ({ sessions, onSelect }) => {
  return (
    <ul>
      {sessions.map(session => (
        <li key={session.id} onClick={() => onSelect(session.id)}>
          {session.date}
        </li>
      ))}
    </ul>
  );
};

// ❌ Bad: function宣言
export function TrainingList(props: any) {
  // ...
}
```

---

### 2. Props の型定義

```typescript
// ✅ Good: interface で定義
interface TrainingCardProps {
  session: TrainingSession;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;  // オプショナル
}

// ✅ Good: children の型
interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

// ❌ Bad: any
function TrainingCard(props: any) { }
```

---

### 3. Hooks の使用

```typescript
// ✅ Good: カスタムフックで責務を分離
export const useTrainingFormViewModel = () => {
  const [formData, setFormData] = useState<TrainingFormData>(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  const validate = useCallback((data: TrainingFormData) => {
    const result = trainingSchema.safeParse(data);
    if (!result.success) {
      setErrors(result.error.errors);
      return false;
    }
    setErrors([]);
    return true;
  }, []);
  
  return { formData, setFormData, errors, validate };
};

// ✅ Good: コンポーネントはシンプルに
export const TrainingForm: React.FC = () => {
  const { formData, setFormData, errors, validate } = useTrainingFormViewModel();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate(formData)) {
      // 送信処理
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム */}
    </form>
  );
};
```

---

### 4. 条件付きレンダリング

```typescript
// ✅ Good: 早期リターン
export const TrainingList: React.FC<TrainingListProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return <EmptyState message="トレーニング記録がありません" />;
  }
  
  return (
    <ul>
      {sessions.map(session => (
        <TrainingCard key={session.id} session={session} />
      ))}
    </ul>
  );
};

// ✅ Good: 短い条件は三項演算子
<div>{isLoading ? <Spinner /> : <Content />}</div>

// ❌ Bad: ネストが深い
return (
  <div>
    {sessions.length > 0 ? (
      <ul>
        {sessions.map(session => (
          // ...
        ))}
      </ul>
    ) : (
      <div>No data</div>
    )}
  </div>
);
```

---

## Node.js / バックエンド規約

### 1. UseCase パターン

```typescript
// ✅ Good: 単一責任の UseCase
export class CreateTrainingSessionUseCase {
  constructor(
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly exerciseRepository: ExerciseRepository
  ) {}
  
  async execute(input: CreateTrainingSessionInput): Promise<TrainingSession> {
    // バリデーション
    this.validateInput(input);
    
    // トランザクション
    const transaction = await sequelize.transaction();
    
    try {
      // セッション作成
      const session = await this.trainingSessionRepository.create(
        {
          date: input.date,
          bodyWeight: input.bodyWeight,
        },
        transaction
      );
      
      // エクササイズ作成
      for (const exerciseInput of input.exercises) {
        await this.exerciseRepository.create(
          {
            trainingSessionId: session.id,
            ...exerciseInput,
          },
          transaction
        );
      }
      
      await transaction.commit();
      return session;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  private validateInput(input: CreateTrainingSessionInput): void {
    if (!input.date) {
      throw new Error('Date is required');
    }
    // ...
  }
}
```

---

### 2. Repository パターン

```typescript
// ✅ Good: インターフェースで抽象化
export interface ITrainingSessionRepository {
  findById(id: number): Promise<TrainingSession | null>;
  findAll(options?: FindOptions): Promise<TrainingSession[]>;
  create(data: CreateTrainingSessionData, transaction?: Transaction): Promise<TrainingSession>;
  update(id: number, data: UpdateTrainingSessionData): Promise<TrainingSession>;
  delete(id: number): Promise<void>;
}

export class TrainingSessionRepository implements ITrainingSessionRepository {
  async findById(id: number): Promise<TrainingSession | null> {
    return await TrainingSessionModel.findByPk(id, {
      include: [{ model: ExerciseModel, as: 'exercises' }],
    });
  }
  
  // ...
}
```

---

### 3. エラーハンドリング

```typescript
// ✅ Good: カスタムエラークラス
export class NotFoundError extends Error {
  constructor(resource: string, id: number | string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly errors: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Good: エラーハンドリング
async function getTrainingSessionById(id: number): Promise<TrainingSession> {
  const session = await repository.findById(id);
  
  if (!session) {
    throw new NotFoundError('TrainingSession', id);
  }
  
  return session;
}

// GraphQL Resolver でのエラーハンドリング
export const trainingSessionResolver = {
  Query: {
    trainingSession: async (_: unknown, { id }: { id: number }) => {
      try {
        return await getTrainingSessionById(id);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new GraphQLError(error.message, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        throw error;
      }
    },
  },
};
```

---

## GraphQL 規約

### 1. スキーマ命名

```graphql
# ✅ Good: PascalCase（型）
type TrainingSession {
  id: ID!
  date: Date!
  bodyWeight: Float
  exercises: [Exercise!]!
}

# ✅ Good: camelCase（フィールド）
type Exercise {
  id: ID!
  exerciseName: String!
  reps: Int
  durationSeconds: Int
  sets: Int!
}

# ✅ Good: Input は Input サフィックス
input CreateTrainingSessionInput {
  date: Date!
  bodyWeight: Float
  exercises: [CreateExerciseInput!]!
}

# ❌ Bad: snake_case
type training_session {
  exercise_name: String
}
```

---

### 2. Query / Mutation 命名

```graphql
# ✅ Good: Query は名詞
type Query {
  trainingSession(id: ID!): TrainingSession
  trainingSessions(limit: Int, offset: Int): [TrainingSession!]!
  exerciseHistory(exerciseName: String!): [Exercise!]!
}

# ✅ Good: Mutation は動詞 + 名詞
type Mutation {
  createTrainingSession(input: CreateTrainingSessionInput!): TrainingSession!
  updateTrainingSession(id: ID!, input: UpdateTrainingSessionInput!): TrainingSession!
  deleteTrainingSession(id: ID!): Boolean!
}

# ❌ Bad: 曖昧
type Query {
  getTraining(id: ID!): TrainingSession  # get は冗長
}

type Mutation {
  training(input: TrainingInput!): TrainingSession  # 動詞がない
}
```

---

## コメント規約

### 1. JSDoc

```typescript
/**
 * トレーニングセッションを作成する
 * 
 * @param input - トレーニングセッションの作成データ
 * @returns 作成されたトレーニングセッション
 * @throws {ValidationError} バリデーションエラー時
 * @throws {DatabaseError} DB操作エラー時
 * 
 * @example
 * const session = await createTrainingSession({
 *   date: new Date('2026-01-21'),
 *   bodyWeight: 65.5,
 *   exercises: [...]
 * });
 */
export async function createTrainingSession(
  input: CreateTrainingSessionInput
): Promise<TrainingSession> {
  // ...
}
```

---

### 2. コメントの粒度

```typescript
// ✅ Good: 複雑なロジックには説明を
// ストリーク計算: 連続する日付をグループ化し、現在日を含むグループのカウントを取得
const streak = calculateStreak(trainingSessions);

// ✅ Good: WHYを説明する
// Apollo Clientのキャッシュを手動で更新
// 理由: createトレーニング後、一覧に反映させるため
cache.updateQuery({ query: GET_TRAINING_SESSIONS }, (data) => {
  // ...
});

// ❌ Bad: 自明なことをコメント
// ユーザーIDを取得
const userId = user.id;

// ❌ Bad: コメントアウトされたコード（削除すべき）
// const oldImplementation = () => {
//   // ...
// };
```

---

### 3. TODO コメント

```typescript
// ✅ Good: TODO には担当者と期限を
// TODO(siro): エラーハンドリングを追加 (2026-02-01)
function processData(data: unknown) {
  // ...
}

// ✅ Good: FIXME は緊急度が高い問題
// FIXME: N+1問題が発生している。DataLoaderで解決する
const exercises = await Promise.all(
  sessions.map(s => getExercises(s.id))
);

// ❌ Bad: 曖昧
// TODO: あとで直す
```

---

## テストコード規約

### 1. テストファイル命名

```
TrainingSessionRepository.ts
TrainingSessionRepository.test.ts  ← テストファイル

useTrainingData.ts
useTrainingData.test.ts
```

---

### 2. テスト構造（AAA パターン）

```typescript
describe('TrainingSessionRepository', () => {
  describe('findById', () => {
    it('指定されたIDのトレーニングセッションを取得できる', async () => {
      // Arrange（準備）
      const repository = new TrainingSessionRepository();
      const testSession = await createTestSession();
      
      // Act（実行）
      const result = await repository.findById(testSession.id);
      
      // Assert（検証）
      expect(result).not.toBeNull();
      expect(result?.id).toBe(testSession.id);
      expect(result?.exercises).toHaveLength(3);
    });
    
    it('存在しないIDの場合はnullを返す', async () => {
      // Arrange
      const repository = new TrainingSessionRepository();
      const nonExistentId = 99999;
      
      // Act
      const result = await repository.findById(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
```

---

### 3. テスト名

```typescript
// ✅ Good: 日本語で明確に
it('体重が記録されていない場合、nullを返す', () => {});
it('repsとdurationSecondsの両方がnullの場合、エラーをthrowする', () => {});

// ✅ Good: should を使った英語
it('should return null when body weight is not recorded', () => {});

// ❌ Bad: 曖昧
it('test1', () => {});
it('works', () => {});
```

---

## Linter / Formatter 設定（Google規約準拠）

### ESLint 基本設定

**Googleスタイルガイド準拠の厳格設定**

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    // Google規約：any禁止
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    
    // Google規約：型アサーション制限
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        "assertionStyle": "never"  // 型アサーションを禁止（型ガード推奨）
      }
    ],
    
    // 戻り値の型を明示（推奨）
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }
    ],
    
    // 未使用変数の禁止
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    
    // React関連
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    
    // console.logの制限
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    
    // Google規約：prefer const
    "prefer-const": "error",
    
    // Google規約：no-var
    "no-var": "error"
  }
}
```

**重要な設定のポイント**：

1. **`@typescript-eslint/no-explicit-any: error`**
   - Googleの `any` 禁止ポリシーを強制

2. **`@typescript-eslint/consistent-type-assertions: never`**
   - 型アサーション（`as`）を完全禁止
   - 型ガードを使うことを強制

3. **`@typescript-eslint/no-unsafe-*` シリーズ**
   - `any` 型から派生する unsafe な操作を全て禁止
   - Googleレベルの厳格さ

---

### Prettier 基本設定

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## Git コミットメッセージ

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみ
- `style`: フォーマット（コード動作に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、ツール設定など

### 例

```
feat(training): トレーニング記録作成機能を実装

- TrainingSessionRepositoryを実装
- CreateTrainingSessionUseCaseを実装
- GraphQL Mutationを追加

Closes #123
```

---

## まとめ

### 重要なポイント

1. **型安全性を最優先**
   - `strict: true`
   - `any` 禁止
   - `as` 型アサーション禁止（型ガードを使用）
   - 明示的な型定義

2. **型ガードの活用**
   - `as` の代わりに型ガード関数
   - Zodでバリデーション + 型推論
   - ランタイム安全性の確保

3. **一貫性のある命名**
   - camelCase、PascalCase の使い分け
   - 意味のある名前
   - 型ガード関数は `is` で始める

4. **関心の分離**
   - クリーンアーキテクチャ
   - レイヤー分離

5. **シンプルさ**
   - KISS原則
   - 過度な抽象化を避ける

6. **テスト可能性**
   - 依存性注入
   - モックしやすい設計

---

## 参考資料

### 主要参考（準拠基準）

- **[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)** ⭐ **本プロジェクトの基準**
  - `any` 禁止
  - `enum` 禁止
  - `interface` 優先
  - 型アサーション最小化

### 補足参考

- [Microsoft TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

---

## Google規約との整合性

本プロジェクトは、Google TypeScript Style Guide に準拠し、以下の厳格なルールを採用：

| 項目 | Google規約 | 本プロジェクト | 状態 |
|------|-----------|-------------|------|
| `any` 禁止 | ✅ 必須 | ✅ 必須 | ✅ 準拠 |
| `as` 制限 | ✅ 最小限 | ✅ 原則禁止（さらに厳格） | ✅ 準拠+ |
| `enum` 禁止 | ✅ 必須 | ✅ 必須 | ✅ 準拠 |
| `interface` 優先 | ✅ 必須 | ✅ 必須 | ✅ 準拠 |
| `unknown` 推奨 | ✅ 推奨 | ✅ 推奨 | ✅ 準拠 |
| 型ガード推奨 | ✅ 推奨 | ✅ 推奨 | ✅ 準拠 |
| `strict` mode | ✅ 必須 | ✅ 必須 | ✅ 準拠 |

**評価**：本プロジェクトは **Google規約に完全準拠** し、一部（型アサーション）ではさらに厳格な基準を採用している。

---

## 更新履歴

- 2026-01-21：初版作成
- 2026-01-21：Google TypeScript Style Guide 準拠を明記、ESLint設定を厳格化
