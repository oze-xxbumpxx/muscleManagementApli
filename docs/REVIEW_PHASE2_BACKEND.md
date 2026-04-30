# コードレビュー: Phase 2 バックエンド 3 API

**対象コミット**: 未マージ（作業ブランチ）  
**レビュー日**: 2026-04-29  
**対象 API**: `recentExerciseFrequency` / `exerciseConsecutiveCount` / `reorderExercises`

---

## サマリー

全体としてクリーンアーキテクチャの依存方向は概ね保たれており、Zod による入力検証や型ガード関数の利用など、プロジェクト規約に従った実装が多く見られる。

ただし **ビジネスロジックの正確性**（連続カウントが「全件取得＋ループ」、`exerciseName` の trim 不整合）、**パフォーマンス**（`findConsecutiveExerciseCount` が全セッション取得）、**アーキテクチャ整合性**（`reorderExercises` の所有権検証が欠落）に Critical / Warning 級の問題が複数ある。

---

## 🔴 Critical（マージ前に必須修正）

### C-1. `reorderExercises` — 所有権検証がコメントのみで未実装

**対象ファイル**: `backend/src/usecases/reorderExercisesUseCase.ts`

**問題**  
コメントに「session.exercises の ID 集合と exerciseIds の一致を検証」と書かれているが、**実装が存在しない**。以下の不正リクエストが全て素通りする。

1. `trainingSessionId=1` に対して別セッションの `exerciseId` を渡しても `update` が成功する（**他セッションのデータを書き換え可能**）
2. 一部の `exerciseId` だけを渡すと、抜けた種目の `order` が古い値のまま残り重複や歯抜けが発生する
3. 存在しない `exerciseId` を渡すと `Exercise.update` が影響行 0 で成功扱いとなり、UI 上「並び替え後 0 件」になる

**修正案**

```ts
async execute(input: Input): Promise<Exercise[]> {
  const validated = schema.parse(input);

  const session = await this.TrainingSessionRepository.findById(validated.trainingSessionId);
  if (session === null) {
    throw new Error('Training Session not found');
  }

  const ownedIds = new Set(session.exercises.map((e) => e.id));
  const inputIds = new Set(validated.exerciseIds);

  if (
    ownedIds.size !== inputIds.size ||
    [...ownedIds].some((id) => !inputIds.has(id))
  ) {
    throw new Error('exerciseIds do not match the exercises in this session');
  }

  const reorderInputs = validated.exerciseIds.map((id, index) => ({ id, order: index + 1 }));
  return await sequelize.transaction((tx) =>
    this.ExerciseRepository.reorder(reorderInputs, tx)
  );
}
```

---

### C-2. `findConsecutiveExerciseCount` — 全セッションを無制限に取得

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
`limit` 指定なしで**全セッション + exercises を JOIN** している。データが蓄積するほどフルスキャン + メモリ展開コストが増大し、最初の `hasExercise=false` で `break` するため 99% のレコードが無駄ロードになる。

**修正案**

```ts
const sessions = await TrainingSessionModel.findAll({
  order: [['date', 'DESC']],
  limit: 100, // 連続 100 回超は MVP では非現実的
  include: [{ model: ExerciseModel, as: 'exercises', attributes: ['exerciseName'] }],
});
```

---

### C-3. `exerciseName` の trim 不整合

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
Repository 側で `exercise.exerciseName.trim() === exerciseName` と比較しているが、引数 `exerciseName` 側は trim されていない。DB に `' ベンチプレス'`（先頭空白）が保存されている場合、頻度集計では `ベンチプレス` として集計されるが、連続カウントでは不一致になり、**集計画面と連続カウントで結果が一致しない**。

**推奨方針**  
「保存時に trim する」を UseCase / Zod 層で保証し、Repository では trim を行わず比較を統一する。

