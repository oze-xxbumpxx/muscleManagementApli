# フロントエンド アーキテクチャ設計書

muscleManagementApli のフロントエンド実装の**正本**とする。バックエンドは GraphQL（Apollo Server）を前提とする。

**関連ドキュメント**: [ARCHITECTURE.md](./ARCHITECTURE.md)（システム全体）・[API_SPECIFICATION.md](./API_SPECIFICATION.md)

---

## 技術スタック

| 技術 | 用途 | 備考 |
|------|------|------|
| React 18 + TypeScript 5 | UI | `frontend/package.json` 準拠 |
| Vite 5 | ビルド | 既存スクリプト `dev` / `build` |
| Apollo Client 3 | GraphQL クライアント | 既存依存 |
| React Router v6 | ルーティング | **導入予定**（フェーズ1） |
| Tailwind CSS | スタイリング | **導入予定**（フェーズ1） |
| Zod | バリデーション | 既存依存 |

---

## アーキテクチャ：Presentational / Container パターン

### 概念と全体図（3層との対応）

プロジェクト全体の言い方（UI → ViewModel Hook → Data）との対応：

| 概念レイヤー | 置き場所 |
|-------------|----------|
| UI（表示・イベントのみ） | `components/`（Presentational）、`pages/`（レイアウト） |
| ViewModel / Data（Apollo・Zod・状態） | `hooks/`（Data Hook / Form 用 Hook 等） |
| 橋渡し（Hook を束ね、props で渡す） | `containers/` |

```
pages
  └── containers   ← Hook を呼び、props を Presentational に渡す
        ├── hooks  ← Apollo / Zod / ローカル状態
        └── components（presentational）← 表示のみ
```

**ルール**: Presentational は Apollo / `useQuery` / `useMutation` を**直接 import しない**。Container または専用 Hook 経由に限定する。

---

## ディレクトリ構成（採用：フラット）

`.cursorrules` 等にあった `features/training/` 例とは**別採用**。フロントは次のフラット構成で統一する。

```
frontend/src/
├── components/              ← Presentational（表示・イベントのみ）
│   ├── training/
│   │   ├── TrainingList.tsx
│   │   ├── TrainingCard.tsx
│   │   └── TrainingForm.tsx
│   ├── exercise/
│   └── shared/              ← Button / Modal / Toast 表示部品 等
├── containers/              ← データ取得・Hook との橋渡し
│   ├── TrainingListContainer.tsx
│   ├── TrainingDetailContainer.tsx
│   └── StreakInfoContainer.tsx
├── hooks/                   ← ビジネス整理・Apollo・Zod
│   ├── useTrainingSessions.ts   ← Data Hook（例）
│   ├── useTrainingForm.ts       ← ViewModel / フォーム（Zod 含む）
│   └── useStreakInfo.ts
├── pages/                   ← ルート単位（Container を並べる）
│   ├── DashboardPage.tsx
│   ├── SessionListPage.tsx
│   ├── SessionDetailPage.tsx
│   ├── SessionNotFoundPage.tsx  ← 存在しない ID 用（Q10・詳細/編集で表示）
│   ├── SessionNewPage.tsx       ← 記録作成（フェーズ2で明示）
│   └── SessionEditPage.tsx
├── routes/                  ← React Router 設定
│   └── index.tsx
├── graphql/                 ← クエリ定義・（任意）Codegen 出力先
│   └── queries/
├── context/                 ← Toast Context 等
└── main.tsx
```

**型・バリデーション**: `graphql/` 付近または `hooks/` 隣に `validation/` を増やしてもよい（Zod スキーマ集約）。

---

## 各レイヤーの責務

### Presentational（`components/`）

- 表示、クリック・入力イベントのみ
- Apollo / GraphQL を直接呼ばない
- props でデータを受け取る
- Tailwind CSS でスタイリング

### Container（`containers/`）

- Hook を呼び出す
- 取得データを Presentational に props で渡す
- ページ遷移（`useNavigate`）はここで扱う（Presentational には `onNavigate` 等のコールバックで委譲してもよい）
- 複雑なビジネスロジックは持たない（Hook に寄せる）

### Hook（`hooks/`）

- Apollo の `useQuery` / `useMutation` のラッパー（Data Hook）
- API 応答 → UI 向けへの整形（必要ならここまたは専用 mapper）
- Zod バリデーション
- フォーム・モーダル等のローカル状態

