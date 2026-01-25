# アーキテクチャ設計書

muscleManagementApli - システムアーキテクチャ

---

## 技術スタック

### フロントエンド

| 技術 | 用途 | バージョン |
|------|------|-----------|
| React | UIライブラリ | 18.x |
| TypeScript | 型安全性 | 5.x |
| GraphQL | API通信 | - |
| Apollo Client | GraphQL Client | 3.x |
| Zod | バリデーション | 3.x |

### バックエンド

| 技術 | 用途 | バージョン |
|------|------|-----------|
| Node.js | ランタイム | 20.x |
| TypeScript | 型安全性 | 5.x |
| GraphQL | API層 | - |
| Apollo Server | GraphQL Server | 4.x |
| Sequelize | ORM | 6.x |

### データベース

| 技術 | 用途 |
|------|------|
| PostgreSQL | リレーショナルDB |

### インフラ

| 技術 | 用途 |
|------|------|
| Docker | コンテナ化 |
| docker-compose | 複数コンテナ管理 |

### テスト

| 技術 | 用途 |
|------|------|
| Vitest | テストフレームワーク |
| Testcontainers | PostgreSQL実DB テスト |

---

## システム構成図

```
┌─────────────────────────────────────────────┐
│           Frontend (React)                  │
│  ┌─────────────────────────────────────┐   │
│  │  UI Layer (Components / Pages)      │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │  ViewModel Layer (Hooks)            │   │
│  │  - State Management                 │   │
│  │  - Validation (Zod)                 │   │
│  │  - Tactile State (Timer)            │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │  Data Layer (API / Apollo Client)   │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼──────────────────────────┘
                  │ GraphQL
                  │
┌─────────────────▼──────────────────────────┐
│        Backend (Node.js + GraphQL)         │
│  ┌─────────────────────────────────────┐   │
│  │  Resolver Layer                     │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │  UseCase Layer                      │   │
│  │  - Business Logic                   │   │
│  └──────────────┬──────────────────────┘   │
│                 │                          │
│  ┌──────────────▼──────────────────────┐   │
│  │  Repository Layer                   │   │
│  │  - Data Access                      │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼──────────────────────────┘
                  │ Sequelize
                  │
┌─────────────────▼────────────────────────── ┐
│          Database (PostgreSQL)              │
└─────────────────────────────────────────────┘
```

---

## バックエンドアーキテクチャ

### クリーンアーキテクチャ採用

**採用理由**：
- ビジネスロジックの独立性
- テスタビリティの向上
- 保守性・拡張性の確保

### レイヤー構成

```
Resolver → UseCase → Repository → DB
```

#### 1. Resolver Layer
- **責務**：GraphQL リクエスト/レスポンスの変換
- **依存**：UseCase
- **役割**：
    - リクエストの受け取り
    - UseCaseの呼び出し
    - レスポンスの整形

#### 2. UseCase Layer
- **責務**：ビジネスロジック
- **依存**：Repository
- **役割**：
    - ドメインロジックの実装
    - トランザクション管理
    - 複数Repositoryの組み合わせ

#### 3. Repository Layer
- **責務**：データアクセス
- **依存**：Sequelize Model
- **役割**：
    - CRUD操作
    - クエリの抽象化
    - データの永続化

---

## フロントエンドアーキテクチャ

### レイヤー分離戦略

フロントエンドを3層に分離し、関心事を明確にする。

### ディレクトリ構成

```
src/
├── features/
│   └── training/
│       ├── components/     ← UI層
│       ├── pages/          ← route単位
│       ├── hooks/          ← ViewModel層
│       ├── api/            ← Data層（Apollo）
│       ├── models/         ← 型/整形/Domain
│       └── validation/     ← Zod
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── graphql/
    └── generated/          ← 自動生成された型
```

### UI層（Components / Pages）

**責務**：
- 表示（見た目）
- イベント（クリック、入力）

**禁止事項**：
- データ取得ロジック（Apollo/GraphQLなし）
- ビジネスロジック
- 状態管理ロジック

**例**：
```typescript
// ✅ Good
const TrainingRecordList = ({ records, onSelect }) => {
  return (
    <ul>
      {records.map(record => (
        <li key={record.id} onClick={() => onSelect(record.id)}>
          {record.date}
        </li>
      ))}
    </ul>
  );
};

// ❌ Bad
const TrainingRecordList = () => {
  const { data } = useQuery(GET_RECORDS); // データ取得はNG
  // ...
};
```

---

### ViewModel層（Hooks）

**責務**：
- 状態管理
- 集計・整形
- Validation（Zod）
- Tactile State（タイマー）
- Apollo レスポンス → UI変換

**種類**：

#### UI Hook
- **役割**：イベント処理＋最低限のUI状態
- **例**：モーダル開閉、フォーム入力

```typescript
// useTrainingFormUI.ts
export const useTrainingFormUI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  return { isModalOpen, openModal, closeModal };
};
```

#### ViewModel Hook
- **役割**：状態管理、集計/整形、Validation
- **例**：フォーム全体の管理、データ整形

