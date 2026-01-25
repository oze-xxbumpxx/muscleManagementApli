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