### Page（`pages/`）

- Container を配置するだけに近づける
- レイアウト調整のみ許容

---

## 状態管理方針

| 状態 | 管理方法 |
|------|----------|
| サーバーデータ | Apollo Cache |
| フォーム入力 | Hook 内 `useState` 等 |
| モーダル開閉 | Hook 内 `useState` |
| トースト通知 | React Context |
| タイマー等 | ViewModel 系 Hook |

**グローバル状態ライブラリ（Zustand 等）は使わない**（MVP）。

---

## UI・デザイン品質（プロダクト期待）

**素の HTML 感・バラバラな余白の積み上げは避け、プロダクトとして一貫した見え方を目指す。**

| 観点 | 方針 |
|------|------|
| **トークン** | 色・角丸・影・余白は Tailwind の **テーマ／`@theme` または定数化したクラス群**に寄せ、`#fff` / `p-2` の即興を減らす。 |
| **タイポ** | 見出し・本文・キャプションの **階層を決め**、`text-sm` 等で揃える。数字・日付は Q4 のフォーマッタと併用。 |
| **コンポーネント** | Button / Input / Card は **`components/shared` に集約**し、状態（default / hover / disabled / invalid）の見た目を統一。 |
| **密度** | 一覧・フォームは **読みやすい行高・セクション間の余白**を確保（情報密度だけ上げない）。 |
| **フィードバック** | ローディングは **スケルトンまたは明確なスピナー**、空状態は **説明文＋次のアクション**（例: 「記録を追加」）。 |
| **動き** | 過剰アニメーションは避け、**必要最小限**（モーダル・Toast）。 |

※「プロっぽさ」は **見た目だけでなく、フォーカス・エラー・スクリーンリーダー**まで含めて **Q9（B）** で担保する。

---

## ルーティング構成

| パス | 画面 |
|------|------|
| `/` | Dashboard（ストリーク + カレンダー） |
| `/sessions` | 記録一覧 |
| `/sessions/new` | 記録作成 |
| `/sessions/:id` | 記録詳細 |
| `/sessions/:id/edit` | 記録編集 |
| `/exercises/:name` | 種目別成長グラフ |

---

## バックエンド API 対応（実装フェーズ）

### フェーズ1：環境セットアップ

- [x] React Router v6 導入
- [x] Tailwind CSS 導入
- [x] Apollo Client セットアップ（`ApolloProvider`、`HttpLink`、`uri: '/graphql'`、MVP1 は `credentials` なし）
- [x] Toast Context 作成
- [x] `routes/index.tsx` 作成（プレースホルダー画面・`AppLayout`）
- [x] `main.tsx` で Provider 類をラップ
- [x] Vite `server.proxy`：`/graphql` → バックエンド `/`（Q1）
- [x] **開始前の決定事項**（本文末の質問リスト）を埋める

### フェーズ2：トレーニング記録 CRUD

対応 API（例）: `trainingSessions`, `trainingSession` / `trainingSessionByDate`, `createTrainingSession`, `updateTrainingSession`, `deleteTrainingSession`, `exerciseNames`（実名は [API_SPECIFICATION.md](./API_SPECIFICATION.md) に合わせる）

- [ ] `SessionListPage`（記録一覧）
- [ ] `SessionDetailPage`（記録詳細）
- [ ] `SessionNewPage`（記録作成フォーム）
- [ ] `SessionEditPage`（記録編集フォーム）

### フェーズ3：継続可視化

対応 API: `trainingDaysInMonth`, `streakInfo` 等

- [ ] `DashboardPage`（カレンダー + ストリーク）

### フェーズ4：成長可視化

対応 API: `exerciseHistory`

- [ ] 種目別折れ線グラフページ（ルート `/exercises/:name`）

### フェーズ5：種目履歴可視化（バックエンド実装後）

対応 API: `recentExerciseFrequency`, `exerciseConsecutiveCount`（未実装なら後回し）

---

## コーディング規約

プロジェクト共通（Google TypeScript Style Guide 準拠）に従う。

- `any` 禁止 → `unknown` + 型ガード
- `as` 型アサーション禁止 → 型ガードまたは Zod `parse` / `safeParse`
- `enum` 禁止 → Union Type または `as const` オブジェクト
- オブジェクト形は `interface` を優先
- フォーム・外部入力は Zod でランタイム検証