```typescript
// useTrainingFormViewModel.ts
export const useTrainingFormViewModel = () => {
  const [formData, setFormData] = useState<TrainingFormData>({});
  
  const validate = (data: TrainingFormData) => {
    return trainingSchema.safeParse(data);
  };
  
  const formatForDisplay = (data: TrainingData): UITrainingData => {
    // API型 → UI型への変換
  };
  
  return { formData, setFormData, validate, formatForDisplay };
};
```

#### Data Hook
- **役割**：Apollo専用、Query/Mutation＋生データ返却
- **例**：GraphQLデータ取得

```typescript
// useTrainingData.ts
export const useTrainingData = () => {
  const { data, loading, error } = useQuery(GET_TRAINING_RECORDS);
  
  return { records: data?.trainingRecords, loading, error };
};
```

---

### Data層（API / Apollo Client）

**責務**：
- GraphQL Query/Mutation
- Apollo Clientの責務を集中

**役割**：
- データ取得・更新の窓口
- キャッシュ管理
- エラーハンドリング

**禁止事項**：
- ビジネスロジック
- UI状態管理

---

## データフロー

```
UI → ViewModel → Data → GraphQL → Backend
```

### 読み込みフロー（Query）

```
1. UI: ユーザーがページを開く
2. ViewModel Hook: Data Hookを呼び出し
3. Data Hook: Apollo Client経由でGraphQL Query
4. Backend: Resolver → UseCase → Repository → DB
5. Backend: データをレスポンス
6. Data Hook: 生データを返却
7. ViewModel Hook: API型 → Domain型 → UI型に変換
8. UI: 整形されたデータを表示
```

### 書き込みフロー（Mutation）

```
1. UI: ユーザーがフォーム入力・送信
2. ViewModel Hook: Validation（Zod）
3. ViewModel Hook: Data Hookを呼び出し
4. Data Hook: Apollo Client経由でGraphQL Mutation
5. Backend: Resolver → UseCase → Repository → DB
6. Backend: 成功/失敗をレスポンス
7. Data Hook: 結果を返却
8. ViewModel Hook: UI状態更新（成功メッセージなど）
9. UI: フィードバック表示
```

---

## 型戦略

### 3つの型を使い分ける

#### 1. API型
- **定義場所**：`graphql/generated/`
- **用途**：GraphQLレスポンスそのまま
- **使用者**：Apollo Client、Data Hook

```typescript
// API型の例
type TrainingRecordResponse = {
  id: string;
  date: string; // ISO 8601
  exercises: Array<{
    name: string;
    weight: number;
    reps: number;
    sets: number;
  }>;
};
```

#### 2. Domain型
- **定義場所**：`features/training/models/`
- **用途**：集計や演算をするための型
- **使用者**：ViewModel Hook

```typescript
// Domain型の例
type TrainingRecord = {
  id: string;
  date: Date; // Dateオブジェクト
  exercises: Exercise[];
  totalVolume: number; // 計算済み
};
```

#### 3. UI型
- **定義場所**：`features/training/models/`
- **用途**：表示目的で整形された型
- **使用者**：UI Layer

```typescript
// UI型の例
type UITrainingRecord = {
  id: string;
  displayDate: string; // "2026年1月21日（水）"
  exerciseCount: string; // "3種目"
  exercises: UIExercise[];
};
```

---

## 状態管理戦略

### Server State vs Local State vs Tactile State

#### Server State（Apollo Client）

**対象**：
- 記録一覧
- 履歴
- 成長グラフデータ
- ストリーク情報

**管理方法**：
- Apollo Clientのキャッシュ
- 自動的に最新化

#### Local State（useState / useReducer）

**対象**：
- フォーム入力値
- モーダル開閉状態
- UI選択状態（タブなど）

**管理方法**：
- Reactの標準Hooks

#### Tactile State（ViewModel層）

**対象**：
- タイマー（操作中の状態）
- インタラクティブな状態

**管理方法**：
- ViewModel層のカスタムHook
- setIntervalなど

```typescript
// タイマーのTactile State例
export const useTimerViewModel = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setTime(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning]);
  
  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => { setTime(0); setIsRunning(false); };
  
  return { time, isRunning, start, pause, reset };
};
```

---

## テスト方針

### テスト対象

#### ✅ テストする

- Zod Validation
- GraphQL Resolver
- UseCaseロジック
- Repository（DB集計）
- ストリーク計算
- ViewModel Hook（ビジネスロジック部分）

#### ❌ テストしない（MVP1）

- フロントE2E
- Storybook
- パフォーマンステスト

### テスト環境

- **Vitest**：テストフレームワーク
- **Testcontainers**：PostgreSQL実DB
    - 理由：集計ロジックを実DBで検証

---

## セキュリティ方針

### MVP1での対策

- **SQLインジェクション**：Sequelize利用で自動防御
- **XSS**：React標準機能で自動エスケープ
- **CSRF**：個人利用のため優先度低

### 将来対応

- 認証・認可（JWT）
- HTTPS通信
- セキュリティヘッダー

---

## パフォーマンス方針

### MVP1での最適化

- **GraphQLのN+1問題**：DataLoaderで解決
- **キャッシュ**：Apollo Clientの標準機能
- **ページネーション**：記録一覧で実装

### 将来対応

- 画像最適化
- コード分割
- CDN利用

---

## 更新履歴

- 2026-01-21：初版作成