```ts
// UseCase の Zod スキーマで保証
exerciseName: z.string().trim().min(1),

// Repository では trim しない
const hasExercise = (session.exercises ?? []).some(
  (exercise) => exercise.exerciseName === exerciseName
);
```

また、種目作成時（`addExerciseUseCase` / `createTrainingSessionUseCase`）の Zod スキーマでも `exerciseName.trim().min(1)` を確認・追加すること。

---

## 🟡 Warning（短期対応推奨）

### W-1. `recentExerciseFrequency` の集計仕様を確認

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
現実装は「各 exercise レコードの登場回数」を集計するため、**1 セッション内で同じ種目を 2 回登録すると `count > sessionCount`** になり得る。  
UX 観点では「直近 N セッション中、この種目が登場したセッション数」を返す方が自然。

**修正案（セッション数ベース集計）**

```ts
const seenSessions = new Map<string, Set<number>>();

for (const session of sessions) {
  for (const exercise of session.exercises ?? []) {
    const name = exercise.exerciseName.trim();
    if (!name) continue;
    if (!seenSessions.has(name)) seenSessions.set(name, new Set());
    seenSessions.get(name)!.add(session.id);
  }
}

return [...seenSessions.entries()]
  .map(([exerciseName, set]) => ({ exerciseName, count: set.size }))
  .sort((a, b) => b.count - a.count || a.exerciseName.localeCompare(b.exerciseName, 'ja'));
```

---

### W-2. ビジネスロジックが Repository 層に漏れている

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
`findRecentExerciseFrequency`（集計）、`findConsecutiveExerciseCount`（連続判定）、`calcCurrentStreak` / `calcLongestStreak`（純粋なロジック）が Infrastructure 層に置かれている。Clean Architecture では「永続化抽象」と「ドメインロジック」は別レイヤーであり、リポジトリは CRUD と最低限のクエリ集約に留めるべき。

**推奨**（中期）  
`domain/services/streakService.ts` のようなドメインサービスへ集計・連続判定ロジックを切り出し、リポジトリは「日付昇順配列」「直近 N セッションの exercises 配列」を返すだけに絞る。MVP 期は現状許容。

---

### W-3. `isConsecutive` の DST / タイムゾーン問題

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
`new Date('2024-03-10')` のような ISO 日付（時刻なし）は **UTC 0:00 として解釈**される。ローカルタイムが混在する環境では DST 切替日で意図しない結果になり得る。

**修正案**

```ts
function isConsecutive(newer: string, older: string): boolean {
  const d = new Date(`${older}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10) === newer;
}
```

または `date-fns` の `differenceInCalendarDays` を採用。

---

### W-4. `calcLongestStreak` のロジックバグ（Phase 1 実装内）

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/trainingSessionRepository.ts`

**問題**  
連続が途切れた時点で `break` しているため、**最初の連続より長い連続があっても検出できない**。

```ts
// 現状（バグ）
} else {
  break;
}

// 修正
} else {
  current = 1;
}
```

---

