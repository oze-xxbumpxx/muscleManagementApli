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

## コミュニケーション方針

- 要件や仕様が曖昧な場合は、必ず `AskUserQuestion` ツールを使用してヒアリングしてから作業を進めること
- 推測で実装を進めず、確認を優先する

## サブエージェント モデル選定方針

タスクの特性に応じて最適なモデルを使い分ける：

| エージェント | モデル | 理由 |
| --- | --- | --- |
| design | opus | アーキテクチャ設計は深い思考力・判断力が必要 |
| review | opus | コードレビューは包括的な分析・品質判断が必要 |
| backend | sonnet | 実装タスクは品質と速度のバランスが重要 |
| frontend | sonnet | UI実装も品質と速度のバランス重視 |
| test | sonnet | テスト実装は十分な品質を保ちつつ効率的に |
| infra | sonnet | インフラ設定は正確性が必要だがsonnetで十分 |
| Explore | haiku | コード検索は速度優先 |
| Plan | opus | 設計判断を伴うため高品質な推論が必要 |

## ワークフロールール

### メモリシステム

- セッション開始時に `memory/MEMORY.md` を読み込む
- セッション中に学んだパターン・教訓・設定変更は自動的にメモリに保存する
- `MEMORY.md` はインデックス（60行以内）として維持し、詳細は個別ファイルにリンク:
  - `lessons.md` - 開発パターンと教訓
  - `preferences.md` - ユーザー設定と方針
  - `project.md` - プロジェクト固有の知識
  - `workflow.md` - ワークフロールール
  - `maintenance.md` - メンテナンスログ

### コーディネーターパターン

大きなタスクでは以下のフローに従う：

1. **計画フェーズ**: タスクを分析し、TodoWriteで計画を可視化
2. **委任フェーズ**: 適切なサブエージェントに並列でタスクを割り当て
3. **統合フェーズ**: サブエージェントの出力を検証・統合

原則：

- 独立したサブタスクは **並列実行** する
- サブエージェントの結果は必ず **検証** してからユーザーに提示
- 小さな修正を除き、実装はサブエージェントに委任する

### 進捗可視化

- TodoWriteでリアルタイムにタスク進捗を更新する
- フェーズ移行時にマーカーを表示する
- 60秒以上の沈黙を避け、進捗報告を挟む
- エラー発生時は即座にユーザーに報告する

### ワークフロー自動化

- 繰り返し発生するワークフローはスラッシュコマンド（SKILL）化する
- 既存SKILL: `/review`, `/design`, `/backend`, `/frontend`, `/test`, `/infra`
- 新規ワークフローが3回以上繰り返されたら SKILL 化を検討する

### セルフメンテナンス

- 5セッションごとにメモリの重複排除・整理を実施
- MEMORY.md が60行を超えていないか確認
- 古くなった情報は更新・削除する

## Git コミット規約

```
<type>(<scope>): <subject>
```
- type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
