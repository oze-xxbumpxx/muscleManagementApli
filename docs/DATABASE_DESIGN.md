# データベース設計書

muscleManagementApli - Database Design

---

## 概要

本アプリケーションは、自重トレーニングを中心とした筋力トレーニング管理を目的としている。

### 設計の特徴

- **自重トレーニングに最適化**：回数ベース・時間ベースの両方に対応
- **体重推移の記録**：自重トレーニングでは体重が負荷となるため必須
- **拡張性**：将来的な加重トレーニングにも対応可能
- **シンプルさ**：MVP1として必要最小限の設計

---

## ER図

```
┌─────────────────────────────┐
│   training_sessions         │
├─────────────────────────────┤
│ id (PK)                     │
│ date (UNIQUE)               │
│ body_weight                 │
│ notes                       │
│ created_at                  │
│ updated_at                  │
└─────────────┬───────────────┘
              │ 1
              │
              │ N
┌─────────────▼───────────────┐
│   exercises                 │
├─────────────────────────────┤
│ id (PK)                     │
│ training_session_id (FK)    │
│ exercise_name               │
│ weight                      │
│ reps                        │
│ duration_seconds            │
│ sets                        │
│ order                       │
│ notes                       │
│ created_at                  │
│ updated_at                  │
└─────────────────────────────┘

リレーション：
- TrainingSessions (1) ─────< (N) Exercises
- ON DELETE CASCADE
```

---

## テーブル定義

### 1. training_sessions

トレーニングセッションを日付単位で管理するテーブル。

#### カラム定義

| カラム名 | 型 | 制約 | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | SERIAL | PRIMARY KEY | auto | 主キー |
| date | DATE | NOT NULL, UNIQUE | - | トレーニング実施日 |
| body_weight | DECIMAL(4,1) | NULL | - | 体重（kg）例：65.5 |
| notes | TEXT | NULL | - | メモ・備考 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | レコード作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | レコード更新日時 |

#### インデックス

```sql
CREATE INDEX idx_training_sessions_date ON training_sessions(date);
```

- **目的**：日付での検索・ソートを高速化
- **使用場面**：記録一覧、カレンダー表示、ストリーク計算

#### 制約

- `date`：UNIQUE制約（1日1レコード）
- `body_weight`：自重トレーニングの負荷把握のため記録
  - NULL許可（記録しない日もある）

#### SQL定義

```sql
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  body_weight DECIMAL(4,1) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_sessions_date ON training_sessions(date);
```

---

### 2. exercises

各トレーニングセッションで実施した種目の詳細を記録するテーブル。

#### カラム定義

| カラム名 | 型 | 制約 | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | SERIAL | PRIMARY KEY | auto | 主キー |
| training_session_id | INTEGER | NOT NULL, FK | - | TrainingSessions.id への外部キー |
| exercise_name | VARCHAR(255) | NOT NULL | - | 種目名 |
| weight | DECIMAL(5,2) | NULL | - | 加重（kg）例：10.50 |
| reps | INTEGER | NULL | - | 回数 |
| duration_seconds | INTEGER | NULL | - | 継続時間（秒） |
| sets | INTEGER | NOT NULL, CHECK > 0 | - | セット数 |
| order | INTEGER | NOT NULL | - | 種目の実施順序 |
| notes | TEXT | NULL | - | メモ・備考 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | レコード作成日時 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | レコード更新日時 |

#### インデックス

```sql
CREATE INDEX idx_exercises_training_session_id ON exercises(training_session_id);
CREATE INDEX idx_exercises_exercise_name ON exercises(exercise_name);
```

- **idx_exercises_training_session_id**
  - 目的：JOIN操作の高速化
  - 使用場面：セッション詳細表示、記録一覧

- **idx_exercises_exercise_name**
  - 目的：種目ごとの履歴検索を高速化
  - 使用場面：成長グラフ、種目履歴表示

#### 制約

##### 外部キー制約

```sql
FOREIGN KEY (training_session_id) 
  REFERENCES training_sessions(id) 
  ON DELETE CASCADE
```

- **ON DELETE CASCADE**：親レコード（TrainingSession）削除時、子レコード（Exercise）も自動削除
- **理由**：トレーニングセッションが削除されれば、その日の種目データも意味を失うため

##### CHECK制約

```sql
CHECK (sets > 0)
CHECK (
  (reps IS NOT NULL AND reps > 0) OR 
  (duration_seconds IS NOT NULL AND duration_seconds > 0)
)
```

