# 開発ログ・学習メモ

muscleManagementApli の開発過程で学んだこと、つまづいた点、解決方法を記録する。

---

## 2026-01-21

### プロジェクト開始・設計フェーズ完了

#### やったこと
1. **プロジェクト初期設定**
   - ドキュメント構成の確立
   - AI協働ルールの明文化

2. **ドキュメント作成**
   - `AI_COLLABORATION_RULES.md` - AI協働の方針
   - `docs/REQUIREMENTS.md` - 要件定義書
   - `docs/ARCHITECTURE.md` - アーキテクチャ設計書
   - `docs/DATABASE_DESIGN.md` - データベース設計書
   - `README.md` - プロジェクト概要
   - `docs/DEVELOPMENT_LOG.md` - 開発ログ

3. **データベース設計**
   - テーブル構成の決定（training_sessions, exercises）
   - 自重トレーニングに最適化した設計
   - 回数ベース・時間ベース両対応
   - 体重推移記録の追加
   - ON DELETE CASCADEの採用

#### 学んだこと

##### プロジェクト管理
- **ドキュメントファーストの重要性**
  - 実装前に設計を固めることで、後戻りを防げる
  - 設計判断の理由を文書化することで、将来の自分や他の開発者が理解しやすい

##### データベース設計
- **外部キー制約の選択肢**
  - `ON DELETE CASCADE`: 親削除時に子も自動削除（整合性重視）
  - `RESTRICT`: 子がある場合は親を削除不可（安全性重視）
  - `SET NULL`: 子の外部キーをNULLに（本アプリでは不適切）
  - → ドメインロジックに応じて適切な選択が重要

- **NULLABLEカラムの活用**
  - `weight`: 加重トレーニング時のみ使用
  - `reps` / `duration_seconds`: どちらか一方が必須
  - → 柔軟性と拡張性を両立できる

- **CHECK制約でデータ整合性を保証**
  ```sql
  CHECK (
    (reps IS NOT NULL AND reps > 0) OR 
    (duration_seconds IS NOT NULL AND duration_seconds > 0)
  )
  ```
  - アプリケーション層だけでなくDB層でもValidation

##### 設計の思考プロセス
- **懸念点の洗い出しが重要**
  - 時間ベースの種目への対応
  - 体重推移の記録
  - セット別記録の粒度
  - → 実装前に立ち止まって考えることで、後の修正コストを削減

- **MVP1とMVP2の境界線**
  - MVP1: 必要最小限の機能（シンプルさ優先）
  - MVP2以降: 拡張性を考慮した設計にしておく
  - → 今やるべきことと、後でやることを明確に分ける

#### つまづいた点
特になし（順調に進行）

#### 解決方法
- 設計の各ポイントで選択肢を複数提示し、メリット・デメリットを比較
- 要件を再確認しながら、最適な設計を選択

#### 次のステップ
1. **GraphQL API設計**
   - スキーマ定義（Query/Mutation）
   - Resolver設計
   - API仕様書作成（`docs/API_SPECIFICATION.md`）

2. **プロジェクト初期セットアップ**
   - `package.json` 作成（依存関係の定義）
   - `tsconfig.json` 設定（TypeScript設定）
   - ディレクトリ構造作成
   - Docker環境構築（`docker-compose.yml`）

3. **Sequelizeモデル実装**
   - マイグレーションファイル作成
   - モデル定義（TypeScript）
   - リレーション設定

#### 今日の振り返り
- ✅ 設計フェーズが完了し、実装の準備が整った
- ✅ DB設計では、自重トレーニングの特性を考慮した柔軟な設計ができた
- ✅ 将来の拡張性も確保しつつ、MVP1としてはシンプルに保てた

---

## 2026-01-25

### コーディング規約確立・プロジェクト初期セットアップ完了

#### やったこと

