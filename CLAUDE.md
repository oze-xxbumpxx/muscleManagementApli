# muscleManagementApli 開発ガイド

筋力トレーニング管理アプリケーションの開発ガイドです。

## 必須ドキュメント

開発時は以下のドキュメントを常に参照してください：

- コーディング規約：@docs/CODING_STANDARDS.md
- アーキテクチャ設計：@docs/ARCHITECTURE.md
- データベース設計：@docs/DATABASE_DESIGN.md
- 要件定義：@docs/REQUIREMENTS.md

## 技術スタック

- **Frontend**: React 18 + TypeScript 5 + Apollo Client
- **Backend**: Node.js 20 + GraphQL (Apollo Server 4) + Sequelize 6
- **Database**: PostgreSQL
- **Test**: Vitest + Testcontainers

## 型安全性（最優先）

**Google TypeScript Style Guide に厳密準拠**

1. **`any` 禁止** - `unknown` + 型ガード関数を使用
2. **`as` 型アサーション禁止** - 型ガード関数を使用（命名：`is<TypeName>`）
3. **`enum` 禁止** - Union Type を使用
4. **`interface` を優先** - オブジェクト型は `interface`、Union型は `type`
5. **Zod でバリデーション** - ランタイムチェック + 型推論の両立

## アーキテクチャ

### バックエンド（クリーンアーキテクチャ + DDD）

```
Resolver → UseCase → Domain ← Infrastructure → DB
```

**依存の方向**：外側 → Domain（中心）

- **Domain層**：エンティティ、値オブジェクト、ドメインサービス、リポジトリIF
- **UseCase層**：アプリケーションロジック（ユースケースの調整）
- **Infrastructure層**：Sequelizeモデル、リポジトリ実装

### フロントエンド（3層分離）

```
UI Layer → ViewModel Hook → Data Hook (Apollo) → GraphQL API
```

## コマンド

```bash
npm install           # 依存関係インストール
docker-compose up -d  # PostgreSQL起動
npm run dev           # 開発サーバー起動
npm test              # テスト実行
npm run lint          # ESLint
```

## ファイル命名規則

- Reactコンポーネント: `PascalCase.tsx`
- カスタムフック: `useXxxxx.ts`
- ユーティリティ: `camelCase.ts`

## Git コミット規約

```
<type>(<scope>): <subject>
```
- type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