---

## Apollo・型の方針（実装時に決定と連動）

- **GraphQL ドキュメント**は `frontend/src/graphql/` に集約する。
- **型**は GraphQL Code Generator の利用有無を「開始前の決定事項」で決める。未導入時は Zod で「レスポンスの必要フィールド」を狭く検証する方法も可。

Mutation 後の一覧・詳細の整合は、**`refetchQueries`**、**`cache.modify`**、**`update` 関数**のいずれか（または組み合わせ）を決めてから CRUD を広げると手戻りが減る。

---

## 開始前の決定事項（質問リスト）

実装に入る前に、次を**質問ベースで決め、決まったら表に答えを追記**する。

| # | 質問 | 決定（追記用） |
|---|------|----------------|
| Q1 | **GraphQL エンドポイント**を何で渡すか？（例: `import.meta.env.VITE_GRAPHQL_HTTP`）開発時のプロキシ有無は？ | **B**: 開発時はブラウザから **`/graphql`** のみを見る。Vite `server.proxy` でバックエンド（既定 `http://localhost:4000`）へ転送。Apollo Client の `uri` は相対パス `'/graphql'`。本番の取り回しは後続で決める（同一オリジン配下に API を寄せる / リバプロ等）。 |
| Q2 | **GraphQL 型**は Codegen を導入するか？導入する場合、スキーマはファイル参照か introspection か？ | **A**: **GraphQL Code Generator を導入**。スキーマはリポジトリ内の **`backend/src/graphql/schema.graphql`** を参照（SDL ファイル）。Introspection は使わない。 |
| Q3 | Mutation 成功後の **キャッシュ更新方針**は？（一覧は常に refetch / 楽観的更新はしない 等） | **A**: 成功時は **`refetchQueries`** で影響する Query を明示的に再取得。**楽観的更新（optimisticResponse）は使わない**。`cache.modify` 手動更新は原則しない（まず refetch で整合を取る）。 |
| Q4 | **日付・体重**の表示フォーマット・ロケール（例: 日付は `ja-JP`、`Intl`）の統一ルールは？ | **A**: ロケールは **`ja-JP` 固定**。表示は **`Intl.DateTimeFormat` / `Intl.NumberFormat`** で統一。日付は **`dateStyle: 'medium'`**（例: `2026年3月25日`）を既定。体重は **小数第 1 位まで**（`maximumFractionDigits: 1`）。フォーマッタは **`frontend/src/` 配下のユーティリティに集約**する。 |
| Q5 | **エラー表示**は Toast のみか、フォームフィールド単位のエラーも必須か？ | **B**: **Toast + フィールド単位**。クライアント検証（**Zod**）は `path` に応じて各入力下に表示。サーバー（GraphQL）エラーは **`extensions` や `locations` だけではフィールドに紐づかないことが多い**ため、**紐づけ可能ならフィールド下＋要約 Toast**、できなければ **Toast とフォーム先頭のサマリー**で統一する。 |
| Q6 | MVP で **認証**は無しで確定か？（将来 JWT 等を想定した `Apollo Link` の置き場所だけ決めるか） | **MVP1: 認証なし**で確定。ログイン・トークン・`credentials: 'include'` の要件は置かない。認可が必要になったタイミングで **Apollo `from` チェーンに auth Link を挿入**する方針とし、実装時は `client` 作成を1ファイルに寄せて差し替えしやすくする。 |
| Q7 | **ダッシュボードのカレンダー**はライブラリ利用か、最小 UI から自作か？候補をどれにするか？ | **A**: **ライブラリ利用**（車輪の再開発はしない）。既定の第一候補は **`react-day-picker`**（React 18・月表示・修飾子で「トレーニングあり」日をマークしやすい）。要件次第で **FullCalendar** 等への差し替えは可。 |
| Q8 | **グラフ（フェーズ4）**はどのライブラリにするか？（例: Recharts, Chart.js, visx） | **A**: **Recharts**。`exerciseHistory` 等の折れ線・複数系列は **`LineChart` / `XAxis` / `Tooltip` / `Legend`** で組み立てる。**`ResponsiveContainer`** で幅に追従。アクセシビリティは **チャート用のテキスト要約**（見出し＋簡単な説明）を併置する（Q9 と連携）。 |
| Q9 | **アクセシビリティ**の最低ライン（フォーカス管理、ボタン名、色相のみで状態を伝えない等）をどこまで必須にするか？ | **B**（**UI・デザイン品質**と一体）。**A の内容に加え**、**見出し階層（h1〜）**、**モーダルのフォーカストラップ**、主な成否通知に **live region（`aria-live`）** を検討。チャートは Q8 メモどおり **テキスト／表の補助**を併設。 |
| Q10 | **ルート直リンク**（`/sessions/:id` を手入力）時、存在しない ID は 404 相当の UI に統一するか？ | **はい**。**専用画面**（例: `SessionNotFoundPage` または `components/shared/NotFoundResource` をラップ）で「記録が見つかりません」＋ **一覧へ戻る・ダッシュボードへ** 等。`trainingSession` / `trainingSessionByDate` が **null** 相当のときに表示。**編集ルート**（`/sessions/:id/edit`）でも同様に扱う。 |