- **sets > 0**：セット数は1以上必須
- **reps OR duration_seconds**：回数または時間のどちらか一方は必須

#### カラム詳細説明

##### weight（加重）
- **用途**：加重トレーニング時のみ使用
- **例**：ウェイトベスト、ディップベルト
- **NULL許可**：基本的な自重トレーニングでは不要

##### reps（回数）
- **用途**：回数ベースの種目で使用
- **例**：プッシュアップ、懸垂、スクワット
- **NULL許可**：時間ベースの種目では使用しない

##### duration_seconds（継続時間）
- **用途**：時間ベースの種目で使用
- **例**：プランク、L字ホールド、壁倒立
- **NULL許可**：回数ベースの種目では使用しない

##### order（実施順序）
- **用途**：その日の種目の実施順を記録
- **理由**：トレーニングの順序は重要（疲労度に影響）
- **値**：1から順に付番

#### SQL定義

```sql
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  training_session_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NULL,
  reps INTEGER NULL,
  duration_seconds INTEGER NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  "order" INTEGER NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (
    (reps IS NOT NULL AND reps > 0) OR 
    (duration_seconds IS NOT NULL AND duration_seconds > 0)
  ),
  
  FOREIGN KEY (training_session_id) 
    REFERENCES training_sessions(id) 
    ON DELETE CASCADE
);

CREATE INDEX idx_exercises_training_session_id ON exercises(training_session_id);
CREATE INDEX idx_exercises_exercise_name ON exercises(exercise_name);
```

---

## データ型の詳細

### 数値型の選定理由

| カラム | 型 | 最小値 | 最大値 | 理由 |
|--------|-----|--------|--------|------|
| body_weight | DECIMAL(4,1) | 0.0 | 999.9 | 小数点第1位まで記録（例：65.5kg） |
| weight | DECIMAL(5,2) | 0.00 | 999.99 | 加重を細かく記録（例：10.25kg） |
| reps | INTEGER | 1 | 2,147,483,647 | 回数は整数で十分 |
| duration_seconds | INTEGER | 1 | 2,147,483,647 | 秒数は整数で十分 |
| sets | INTEGER | 1 | 2,147,483,647 | セット数は整数で十分 |

### 文字列型の選定理由

| カラム | 型 | 最大長 | 理由 |
|--------|-----|--------|------|
| exercise_name | VARCHAR(255) | 255文字 | 種目名として十分 |
| notes | TEXT | 無制限 | 自由記述用 |

---

## 使用例

### ケース1：基本的な自重トレーニング（回数ベース）

```sql
-- セッション作成
INSERT INTO training_sessions (date, body_weight) 
VALUES ('2026-01-21', 65.5);

-- プッシュアップ記録
INSERT INTO exercises (
  training_session_id,
  exercise_name,
  reps,
  sets,
  "order"
) VALUES (
  1,
  'プッシュアップ',
  25,
  3,
  1
);

-- 懸垂記録
INSERT INTO exercises (
  training_session_id,
  exercise_name,
  reps,
  sets,
  "order"
) VALUES (
  1,
  '懸垂',
  10,
  3,
  2
);
```

**結果イメージ**：
```
2026-01-21（体重: 65.5kg）
1. プッシュアップ: 25回 × 3セット
2. 懸垂: 10回 × 3セット
```

---

### ケース2：時間ベースの種目（プランク）

```sql
-- プランク記録
INSERT INTO exercises (
  training_session_id,
  exercise_name,
  duration_seconds,
  sets,
  "order"
) VALUES (
  1,
  'プランク',
  90,
  3,
  3
);
```

**結果イメージ**：
```
3. プランク: 90秒 × 3セット
```

---

### ケース3：加重トレーニング

```sql
-- ウェイトベストを使用した懸垂
INSERT INTO exercises (
  training_session_id,
  exercise_name,
  weight,
  reps,
  sets,
  "order",
  notes
) VALUES (
  1,
  '懸垂',
  10.0,
  8,
  3,
  1,
  'ウェイトベスト使用'
);
```

**結果イメージ**：
```
1. 懸垂: 8回 × 3セット（+10.0kg）
   ※ ウェイトベスト使用
```

---

### ケース4：完全な1日の記録

