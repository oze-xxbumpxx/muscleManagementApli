# 設計書 — インターバルタイマー機能（フェーズ7）

Codex への実装依頼用ドキュメント。

---

## 1. 目的・ゴール

### 目的

トレーニング中のセット間インターバルを管理できるようにする。

### ユーザー価値

| 観点 | 期待する効果 |
|---|---|
| インターバル管理 | 感覚でなく時間でセット間休憩を管理できる |
| 集中力維持 | 次のセットの開始タイミングを音で知れる |
| 操作性 | 種目ごとに独立したタイマーで記録と同一画面から操作できる |

### 完了ゴール

- トレーニング詳細ページの各種目行にタイマーを表示する
- カウントダウン形式（初期値 90 秒、ユーザーが変更可能）
- 開始 / 一時停止 / リセット の3操作が可能
- タイマーが 0 になったときに音でアラートを鳴らす
- バックエンド不要・フロント完結

### スコープ

| 区分 | 内容 |
|---|---|
| 対象 | `useIntervalTimer` Hook・`IntervalTimer` コンポーネント・`trainingSessionDetail.tsx` への組み込み |
| 前提 | `trainingSessionDetail.tsx` に種目リストが実装済み |
| 対象外 | 音量設定・タイマー履歴の保存・プッシュ通知・バックエンド連携 |

---

## 2. 配置場所

新規ページ・ルートは不要。既存の **トレーニング詳細ページ（`/sessions/:id`）** の各種目行に組み込む。

```
SessionDetailPage (/sessions/:id)
  └── TrainingDetailContainer（既存）
        └── TrainingDetailView（既存）
              └── TrainingSessionDetail（既存）
                    └── <li> × 種目数
                          └── IntervalTimer  ← 今回追加（自己完結）
```

---

## 3. アーキテクチャ

### 層の構成

| 層 | ファイル | 責務 |
|---|---|---|
| ViewModel Hook | `hooks/useIntervalTimer.ts` | タイマー状態管理・カウントダウンロジック |
| Component | `components/shared/timer/IntervalTimer.tsx` | タイマー UI（`useIntervalTimer` を内部で呼ぶ自己完結コンポーネント） |
| 既存 Presentational | `components/shared/training/trainingSessionDetail.tsx` | `<IntervalTimer />` を各 `<li>` に追加（変更） |

### 設計方針

`IntervalTimer` はフック・UI を内包した **自己完結コンポーネント** とする。  
タイマー状態は種目ごとに独立しており、API 呼び出しも Toast も不要なため Container 層は設けない。  
これは要件定義の「フロントエンド完結（Tactile State）・ViewModel 層で管理」の方針に沿う。

---

## 4. インターフェース定義

### `useIntervalTimer`

```ts
type TimerStatus = 'idle' | 'running' | 'paused';

interface UseIntervalTimerOptions {
  readonly initialSeconds: number;  // タイマー初期値（秒）
  readonly onComplete: () => void;  // カウントダウン完了時のコールバック
}

interface UseIntervalTimerResult {
  readonly remainingSeconds: number;  // 残り秒数
  readonly status: TimerStatus;       // 現在の状態
  readonly start: () => void;         // 開始 / 再開
  readonly pause: () => void;         // 一時停止
  readonly reset: () => void;         // リセット（initialSeconds に戻す）
}

export function useIntervalTimer(options: UseIntervalTimerOptions): UseIntervalTimerResult
```

### `IntervalTimer`

```ts
interface IntervalTimerProps {
  readonly defaultSeconds?: number;  // 初期値（省略時 90）
}

export function IntervalTimer(props: IntervalTimerProps): React.JSX.Element
```

`IntervalTimer` は内部で `useIntervalTimer` を呼び出し、時間入力・ボタン・残り時間表示をすべて自前で管理する。

---

## 5. タイマー状態遷移

```
idle ──[開始]──→ running ──[一時停止]──→ paused
  ↑                  │                      │
  └──[リセット]───────┘        [再開]────────┘
  ↑
  └──[0秒到達] ← running（自動遷移）
```

| 状態 | ボタン表示 | 操作可能 |
|---|---|---|
| `idle` | 開始 | 開始・時間変更 |
| `running` | 一時停止 | 一時停止・リセット |
| `paused` | 再開 | 再開・リセット |

- **0秒到達時**: `onComplete` を呼び出して `idle` に戻る（自動リセット）
- **リセット**: `status` を `idle`、`remainingSeconds` を `initialSeconds` に戻す
- **時間変更**: `idle` 状態のときのみ入力フィールドを有効にする

---

## 6. アラート（音）の実装

ライブラリ不要。`AudioContext` API でプログラム的にビープ音を生成する。

```ts
function playBeep(): void {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.frequency.value = 880;   // 音程（Hz）
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
}
```

- ブラウザのユーザーインタラクション後（ボタン押下起点）にのみ `AudioContext` は音を再生できる。タイマーは「開始ボタン押下 → カウント → 0秒」という流れなので自然に条件を満たす。
- `AudioContext` が未対応のブラウザは無視してよい（MVP）。

---

## 7. 時刻表示フォーマット

残り秒数を `MM:SS` 形式で表示する。

```ts
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
// 90 → '01:30'、5 → '00:05'
```

---

## 8. UI 表示仕様

### 各種目行へのタイマー組み込み