1. **コーディング規約の確立**
   - `docs/CODING_STANDARDS.md` を作成
   - **Google TypeScript Style Guide に準拠**
   - `any` 禁止、`as` 型アサーション禁止、`enum` 禁止
   - 型ガードの活用方針を明文化
   - ESLint設定をGoogle準拠に厳格化

2. **Cursorプロジェクトルールの作成**
   - `.cursorrules` を作成
   - AI協働ルール、コーディング規約、アーキテクチャをまとめて記載
   - Cursorがプロジェクトルールをautoloadするようになった

3. **プロジェクト初期セットアップ（ハイブリッド方式）**
   - **自動作成**：
     - `.gitignore`
     - `docker-compose.yml`（PostgreSQL）
     - `.eslintrc.json`（Google準拠）
     - `.prettierrc`
     - ディレクトリ構造
   - **手動作成**（学習目的）：
     - ルート `package.json`（monorepo設定）
     - ルート `tsconfig.json`（strict mode）
     - `backend/package.json`
     - `backend/tsconfig.json`
     - `frontend/package.json`
     - `frontend/tsconfig.json`

4. **動作確認**
   - `npm install` 成功
   - `docker-compose up` 成功（PostgreSQL起動）

#### 学んだこと

##### Google TypeScript Style Guide
- **`any` は明示的に禁止**
  - 代わりに `unknown` + 型ガードを使用
  - ESLint: `@typescript-eslint/no-explicit-any: error`

- **`as` 型アサーションは避ける**
  - 型チェックをバイパスしてしまう危険性
  - 代わりに型ガード関数を実装
  - ESLint: `@typescript-eslint/consistent-type-assertions: never`

- **`enum` は使わない**
  - 実行時にコードが生成される（バンドルサイズ増加）
  - 代わりに Union Type を使用

- **`interface` を優先**
  - オブジェクト型の定義には `interface`
  - `type` はユニオン型など特殊な場合のみ

##### 型ガード
- 型ガード関数は `is` で始める命名規則
  ```typescript
  function isUser(data: unknown): data is User {
    // ...
  }
  ```
- Zodを使うとバリデーション + 型推論が同時にできる

##### package.json
- **dependencies**：本番環境で必要なパッケージ
- **devDependencies**：開発時のみ必要なパッケージ（TypeScript, ESLint等）
- **workspaces**：monorepo管理（backend, frontendを一括管理）

##### tsconfig.json
- **`strict: true`**：7つの厳格オプションを一括有効化
- **`noUncheckedIndexedAccess: true`**：配列アクセスも安全に（Google推奨）
- **`extends`**：親の設定を継承（monorepoで共通設定を再利用）
- **`paths`**：パスエイリアスでimportを簡潔に

##### ファイル配置
- `package.json` と `tsconfig.json` はパッケージのルートに配置
- `src/` 内に置くと npm が認識しない
- monorepoでは各workspaceのルートに配置

##### Docker
- Docker Desktop が起動していないと `docker-compose` が動かない
- `docker-compose up -d` でバックグラウンド起動

#### つまづいた点
1. **package.json の配置場所を間違えた**
   - `backend/src/package.json` に置いてしまった
   - 正しくは `backend/package.json`

2. **Docker Desktop が起動していなかった**
   - エラー: `Cannot connect to the Docker daemon`

#### 解決方法
1. ファイルを正しい場所に移動
   ```bash
   mv backend/src/package.json backend/package.json
   ```

2. Docker Desktop アプリを起動してから再実行

#### 次のステップ
1. **GraphQL スキーマ設計**
   - Query / Mutation 定義
   - 型定義
   - API仕様書作成

2. **Sequelizeモデル + マイグレーション**
   - テーブル作成
   - モデル定義

3. **バックエンド実装開始**
   - Apollo Server設定
   - 最初のResolver実装

#### 今日の振り返り
- ✅ **Google TypeScript Style Guide** に準拠したコーディング規約を確立
- ✅ プロジェクト初期セットアップが完了し、開発を始められる状態になった
- ✅ 手動実装で `package.json` と `tsconfig.json` の理解が深まった
- ✅ 配置場所を間違えたことで、npmのworkspacesの仕組みを学べた
- ✅ 今後はGoogleレベルの厳格な型安全性でコーディングできる