### Q1 実装メモ（プロキシとパス）

- 現行バックエンドは `@apollo/server/standalone` で **GraphQL がルート `/`**（ポートは `PORT` なければ **4000**）。ブラウザ側パスを `/graphql` にする場合、Vite のプロキシで **`/graphql` → `http://localhost:4000/`** となるよう **パスリライト**が必要（`/graphql` をそのまま転送するとバックエンドに `/graphql` が来て不一致になりうる）。
- CORS は開発中は同一オリジン扱いになりやすく、フロント実装が簡潔になる。

### Q2 実装メモ（Codegen）

- スキーマパスはモノレポ直下からの相対で **`../backend/src/graphql/schema.graphql`**（`frontend/` で作業する場合）として Codegen 設定に書ける。
- ドキュメント（操作定義）は **`frontend/src/graphql/`** 以下に `.graphql` または `.ts`（`gql` タグ）で置き、プラグインは **`typescript` + `typescript-operations` +（推奨）`typed-document-node`** など、チームで運用しやすいセットを選ぶ。
- スキーマ変更時は **バックエンドの `schema.graphql` を真とし**、Codegen を再実行してフロント型を更新する。

### Q3 実装メモ（Mutation 後のキャッシュ）

- 各 Mutation の `refetchQueries` に、**一覧・詳細・ダッシュボードなどユーザーが見える可能性がある Document** を列挙する（運用で漏れが出たら随時追加）。
- ネットワークは増えるが実装が単純で、**表示と DB の不整合が出にくい**（学習・MVP に向く）。
- 後でパフォーマンスやリクエスト数が気になった段階で、一部だけ `update` / `cache.modify` に寄せる判断も可（そのときは方針を文書更新する）。

### Q4 実装メモ（日付・体重）

- API の日付文字列（`DATEONLY` 等）は **`YYYY-MM-DD` をローカル日付として扱う**（`new Date('YYYY-MM-DD')` は UTC 解釈になりうるので、`T00:00:00` 付与やパース分割など **タイムゾーンずれ防止**をユーティリティで一元化する）。
- 一覧で短い表記（`yyyy/MM/dd`）に寄せたくなった場合も、**同じ入力型に対する関数を増やさず** `formatTrainingDateShort` のように別関数で揃える。
- 体重が `null` のときは **「―」等のプレースホルダ**で統一するかは UI 実装時に決め、表示側で共通コンポーネント化するとよい。

### Q5 実装メモ（エラー UX）

- **Zod**：`safeParse` 失敗時に `issue.path` → `Record<string, string>`（または配列）へ正規化し、Presentational に `fieldErrors` として渡す。送信前に **先頭フィールドへフォーカス**すると入力体験が良い。
- **Mutation / Query 失敗**：ネットワーク断は Toast。GraphQL `errors[]` は **ユーザー向けメッセージを1行に要約した Toast** を出しつつ、バックエンドが **フィールド粒度の `extensions`（例: `{ field: 'date', code: '...' }`）** を返すなら同一形式にマージしてフィールド下に表示する（**未対応のうちは Toast + フォーム上の alert 領域でも可**）。
- フィールドエラーがある入力は **`aria-invalid` / `aria-describedby`** を付与できるようコンポーネント設計しておく（Q9 と連携）。

### Q6 実装メモ（認証）

