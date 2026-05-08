# コードレビュー: タイマー機能

**対象**: `useIntervalTimer` / `IntervalTimer` / `trainingSessionDetail` の実装  
**レビュー日**: 2026-05-08  
**設計書**: `docs/DESIGN_TIMER.md` / `docs/IMPLEMENT_TIMER.md`

---

## サマリー

設計書への整合性は高く、React Hook の罠（`onComplete` の useRef 化）も正しく回避できている。  
**必須修正は3件**（AudioContext リーク・責務二重化・依存配列）。タイポと型安全性の指摘も合わせて対応推奨。

---

## 🔴 Critical（マージ前に必須修正）

### C-1. `AudioContext` が close されずリークする

**対象ファイル**: `frontend/src/components/shared/timer/IntervalTimer.tsx:42-62`

**問題**  
完了音を鳴らすたびに `new AudioContext()` を生成するが `context.close()` が呼ばれていない。  
Chromium 系はページ内の AudioContext 数に上限（通常6つ）があり、長時間の使用で完了音が鳴らなくなる。  
種目数が多いページで複数回タイマーを完了させると顕在化する。

**修正箇所**

```ts
// 修正前
oscillator.start(context.currentTime);
oscillator.stop(context.currentTime + 0.5);

// 修正後
oscillator.onended = () => {
  void context.close();
};
oscillator.start(context.currentTime);
oscillator.stop(context.currentTime + 0.5);
```

---

### C-2. `reset` ロジックと idle 同期 effect が二重化している

**対象ファイル**: `frontend/src/hooks/useIntervalTimer.ts:27-31`, `63-66`

**問題**  
`status === 'idle'` になると同期 effect が `setRemainingSeconds(initialSeconds)` を実行するため、`reset()` 内の `setRemainingSeconds` が冗長。  
責務が分裂しており、`initialSeconds` が `running` 中に変化するパターン（将来の拡張など）で表示の一貫性が壊れやすい。

**修正箇所**

```ts
// 修正前
const reset = useCallback(() => {
  setStatus('idle');
  setRemainingSeconds(options.initialSeconds);
}, [options.initialSeconds]);

// 修正後（idle 同期 effect に一本化）
const reset = useCallback(() => {
  setStatus('idle');
}, []);
```

---

### C-3. interval effect の依存配列に `initialSeconds` が含まれている

**対象ファイル**: `frontend/src/hooks/useIntervalTimer.ts:33-52`

**問題**  
`[options.initialSeconds, status]` を依存配列に持つため、`running` 中に親が `initialSeconds` を変えると interval が再作成されカウントが歪む。  
現状は `running` 中 input が disabled なので発火しないが、呼び出し側の制約に不変条件を依存させている脆い設計。

**修正案**

```ts
const initialSecondsRef = useRef(options.initialSeconds);
useEffect(() => {
  initialSecondsRef.current = options.initialSeconds;
}, [options.initialSeconds]);

useEffect(() => {
  if (status !== 'running') return;
  const intervalId = window.setInterval(() => {
    setRemainingSeconds(prev => {
      if (prev <= 1) {
        window.clearInterval(intervalId);
        setStatus('idle');
        onCompleteRef.current();
        return initialSecondsRef.current;
      }
      return prev - 1;
    });
  }, 1000);
  return () => window.clearInterval(intervalId);
}, [status]); // initialSeconds を依存から除外
```

---

## 🟡 Warning（推奨修正）

### W-1. タイポ `osillator` → `oscillator`

**対象ファイル**: `frontend/src/components/shared/timer/IntervalTimer.tsx:50, 53`

ローカル変数名のタイポ。動作に影響はないが設計書・実装メモの正しい綴りと不一致。

```ts
// 修正前
const osillator = context.createOscillator();
osillator.type = 'sine';

// 修正後
const oscillator = context.createOscillator();
oscillator.type = 'sine';
```

---

### W-2. `WindowWithWebkitAudioContext` への代入が `as` 回避の精神に反する

**対象ファイル**: `frontend/src/components/shared/timer/IntervalTimer.tsx:37`

**問題**  
`Window` 型に `webkitAudioContext` が存在しないのに拡張型への代入で暗黙に型を広げており、`as` 禁止規約の精神に反する。

**修正案（型ガード化）**

```ts
function hasWebkitAudioContext(
  w: Window
): w is Window & { webkitAudioContext: typeof AudioContext } {
  return (
    'webkitAudioContext' in w &&
    typeof (w as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === 'function'
  );
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (window.AudioContext !== undefined) return window.AudioContext;
  if (hasWebkitAudioContext(window)) return window.webkitAudioContext;
  return undefined;
}
```