---

## 2026-01-29

### GraphQL API仕様書作成

#### やったこと

1. **GraphQL スキーマ設計**
   - 型定義（TrainingSession, Exercise, ExerciseHistory等）
   - Query定義（一覧取得、詳細取得、履歴取得、ストリーク情報等）
   - Mutation定義（CRUD操作、並び順変更等）
   - Input型定義

2. **API仕様書作成**
   - `docs/API_SPECIFICATION.md` を作成
   - 全Query/Mutationの引数・戻り値・使用例を網羅
   - エラーハンドリング仕様を定義
   - バリデーションルールを明文化

3. **設計判断**
   - カスタムScalar `Date` を採用（graphql-scalars使用）
   - ページネーションは `limit/offset` 方式
   - バリデーションは Resolver層（Zod）+ フロント でダブルチェック

#### 学んだこと

##### GraphQL スキーマ設計

- **カスタムScalarのメリット**
  - 型安全性が高まる（`String`より明確）
  - バリデーションをScalar定義で強制できる
  - スキーマの意図が伝わりやすい

- **ページネーションの選択**
  - `limit/offset`：シンプル、小規模データ向け
  - Cursor-based（Relay）：大規模データ、リアルタイム更新向け
  - → MVP1では `limit/offset` で十分

- **バリデーション戦略**
  ```
  フロント (Zod) → GraphQL → Resolver (Zod) → DB (CHECK制約)
  ```
  - 各層で役割を分担
  - Zodスキーマはフロント・バックエンドで共有可能

##### GraphQL 命名規約

| 項目 | スタイル | 例 |
|------|---------|-----|
| Type | PascalCase | `TrainingSession` |
| Field | camelCase | `exerciseName` |
| Query | camelCase（名詞） | `trainingSessions` |
| Mutation | camelCase（動詞+名詞） | `createTrainingSession` |
| Input | PascalCase + Input | `CreateTrainingSessionInput` |

##### graphql-scalars ライブラリ

- 十分にテストされたカスタムScalar集
- `Date`, `DateTime`, `Time` など豊富な型
- 自作するより信頼性が高い

#### つまづいた点
特になし（設計フェーズのため順調に進行）

#### 解決方法
- 要件定義・DB設計を参照しながら、必要なQuery/Mutationを洗い出し
- 各操作のユースケースを想定して使用例を記載

#### 次のステップ
1. **GraphQLスキーマファイル作成**
   - `backend/src/graphql/schema.graphql`

2. **Sequelizeモデル + マイグレーション**
   - テーブル作成
   - モデル定義

3. **バックエンド実装開始**
   - Apollo Server設定
   - カスタムScalar実装
   - 最初のResolver実装

#### 今日の振り返り（午前）
- ✅ GraphQL API仕様書が完成し、フロント・バックエンドの契約が明確になった
- ✅ 全Query/Mutationの設計が固まり、実装に進める状態
- ✅ バリデーション戦略（Zod共有）の方針が決まった
- ✅ カスタムScalar採用で型安全性が向上

---

### バックエンド基盤準備

#### やったこと

1. **GraphQLスキーマファイル作成**
   - `backend/src/graphql/schema.graphql`
   - 全Type/Query/Mutation/Inputを定義

2. **カスタムScalar実装**
   - `Date`：YYYY-MM-DD形式
   - `DateTime`：ISO 8601形式
   - 手動で `ValueNode` 型を明示（Google Style Guide準拠）
   - ISO 8601正規表現を追加

3. **マイグレーションファイル作成**
   - `training_sessions` テーブル
   - `exercises` テーブル（CHECK制約含む）

4. **Apollo Server初期設定**
   - エントリーポイント `index.ts`
   - 仮Resolver定義（TODO状態）