- **公開前提の API を叩かない**（将来デプロイ時）は別途インフラ・バックエンド側で対策が必要（本ドキュメントの MVP1 範囲外）。
- 認証を足す場合の定番は **`setContext` Link**（ヘッダに `Authorization`）または Cookie ＋ **`credentials: 'include'`**；そのとき Vite プロキシ／本番オリジンも合わせて見直す。

### Q7 実装メモ（ダッシュボード・カレンダー）

- **`trainingDaysInMonth`** 等で返る日付集合と、ライブラリが扱う **`Date` / 年月**の対応は **Q4 の日付パースutil** で揃える（タイムゾーンずれに注意）。
- **Tailwind** 併用時は `react-day-picker` のクラス名を **`classNames` / CSS 変数**で上書きし、デザインを `components/shared` に寄せる。
- 月送りで Query 変数を変える場合、**Container または Data Hook** で `year`/`month` を状態管理し、ローディング中のスケルトンを共通化するとよい。
- 週表示・スケジュール密度が必要になったら **FullCalendar** 等の検討（bundle サイズと引き換え）。

### Q8 実装メモ（Recharts）

- **軸ラベル**は Q4 の日付・数値フォーマッタに合わせる（`tickFormatter`）。
- データ欠損日は **点を飛ばす**か **0 扱い**かを種目の意味で決める（`connectNulls` 等）。
- Recharts は **スクリーンリーダー向けの完全な代替表現**は自前補強が望ましい。MVP では **同ページに「データテーブル（折りたたみ）」**や **要点テキスト**を置くと Q5/Q9 と両立しやすい。

### Q9 実装メモ（アクセシビリティ B × プロ品質 UI）

- **全ページ**: 論理順序と **見出しレベル**が飛ばないようにする（ページタイトルは h1）。
- **インタラクティブ**: アイコンのみボタンは **`aria-label`**。リンクとボタンは役割を混同しない。
- **フォーカス**: `outline-none` だけにせず、**`:focus-visible` でリング**を Tailwind トークンに合わせて付与（キーボード操作が見える）。
- **モーダル**: 開いたら **フォーカスを中へ**、閉じたら **トリガへ戻す**（`react-remove-scroll` 等は必要に応じて）。
- **色**: エラー・成功は **アイコン＋文言**で補足（色のみに依存しない）。
- **live region**: フォーム送信結果・Toast 相当の重要メッセージは **`role="status"` / `aria-live="polite"`** を共通化コンポーネントで検討。

### Q10 実装メモ（存在しないセッション）

- SPA のため **HTTP ステータス 404 は必須ではない**。ルートは `/sessions/:id` のまま、**Query 完了後に「見つからない」専用 UI** に切り替える。
- **loading / error / null** を Container で分岐：ネットワークエラーは Q5 に従い Toast 等、**データが null** のみ専用画面へ。
- **見出し**: Q9 に合わせ **h1** で状況を明示（例: 「記録が見つかりません」）。
- 将来 **本番 URL でシェア**される想定なら、`document.title` をその画面用に変えてもよい。

---

## 更新履歴

- 2026-03-25：Q10 決定（存在しない ID は専用画面）を表および実装メモに反映。開始前の決定事項 Q1〜Q10 を一通り確定。
- 2026-03-25：**UI・デザイン品質**節を追加（プロ品質の期待を明文化）。Q9 を **B** で確定し実装メモを追加。
- 2026-03-25：Q8 決定（Recharts・フェーズ4）を表および実装メモに反映。
- 2026-03-25：Q7 決定（ライブラリ・既定候補 `react-day-picker`）を表および実装メモに反映。
- 2026-03-25：Q6 決定（MVP1 認証なし・将来は Link 差し込み）を表および実装メモに反映。
- 2026-03-25：Q5 決定（Toast + フィールド単位・Zod / サーバー拡張の扱い）を表および実装メモに反映。
- 2026-03-25：Q4 決定（`ja-JP` 固定・Intl 統一・日付 medium・体重 1 桁）を表および実装メモに反映。
- 2026-03-25：Q3 決定（`refetchQueries` 中心・楽観的更新なし）を表および実装メモに反映。
- 2026-03-25：Q2 決定（Codegen・スキーマは `backend/src/graphql/schema.graphql`）を表および実装メモに反映。
- 2026-03-25：Q1 決定（選択肢 B・プロキシ）を表および実装メモに反映。
- 2026-03-25：初版（Presentational/Container、フラット構成、フェーズ・質問リストを反映）