> **代替案（YAGNI）**: 最新 Safari は `AudioContext` を直接サポート済みのため、`webkitAudioContext` フォールバック自体を削除してシンプル化する方が KISS に沿う。

---

### W-3. `handleInputChange` が `useCallback` 化されておらず `handleComplete` と不統一

**対象ファイル**: `frontend/src/components/shared/timer/IntervalTimer.tsx:86-88`

`handleComplete` は `useCallback` で安定化しているが `handleInputChange` は素の関数。`<input>` のみへの伝播で子コンポーネント化されていないため実害はないが、コードベース内の一貫性のため統一すべき。  
むしろ `handleComplete` を素の関数に戻して両方を統一する方が KISS。

---

### W-4. `initialSeconds` のサニタイズが Hook 内にない

**対象ファイル**: `frontend/src/hooks/useIntervalTimer.ts:20`

Hook 単体で再利用される場合、負数・0・NaN が渡されても防ぐ手段がない。

```ts
// Hook 内でのサニタイズ例
const safeInitial = Math.max(1, Math.floor(options.initialSeconds));
const [remainingSeconds, setRemainingSeconds] = useState(safeInitial);
```

または「呼び出し側が正規化済みの値を渡す前提」と JSDoc で明文化する。

---

## 🔵 Info（任意対応）

### I-1. null/undefined チェックが冗長

**対象ファイル**: `frontend/src/components/shared/training/trainingSessionDetail.tsx:18-22`

`!== null && !== undefined` は `!= null` で両方カバーできる。  
実装メモ内でも `!= null` を使用しているため、規約整合のためそちらに揃えることを推奨。

```tsx
// 修正前
{session.bodyWeight !== null && session.bodyWeight !== undefined && ...}

// 修正後
{session.bodyWeight != null && ...}
```

---

### I-2. 種目数分の `setInterval` が同時稼働する

**対象ファイル**: `frontend/src/components/shared/training/trainingSessionDetail.tsx:53`

種目数 N 分の Hook がマウントされ続けるため、N 個の `setInterval` が潜在的に同時稼働しうる。  
「閉じたらタイマーリセットでよい」UX であれば `<details>` の open state を見て条件レンダリングするだけで解消できる。  
「閉じても残り時間を保持したい」要件があれば現状のままで OK。**設計書に明言がないため UX 要件を確認推奨**。

---

### I-3. 入力途中に空欄になると90秒に強制リセットされる

**対象ファイル**: `frontend/src/components/shared/timer/IntervalTimer.tsx:101-110`

`onChange` で即正規化するため、ユーザーが数字を消して打ち直す途中で `DEFAULT_SECONDS=90` に強制される。  
MVP として許容範囲だが、`onBlur` で正規化すると編集しやすくなる。

---

## 設計書チェックリスト充足状況

| チェック項目 | 状態 |
|---|---|
| `TimerStatus` を Union Type で定義（`enum` 禁止） | ✅ |
| `interface` でオブジェクト型を定義 | ✅ |
| `onCompleteRef` で最新コールバックを安定化 | ✅ |
| `any` / `as` / `enum` 不使用 | ⚠️ W-2（`WindowWithWebkitAudioContext` 代入） |
| `type="button"` をすべてのボタンに付与 | ✅ |
| `tabular-nums` で数字幅を揃える | ✅ |
| 状態別ボタン切替（idle/running/paused） | ✅ |
| `MIN_SECONDS=1` / `MAX_SECONDS=5999` / `Number.isFinite` チェック | ✅ |
| AudioContext リーク対策 | ❌ C-1（必須修正） |
| reset ロジックの一本化 | ❌ C-2（必須修正） |
| interval effect の依存配列 | ❌ C-3（必須修正） |

---

## 良かった点

- `onCompleteRef` で陳腐化コールバック問題を正しく回避しており、React Hook の罠を把握した設計
- `TimerStatus` を Union Type で定義し enum 禁止規約に準拠
- `interface` をオブジェクト型に使用し規約準拠
- 3層分離（Hook ↔ Component ↔ Presentational）が明確で、コンテナ不要の YAGNI 判断が適切
- `tabular-nums` クラスでカウントダウン中の表示揺れを防止する細かい配慮
- 全ボタンに `type="button"` を付与してフォーム内 submit 事故を防止
- `EMPTY_FREQUENCIES` 同様に `MIN_SECONDS`/`MAX_SECONDS` 定数でエッジケースを防いでいる
- 設計書（DESIGN_TIMER.md / IMPLEMENT_TIMER.md）が状態遷移表・チェックリスト込みで非常に丁寧にまとめられており、実装の追従がしやすかった