5. **Sequelize設定**
   - `config/database.ts`（TypeScript）
   - `config/sequelize.cjs`（CLI用）
   - `.sequelizerc`（パス設定）

#### 手動で改善した点（学習成果）

| 改善箇所 | 内容 | 理由 |
|---------|------|------|
| `schema.graphql` | `DeleteResult` 型追加 | 削除結果を明確に返す |
| `schema.graphql` | `UpdateTrainingSessionInput` に `date` 追加 | 日付変更を可能に |
| `date.ts` | `ValueNode` 型を明示 | 暗黙の `any` を排除 |
| `dateTime.ts` | ISO 8601正規表現追加 | より厳格なバリデーション |
| `index.ts` | `delete*` を一貫した実装に | エラーハンドリング統一 |

#### 学んだこと

##### GraphQL カスタムScalar

- **3つのメソッドの役割**
  - `serialize`：サーバー → クライアント
  - `parseValue`：クライアント → サーバー（変数）
  - `parseLiteral`：クライアント → サーバー（リテラル）

- **型安全な実装**
  ```typescript
  // ❌ 暗黙のany
  parseLiteral(ast): string { ... }
  
  // ✅ 型を明示
  parseLiteral(ast: ValueNode): string { ... }
  ```

##### Sequelize マイグレーション

- **CHECK制約の追加方法**
  ```javascript
  await queryInterface.sequelize.query(`
    ALTER TABLE exercises
    ADD CONSTRAINT chk_exercises_sets_positive
    CHECK (sets > 0)
  `);
  ```

- **外部キー制約**
  ```javascript
  references: {
    model: 'training_sessions',
    key: 'id',
  },
  onDelete: 'CASCADE',
  ```

##### 設定ファイルの使い分け

| ファイル | 形式 | 用途 |
|---------|------|------|
| `database.ts` | TypeScript | アプリケーション内で使用 |
| `sequelize.cjs` | CommonJS | Sequelize CLI（マイグレーション） |

- CLIはESModulesをサポートしていないため `.cjs` が必要

#### 作成されたファイル構造

```
backend/src/
├── index.ts                    # Apollo Server
├── config/
│   ├── database.ts             # DB接続（TypeScript）
│   └── sequelize.cjs           # CLI設定
├── graphql/
│   ├── schema.graphql          # スキーマ定義
│   └── scalars/
│       ├── date.ts             # Date Scalar
│       ├── dateTime.ts         # DateTime Scalar
│       └── index.ts
├── migrations/
│   ├── 20260129000001-create-training-sessions.js
│   └── 20260129000002-create-exercises.js
└── seeders/
    └── .gitkeep
```

#### 次のステップ

1. **Sequelizeモデル定義（手動コーディング）**
   ```
   backend/src/models/
   ├── index.ts
   ├── trainingSession.ts
   └── exercise.ts
   ```

2. **マイグレーション実行**
   - `npm run docker:up`
   - `npm run migrate`

3. **Repository層実装**

#### 今日の振り返り（午後）
- ✅ バックエンド基盤が整い、実装を始められる状態になった
- ✅ 手動でスキーマ・Scalarを改善し、型安全性を向上
- ✅ `ValueNode` 型明示でGoogle Style Guide準拠を実践
- ✅ 次回からSequelizeモデルの手動コーディング開始

---

## 学習メモテンプレート

### YYYY-MM-DD

#### やったこと
- 実装した機能
- 解決した課題

#### 学んだこと
- 新しく理解したこと
- ベストプラクティス
- 現場での実践的な知識

#### つまづいた点
- 遭遇した問題
- エラー内容

#### 解決方法
- どのように解決したか
- 参考にした資料

#### 次のステップ
- 次にやること
- 課題

---

## 技術メモ

### TypeScript

（学習内容を随時追記）

### React

（学習内容を随時追記）

### GraphQL

（学習内容を随時追記）

### Sequelize

（学習内容を随時追記）

### クリーンアーキテクチャ

（学習内容を随時追記）

---

## 参考資料

（有用な記事・書籍を随時追記）