```
┌─────────────────────────────────────────────────────┐
│  ベンチプレス  3セット · 10回 · 60kg                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  インターバルタイマー                           │  │
│  │                                               │  │
│  │  [  90  ] 秒          01:30                   │  │
│  │                                               │  │
│  │       [開始]  [リセット]                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- タイマーエリアは `<details>` タグで折りたたみ可能にする（種目数が多い場合に画面が長くなるのを防ぐ）
- `<summary>` に「インターバルタイマー ▶」と表示し、展開時にタイマー UI を表示
- 残り時間の文字サイズは大きめ（`text-4xl`）でトレーニング中でも視認しやすくする
- ボタン配置: 状態に応じてボタンを切り替え
  - `idle`: 「開始」のみ
  - `running`: 「一時停止」「リセット」
  - `paused`: 「再開」「リセット」

### 状態別の残り時間の色

| 状態 | 色 |
|---|---|
| `idle` / `paused` | `text-slate-900`（通常色） |
| `running`（残り 10 秒超） | `text-emerald-600` |
| `running`（残り 10 秒以内） | `text-red-600`（緊急を視覚的に伝える） |

---

## 9. 追加・変更するファイル一覧

| パス | 新規/変更 | 内容 |
|---|---|---|
| `frontend/src/hooks/useIntervalTimer.ts` | **新規** | タイマー状態管理 ViewModel Hook |
| `frontend/src/components/shared/timer/IntervalTimer.tsx` | **新規** | タイマー UI コンポーネント（自己完結） |
| `frontend/src/components/shared/training/trainingSessionDetail.tsx` | **変更** | 各 `<li>` に `<IntervalTimer />` を追加 |

---

## 10. 実装イメージ（疑似コード）

### `useIntervalTimer.ts`

```ts
export function useIntervalTimer(options: UseIntervalTimerOptions): UseIntervalTimerResult {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(options.initialSeconds);

  useEffect(() => {
    if (status !== 'running') return;

    const id = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setStatus('idle');
          options.onComplete();
          return options.initialSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { clearInterval(id); };
  }, [status, options]);

  return {
    remainingSeconds,
    status,
    start: () => { setStatus('running'); },
    pause: () => { setStatus('paused'); },
    reset: () => { setStatus('idle'); setRemainingSeconds(options.initialSeconds); },
  };
}
```

### `IntervalTimer.tsx`（構造のみ）

```tsx
export function IntervalTimer(props: IntervalTimerProps): React.JSX.Element {
  const [inputSeconds, setInputSeconds] = useState(props.defaultSeconds ?? 90);

  const timer = useIntervalTimer({
    initialSeconds: inputSeconds,
    onComplete: playBeep,
  });

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs text-slate-500">
        インターバルタイマー
      </summary>
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        {/* 時間入力（idle 時のみ有効） */}
        {/* 残り時間表示（大きめ・状態別カラー） */}
        {/* ボタン（状態に応じて切り替え） */}
      </div>
    </details>
  );
}
```

### `trainingSessionDetail.tsx` の変更箇所

```tsx
// 各 <li> 内の末尾に追加
<IntervalTimer defaultSeconds={90} />
```

---

## 11. `useIntervalTimer` の注意点

- `useEffect` の依存配列に `options` オブジェクトを渡すと、レンダリングごとに参照が変わり無限ループになる。`options.initialSeconds` と `options.onComplete` を個別に依存させるか、`useRef` で `onComplete` を安定させること。

```ts
// onComplete を useRef で安定させる
const onCompleteRef = useRef(options.onComplete);
useEffect(() => { onCompleteRef.current = options.onComplete; });

// useEffect の deps は [status, options.initialSeconds] のみ
```

---

## 12. スコープ外

- 音量・音程のカスタマイズ
- タイマー完了履歴の保存
- プッシュ通知（Web Notifications API）
- セット間の自動カウントアップ

---

## 13. 参照ファイル（既存）

| ファイル | 参照目的 |
|---|---|
| `frontend/src/components/shared/training/trainingSessionDetail.tsx` | 変更対象（各 `<li>` の構造確認・`<IntervalTimer />` の追加箇所） |
| `frontend/src/hooks/useExerciseHistory.ts` | Hook の実装パターン（`useEffect`・クリーンアップ） |
| `frontend/src/components/shared/dashboard/StreakInfoCard.tsx` | Presentational コンポーネントのスタイルパターン |

---

## 14. 実装チェックリスト（Codex 完了基準）

- [ ] `useIntervalTimer.ts` を実装（`TimerStatus` 型を export）
- [ ] `playBeep` 関数を `IntervalTimer.tsx` 内に実装（`AudioContext` 使用）
- [ ] `IntervalTimer.tsx` を実装（`<details>` で折りたたみ・状態別ボタン表示）
- [ ] `idle` 状態のみ時間入力フィールドを有効にする
- [ ] 残り 10 秒以内で文字色を `text-red-600` に変更する
- [ ] タイマー 0 秒到達時に `playBeep` を呼び出し `idle` に自動遷移する
- [ ] `trainingSessionDetail.tsx` の各 `<li>` 末尾に `<IntervalTimer />` を追加
- [ ] `useEffect` の無限ループが起きないよう `onComplete` を `useRef` で安定させる
- [ ] `any` / `as` / `enum` を使用していない
- [ ] `interface` でオブジェクト型を定義している