```sql
-- セッション作成
INSERT INTO training_sessions (date, body_weight, notes) 
VALUES ('2026-01-21', 66.0, '今日は調子良かった！');

-- 種目1：プッシュアップ（回数ベース）
INSERT INTO exercises (
  training_session_id, exercise_name, reps, sets, "order"
) VALUES (1, 'プッシュアップ', 30, 3, 1);

-- 種目2：プランク（時間ベース）
INSERT INTO exercises (
  training_session_id, exercise_name, duration_seconds, sets, "order"
) VALUES (1, 'プランク', 90, 3, 2);

-- 種目3：懸垂（回数ベース）
INSERT INTO exercises (
  training_session_id, exercise_name, reps, sets, "order"
) VALUES (1, '懸垂', 12, 3, 3);

-- 種目4：L字ホールド（時間ベース）
INSERT INTO exercises (
  training_session_id, exercise_name, duration_seconds, sets, "order"
) VALUES (1, 'L字ホールド', 30, 3, 4);

-- 種目5：スクワット（回数ベース）
INSERT INTO exercises (
  training_session_id, exercise_name, reps, sets, "order"
) VALUES (1, 'スクワット', 50, 3, 5);
```

**結果イメージ**：
```
2026-01-21（体重: 66.0kg）
メモ: 今日は調子良かった！

1. プッシュアップ: 30回 × 3セット
2. プランク: 90秒 × 3セット
3. 懸垂: 12回 × 3セット
4. L字ホールド: 30秒 × 3セット
5. スクワット: 50回 × 3セット
```

---

## クエリ例

### 記録一覧の取得（最新順）

```sql
SELECT 
  ts.id,
  ts.date,
  ts.body_weight,
  COUNT(e.id) as exercise_count
FROM training_sessions ts
LEFT JOIN exercises e ON ts.id = e.training_session_id
GROUP BY ts.id, ts.date, ts.body_weight
ORDER BY ts.date DESC
LIMIT 20;
```

---

### 特定日の詳細表示

```sql
SELECT 
  e.exercise_name,
  e.weight,
  e.reps,
  e.duration_seconds,
  e.sets,
  e.notes
FROM exercises e
WHERE e.training_session_id = :sessionId
ORDER BY e.order ASC;
```

---

### 種目ごとの成長履歴（回数ベース）

```sql
SELECT 
  ts.date,
  e.reps,
  e.sets,
  ts.body_weight
FROM exercises e
JOIN training_sessions ts ON e.training_session_id = ts.id
WHERE e.exercise_name = 'プッシュアップ'
  AND e.reps IS NOT NULL
ORDER BY ts.date ASC;
```

**用途**：折れ線グラフのデータ取得

---

### 種目ごとの成長履歴（時間ベース）

```sql
SELECT 
  ts.date,
  e.duration_seconds,
  e.sets
FROM exercises e
JOIN training_sessions ts ON e.training_session_id = ts.id
WHERE e.exercise_name = 'プランク'
  AND e.duration_seconds IS NOT NULL
ORDER BY ts.date ASC;
```

---

### 体重推移の取得

```sql
SELECT 
  date,
  body_weight
FROM training_sessions
WHERE body_weight IS NOT NULL
ORDER BY date ASC;
```

**用途**：体重推移グラフ、負荷計算

---

### 直近5回の種目一覧

```sql
SELECT DISTINCT
  e.exercise_name,
  COUNT(*) as count
FROM exercises e
JOIN training_sessions ts ON e.training_session_id = ts.id
WHERE ts.id IN (
  SELECT id 
  FROM training_sessions 
  ORDER BY date DESC 
  LIMIT 5
)
GROUP BY e.exercise_name
ORDER BY count DESC;
```

**用途**：種目履歴可視化、マンネリ化防止

---

### 同一種目の連続実施回数

```sql
-- 直近のトレーニングセッションから連続で特定種目を実施した回数を計算
WITH ranked_sessions AS (
  -- 全セッションに連番を付与（最新が1）
  SELECT
    id,
    date,
    ROW_NUMBER() OVER (ORDER BY date DESC) as session_rank
  FROM training_sessions
),
sessions_with_exercise AS (
  -- 対象種目を含むセッションにフラグを付与
  SELECT
    rs.session_rank,
    CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as has_exercise
  FROM ranked_sessions rs
  LEFT JOIN exercises e
    ON e.training_session_id = rs.id
    AND e.exercise_name = 'プッシュアップ'
),
streak_break AS (
  -- 最初に種目が実施されなかったセッションを検出
  SELECT MIN(session_rank) as break_point
  FROM sessions_with_exercise
  WHERE has_exercise = 0
)
SELECT
  COALESCE(
    (SELECT break_point - 1 FROM streak_break),
    (SELECT COUNT(*) FROM sessions_with_exercise WHERE has_exercise = 1)
  ) as consecutive_count;
```