### W-5. `reorderExercises` の戻り値が「入力 ID のみ」

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/exerciseRepository.ts`

**問題**  
`findAll({ where: { id: inputs.map((i) => i.id) } })` で入力 ID のみを返す。C-1 の所有権検証が入れば実質的にセッション全件と一致するが、現状は「一部だけ並び替えた」場合の戻り値が混乱の原因になり得る。

**推奨**  
C-1 対応後は現実装で OK。またはセッション全体の exercises を返す方が UI での State 同期がしやすい。

---

### W-6. `bulkCreate(validate: false)` のリスク確認

**対象ファイル**: `backend/src/infrastructure/sequelize/repositories/exerciseRepository.ts`

**問題**  
`validate: false` はアプリ層でのバリデーションをスキップするため、DB 制約に到達するまで気付けない。

**確認事項**  
`addExerciseUseCase` / `createTrainingSessionUseCase` の Zod スキーマで以下が縛られていることを確認する：

- `exerciseName.trim().min(1)`
- `sets >= 1`
- `order >= 1`

---

## 🔵 Info（中期・任意対応）

### I-1. DI フィールド名が PascalCase

**対象**: `reorderExercisesUseCase.ts`、`exerciseResolver.ts`

Google TypeScript Style Guide ではインスタンスフィールドは `camelCase` を推奨。`ExerciseRepository` → `exerciseRepository`、`GetExerciseNameUseCase` → `getExerciseNameUseCase` などにリネーム。

---

### I-2. エラークラスの統一

**対象**: `reorderExercisesUseCase.ts`

`throw new Error('...')` ではなく `NotFoundError` / `UserInputError` など専用例外クラスを設けると GraphQL クライアントでのハンドリングが容易になる。

---

### I-3. import パス混在（`@/` vs 相対パス）

**対象**: `backend/src/resolvers/exerciseResolver.ts`

既存行は `@/usecases/...`、追加分は `'../usecases/...'` の相対パス。`@/` エイリアスに統一する。

```ts
// 修正前
import { GetExerciseConsecutiveCountUseCase } from '../usecases/getExerciseConsecutiveCountUseCase';
import { ReorderExercisesUseCase } from '../usecases/reorderExercisesUseCase';

// 修正後
import { GetExerciseConsecutiveCountUseCase } from '@/usecases/getExerciseConsecutiveCountUseCase';
import { ReorderExercisesUseCase } from '@/usecases/reorderExercisesUseCase';
```

`index.ts` の `'./infrastructure/...'` 系も同様。

---

### I-4. `index.ts` の手動 DI 肥大化

**対象**: `backend/src/index.ts`

UseCase が増えるたびに `index.ts` が肥大化する。中期的に `src/composition/container.ts` のような Composition Root に切り出し、`index.ts` は `buildResolvers()` を呼ぶだけにする。MVP 期は現状許容。

---

### I-5. `exerciseConsecutiveCount` の仕様を schema に明記

**対象**: `backend/src/graphql/schema.graphql`

現実装は「最新セッションから遡って連続して登場しているセッション数」を返す。最新セッションにこの種目がなければ `0` が返る仕様をスキーマ description に明記する。

```graphql
"""
指定した種目が、最新セッションから遡って連続して登場しているセッション数を返す。
最新セッションにこの種目が含まれていない場合は 0 を返す。
"""
exerciseConsecutiveCount(exerciseName: String!): Int!
```

---

## 良かった点

- 型ガード関数（`isTrainingSessionHistoryShape` 等）で `as` を完全排除しており、プロジェクト規約に厳密準拠
- `reorderExercisesUseCase` の Zod `superRefine` で重複 ID を検証している
- トランザクション内で `reorder → findAll` を正しく適用している
- Resolver が薄く、UseCase に処理を委譲するだけになっている
- `findRecentExerciseFrequency` の同件数ソートに `localeCompare('ja')` を使って安定化している
- `bulkCreate` の `validate: false` 採用理由をコメントで説明している

---

## 修正優先度サマリー

| 優先度 | 項目 | 影響 |
|--------|------|------|
| 🔴 即対応 | C-1: `reorderExercises` 所有権検証 | データ整合性・セキュリティ |
| 🔴 即対応 | C-2: `findConsecutiveExerciseCount` 全件取得 | 性能劣化（データ蓄積で悪化） |
| 🔴 即対応 | C-3: `exerciseName` trim 不整合 | データ正確性 |
| 🟡 短期 | W-1: `recentExerciseFrequency` 集計仕様確認 | 仕様解釈・ UX 正確性 |
| 🟡 短期 | W-4: `calcLongestStreak` ロジックバグ | 既存 Phase 1 バグ |
| 🟡 中期 | W-2: ドメインロジックの Repository 漏れ | アーキテクチャ品質 |
| 🔵 任意 | I-1〜I-5 | コード品質・保守性 |