**用途**：種目履歴可視化、マンネリ化アラート

---

### ストリーク計算（連続トレーニング日数）

```sql
WITH date_series AS (
  SELECT 
    date,
    date - ROW_NUMBER() OVER (ORDER BY date)::integer AS grp
  FROM training_sessions
  WHERE date <= CURRENT_DATE
)
SELECT 
  COUNT(*) as streak_days,
  MIN(date) as streak_start,
  MAX(date) as streak_end
FROM date_series
WHERE grp = (
  SELECT grp 
  FROM date_series 
  WHERE date = CURRENT_DATE
)
GROUP BY grp;
```

**用途**：継続可視化、モチベーション維持

---

## 設計判断の理由

### 1. ON DELETE CASCADE の採用

**判断**：親レコード削除時、子レコードも自動削除

**理由**：
- トレーニングセッション（日付）とエクササイズは強い依存関係
- セッションがなくなれば、種目データも意味を失う
- 孤立レコード（orphan records）の防止
- ユーザー体験の向上（煩雑な削除手順を回避）

**代替案との比較**：
- `RESTRICT`：削除前に手動で子レコード削除が必要（煩雑）
- `SET NULL`：データの整合性が崩れる（不適切）

---

### 2. weight を NULLABLE にした理由

**判断**：加重は任意項目

**理由**：
- 基本は自重トレーニング（加重なし）
- 将来的な加重トレーニングにも対応
- 柔軟性と拡張性のバランス

---

### 3. reps と duration_seconds を分離した理由

**判断**：回数と時間を別カラムで管理

**理由**：
- データの意味が明確
- 集計・グラフ化が容易
- Validation が明確（CHECK制約）

**代替案との比較**：
- repsを秒数としても使う：データの意味が曖昧
- notesに記載：構造化されず、分析困難

---

### 4. body_weight を追加した理由

**判断**：体重を記録

**理由**：
- 自重トレーニングでは体重が負荷そのもの
- 成長を正しく評価するために必須
- 例：体重60kg→70kgで懸垂10回は、実質的に負荷が増えている

---

### 5. セット別記録ではなく代表値を採用

**判断**：1種目につき1レコード（代表値のみ）

**理由**：
- MVP1としてシンプルさを優先
- 実装・入力の手間を削減
- 大まかなトレンド把握には十分

**将来の拡張**：
- MVP2以降でセット別記録テーブルを追加可能

---

### 6. 種目名を自由入力にした理由

**判断**：マスタテーブル化せず、VARCHAR で自由入力

**理由**：
- 個人利用のため表記ゆれリスクが低い
- 新しい種目を気軽に試せる（マンネリ化防止）
- MVP1としてシンプルさを優先

**対策**：
- フロントエンドでオートコンプリート実装
- 過去の入力履歴から候補表示

**将来の拡張**：
- 使用頻度の高い種目をマスタ化
- カテゴリ分類（胸、背中、脚など）

---

## パフォーマンス最適化

### インデックス戦略

#### 現在のインデックス

1. `idx_training_sessions_date`
   - カラム：`date`
   - 用途：日付検索、ソート、カレンダー表示

2. `idx_exercises_training_session_id`
   - カラム：`training_session_id`
   - 用途：JOIN操作の高速化

3. `idx_exercises_exercise_name`
   - カラム：`exercise_name`
   - 用途：種目ごとの履歴検索

#### 将来追加を検討するインデックス

**状況に応じて追加**：

1. 複合インデックス（成長グラフ用）
```sql
CREATE INDEX idx_exercises_name_session 
  ON exercises(exercise_name, training_session_id);
```

2. 順序インデックス（並び替え用）
```sql
CREATE INDEX idx_exercises_session_order 
  ON exercises(training_session_id, "order");
```

**追加タイミング**：
- パフォーマンス測定後
- データ量が増えた際（記録が100件以上など）

---

### データ量の見積もり

#### 前提
- 週4回トレーニング
- 1回あたり5種目

#### 年間のレコード数
- TrainingSessions: 約200レコード/年
- Exercises: 約1,000レコード/年

#### 5年後の予測
- TrainingSessions: 約1,000レコード
- Exercises: 約5,000レコード

**結論**：小規模なので、現在のインデックスで十分

---

## セキュリティ

### SQLインジェクション対策

**対策**：Sequelize（ORM）を使用

- プリペアドステートメント自動生成
- パラメータバインディング
- 手動でのSQL文字列結合を回避

### XSS対策

**対策**：React標準機能

- 自動エスケープ
- `dangerouslySetInnerHTML` の使用禁止

### 個人情報保護

**現状**：
- 個人利用のためマルチユーザー非対応
- 認証・認可は不要

**将来対応**（MVP2以降）：
- JWT認証
- ユーザーテーブル追加
- Row Level Security（RLS）

---

## マイグレーション戦略

### 初期マイグレーション

```sql
-- 001_create_training_sessions.sql
CREATE TABLE training_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  body_weight DECIMAL(4,1) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_sessions_date ON training_sessions(date);
```

```sql
-- 002_create_exercises.sql
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  training_session_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NULL,
  reps INTEGER NULL,
  duration_seconds INTEGER NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  "order" INTEGER NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (
    (reps IS NOT NULL AND reps > 0) OR 
    (duration_seconds IS NOT NULL AND duration_seconds > 0)
  ),
  
  FOREIGN KEY (training_session_id) 
    REFERENCES training_sessions(id) 
    ON DELETE CASCADE
);

CREATE INDEX idx_exercises_training_session_id ON exercises(training_session_id);
CREATE INDEX idx_exercises_exercise_name ON exercises(exercise_name);
```

### ロールバック戦略

```sql
-- 002_create_exercises.down.sql
DROP TABLE IF EXISTS exercises;

-- 001_create_training_sessions.down.sql
DROP TABLE IF EXISTS training_sessions;
```

---

## テストデータ

### 開発用シードデータ

```sql
-- トレーニングセッション
INSERT INTO training_sessions (date, body_weight, notes) VALUES
  ('2026-01-15', 65.0, NULL),
  ('2026-01-17', 65.2, '調子良い'),
  ('2026-01-19', 65.5, NULL),
  ('2026-01-21', 66.0, '新記録！');

-- エクササイズ（2026-01-21の記録）
INSERT INTO exercises (training_session_id, exercise_name, reps, duration_seconds, sets, "order", notes) VALUES
  (4, 'プッシュアップ', 30, NULL, 3, 1, NULL),
  (4, 'プランク', NULL, 90, 3, 2, NULL),
  (4, '懸垂', 12, NULL, 3, 3, NULL),
  (4, 'L字ホールド', NULL, 30, 3, 4, NULL),
  (4, 'スクワット', 50, NULL, 3, 5, NULL);
```

---

## 将来の拡張可能性（MVP2以降）

### 拡張候補1：セット別詳細記録

```sql
CREATE TABLE exercise_sets (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER NULL,
  duration_seconds INTEGER NULL,
  rest_seconds INTEGER NULL,  -- 休憩時間
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);
```

---

### 拡張候補2：種目マスタ化

```sql
CREATE TABLE exercise_masters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),  -- 胸、背中、脚など
  description TEXT,
  created_at TIMESTAMP
);

-- exercisesテーブル変更
ALTER TABLE exercises 
  ADD COLUMN exercise_master_id INTEGER REFERENCES exercise_masters(id);
```

---

### 拡張候補3：マルチユーザー対応

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP
);

-- training_sessionsにuser_id追加
ALTER TABLE training_sessions 
  ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id);
```

---

### 拡張候補4：トレーニングテンプレート

```sql
CREATE TABLE training_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE template_exercises (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  target_reps INTEGER,
  target_sets INTEGER,
  "order" INTEGER NOT NULL,
  FOREIGN KEY (template_id) REFERENCES training_templates(id) ON DELETE CASCADE
);
```

---

## まとめ

### 設計の強み

✅ **自重トレーニングに最適化**
- 回数ベース・時間ベースの両対応
- 体重記録で正確な負荷把握

✅ **シンプルさ**
- MVP1に必要な最小限の構成
- 理解しやすく、保守しやすい

✅ **拡張性**
- 加重トレーニングに対応可能
- 将来的な機能追加が容易

✅ **データ整合性**
- 適切な制約（CHECK, UNIQUE, FK）
- ON DELETE CASCADEで孤立レコード防止

✅ **パフォーマンス**
- 適切なインデックス設計
- 小規模データでも高速動作

---

## 更新履歴

- 2026-01-21：初版作成（MVP1 DB設計確定）
  - training_sessions テーブル定義
  - exercises テーブル定義
  - 自重トレーニング対応（回数・時間ベース）
  - 体重記録機能追加
