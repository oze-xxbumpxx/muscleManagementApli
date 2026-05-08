# タイマー機能 レビュー修正方針

`docs/REVIEW_TIMER.md` のレビュー結果をもとに、どこが問題で、どう直すかを実装者向けに整理する。

---

## 1. 修正の全体方針

今回のレビューで優先して直すべきなのは、主に次の3点。

| 優先度 | 指摘 | 修正対象 |
|---|---|---|
| Critical | `AudioContext` が close されずリークする | `IntervalTimer.tsx` |
| Critical | `reset` と idle 同期 effect の責務が二重化している | `useIntervalTimer.ts` |
| Critical | interval effect が `initialSeconds` に依存している | `useIntervalTimer.ts` |

タイマー機能はフロント完結の小さな機能だが、トレーニング中に何度も使われる。  
そのため「一度動く」だけではなく、長時間・複数回・複数種目で使っても状態やブラウザリソースが崩れないことを重視する。

---

## 2. C-1 `AudioContext` が close されずリークする

### 何がいけないか

現在の `playBeep` は、完了音を鳴らすたびに新しい `AudioContext` を作っている。

```ts
const context = new AudioContextConstructor();
const osillator = context.createOscillator();
const gain = context.createGain();

osillator.connect(gain);
gain.connect(context.destination);

osillator.start(context.currentTime);
osillator.stop(context.currentTime + 0.5);
```

しかし、音を鳴らし終わった後に `context.close()` を呼んでいない。  
`AudioContext` はブラウザ側の音声リソースを持つため、作りっぱなしにするとページ内に残り続ける。

トレーニングでは次のような使い方が自然に起きる。

| 状況 | 起きること |
|---|---|
| 1種目でセット間タイマーを何度も使う | 完了ごとに `AudioContext` が増える |
| 複数種目でタイマーを使う | 種目数分だけ完了音の生成機会が増える |
| 長時間ページを開きっぱなしにする | 古い `AudioContext` が解放されにくい |

その結果、ブラウザの上限やリソース制限に当たり、途中から完了音が鳴らない・音声処理が不安定になる可能性がある。

### どう直すか

音が鳴り終わったタイミングで `context.close()` を呼ぶ。  
同時に、変数名のタイポ `osillator` も `oscillator` に直す。

修正前:

```ts
function playBeep(): void {
  const AudioContextConstructor = getAudioContextConstructor();

  if (AudioContextConstructor === undefined) {
    return;
  }

  const context = new AudioContextConstructor();
  const osillator = context.createOscillator();
  const gain = context.createGain();

  osillator.connect(gain);
  gain.connect(context.destination);

  osillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

  osillator.start(context.currentTime);
  osillator.stop(context.currentTime + 0.5);
}
```

修正後:

```ts
function playBeep(): void {
  const AudioContextConstructor = getAudioContextConstructor();

  if (AudioContextConstructor === undefined) {
    return;
  }

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

  oscillator.onended = () => {
    void context.close();
  };

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.5);
}
```

### 補足

`context.close()` は Promise を返す。ここでは UI 上の後続処理に待つ必要がないため、`void context.close();` として明示的に Promise を捨てる。

もし ESLint で `onended` への代入より `addEventListener` が好まれる場合は、次の形でもよい。

```ts
oscillator.addEventListener('ended', () => {
  void context.close();
});
```

---

## 3. C-2 `reset` と idle 同期 effect の責務が二重化している

### 何がいけないか

現在の `useIntervalTimer` では、`remainingSeconds` を初期値に戻す処理が2箇所にある。

1つ目は idle 状態を監視する effect。

```ts
useEffect(() => {
  if (status === 'idle') {
    setRemainingSeconds(options.initialSeconds);
  }
}, [options.initialSeconds, status]);
```

2つ目は `reset`。

```ts
const reset = useCallback(() => {
  setStatus('idle');
  setRemainingSeconds(options.initialSeconds);
}, [options.initialSeconds]);
```

どちらも「残り秒数を初期値に戻す」という同じ責務を持っている。  
今は同じ値を入れているため大きな不具合には見えないが、将来仕様が増えたときにどちらを直せばよいか分かりにくくなる。

たとえば、将来「リセット時だけは別の値に戻す」「完了時だけ音を鳴らして初期値へ戻す」などが入ると、状態更新の入口が分散してバグの温床になる。

### どう直すか

`remainingSeconds` を初期値へ戻す責務は idle 同期 effect に一本化する。  
`reset` は「状態を idle に戻す」だけにする。

修正前:

```ts
const reset = useCallback(() => {
  setStatus('idle');
  setRemainingSeconds(options.initialSeconds);
}, [options.initialSeconds]);
```

修正後:

```ts
const reset = useCallback(() => {
  setStatus('idle');
}, []);
```

### 修正後の考え方

状態更新の流れは次のようになる。

```text
reset を押す
  ↓
status が idle になる
  ↓
idle 同期 effect が remainingSeconds を initialSeconds に戻す
```

完了時も同じ考え方に寄せると、より一貫する。

```text
0秒到達
  ↓
status が idle になる
  ↓
idle 同期 effect が remainingSeconds を initialSeconds に戻す
```

---

## 4. C-3 interval effect が `initialSeconds` に依存している

### 何がいけないか

現在の interval effect は `options.initialSeconds` を依存配列に含めている。

```ts
useEffect(() => {
  if (status !== 'running') {
    return;
  }

  const intervalId = window.setInterval(() => {
    setRemainingSeconds(prev => {
      if (prev <= 1) {
        window.clearInterval(intervalId);
        setStatus('idle');
        onCompleteRef.current();
        return options.initialSeconds;
      }

      return prev - 1;
    });
  }, 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}, [options.initialSeconds, status]);
```

この実装では、`running` 中に `initialSeconds` が変わると interval が作り直される。  
現在の UI では running 中の input を disabled にしているため起きにくいが、Hook 単体として見ると「呼び出し側が絶対に initialSeconds を変えない」ことに依存している。

Hook は再利用される可能性があるため、内部のタイマー処理はできるだけ呼び出し側の UI 制約に依存しない方が安全。

### どう直すか

`initialSeconds` の最新値は `useRef` に保持する。  
interval effect は `status` のみを依存にし、カウントダウン中に初期値変更で interval が再作成されないようにする。

修正前:

```ts
useEffect(() => {
  if (status !== 'running') {
    return;
  }

  const intervalId = window.setInterval(() => {
    setRemainingSeconds(prev => {
      if (prev <= 1) {
        window.clearInterval(intervalId);
        setStatus('idle');
        onCompleteRef.current();
        return options.initialSeconds;
      }

      return prev - 1;
    });
  }, 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}, [options.initialSeconds, status]);
```

修正後:

```ts
const initialSecondsRef = useRef(options.initialSeconds);

useEffect(() => {
  initialSecondsRef.current = options.initialSeconds;
}, [options.initialSeconds]);

useEffect(() => {
  if (status !== 'running') {
    return;
  }

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

  return () => {
    window.clearInterval(intervalId);
  };
}, [status]);
```

### さらに一貫させる場合

C-2 の方針に合わせるなら、完了時も `remainingSeconds` を直接戻さず、`status` を idle にするだけに寄せられる。

```ts
if (prev <= 1) {
  window.clearInterval(intervalId);
  setStatus('idle');
  onCompleteRef.current();
  return 0;
}
```

この場合、次の render 後に idle 同期 effect が `initialSeconds` に戻す。  
ただし一瞬 `00:00` を表示するか、即座に初期値へ戻すかは UX 判断になる。

設計書では「0秒到達時に idle に戻る（自動リセット）」なので、即座に初期値へ戻す実装でも問題ない。  
シンプルに進めるなら、上の「修正後」コードのように `return initialSecondsRef.current;` のままでよい。

---

## 5. W-1 変数名タイポ `osillator`

### 何がいけないか

`OscillatorNode` を入れる変数名が `osillator` になっている。

```ts
const osillator = context.createOscillator();
```

動作には影響しないが、正しい英単語は `oscillator`。  
音声 API の名前とズレるため、検索性と可読性が落ちる。

### どう直すか

`playBeep` 内の変数名をすべて `oscillator` に統一する。

```ts
const oscillator = context.createOscillator();

oscillator.connect(gain);
oscillator.frequency.value = 880;
oscillator.start(context.currentTime);
oscillator.stop(context.currentTime + 0.5);
```

C-1 の修正と同時に対応すればよい。

---

## 6. W-2 `webkitAudioContext` 対応の扱い

### 何がいけないか

現在は `WindowWithWebkitAudioContext` を作り、`window` をその拡張型の変数に代入している。

```ts
interface WindowWithWebkitAudioContext extends Window {
  readonly webkitAudioContext?: typeof AudioContext;
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  const audioWindow: WindowWithWebkitAudioContext = window;

  return window.AudioContext ?? audioWindow.webkitAudioContext;
}
```

`as` は使っていないため、規約上ただちにエラーではない。  
ただし、実際の `window` に `webkitAudioContext` があるかを実行時に確認しているわけではなく、型だけを広げている。

MVP としては大きな問題ではないが、型安全性をより重視するなら次のどちらかに寄せる。

### 修正案A: `webkitAudioContext` フォールバックを削除する

最新ブラウザを対象にするなら、`window.AudioContext` のみで十分な場合が多い。  
一番シンプルで、KISS に沿う。

```ts
function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext;
}
```

この場合、古い Safari では音が鳴らない可能性がある。  
ただし設計書上も `AudioContext` 未対応ブラウザは MVP では無視してよいとしている。

### 修正案B: 型ガードで `webkitAudioContext` を確認する

フォールバックを残したい場合は、実行時チェックを関数に切り出す。  
プロジェクトでは `as` を避けたいので、`Object.getOwnPropertyDescriptor` でプロパティ値を取り出すと書きやすい。

```ts
interface WindowWithWebkitAudioContext extends Window {
  readonly webkitAudioContext: typeof AudioContext;
}

function hasWebkitAudioContext(windowValue: Window): windowValue is WindowWithWebkitAudioContext {
  const descriptor = Object.getOwnPropertyDescriptor(windowValue, 'webkitAudioContext');

  return typeof descriptor?.value === 'function';
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (window.AudioContext !== undefined) {
    return window.AudioContext;
  }

  if (hasWebkitAudioContext(window)) {
    return window.webkitAudioContext;
  }

  return undefined;
}
```

### 推奨

今回は修正案Aを推奨する。  
理由は次の通り。

- 設計書では未対応ブラウザを MVP 対象外としている
- 音が鳴らなくてもタイマー本体は壊れない
- フォールバック対応のためだけに型ガードを増やすと、タイマー UI に対して実装が少し重くなる

---

## 7. W-3 `handleInputChange` と `handleComplete` の一貫性

### 何がいけないか

`handleComplete` は `useCallback` で包まれているが、`handleInputChange` は通常の関数になっている。

```ts
const handleComplete = useCallback(() => {
  playBeep();
}, []);

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
  setInputSeconds(normalizeSeconds(event.target.valueAsNumber));
};
```

現在は `handleInputChange` を子コンポーネントに渡していないため、パフォーマンス上の問題はほぼない。  
むしろ `handleComplete` だけ `useCallback` になっている理由が読み取りづらい。

### どう直すか

シンプルさを優先するなら、`handleComplete` も通常関数にする。

```ts
function handleComplete(): void {
  playBeep();
}

function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
  setInputSeconds(normalizeSeconds(event.target.valueAsNumber));
}
```

この場合、`useCallback` の import も不要になる。

```ts
import { useState } from 'react';
```

### 注意

`useIntervalTimer` 側では `onCompleteRef` に最新のコールバックを保持している。  
そのため `handleComplete` が毎 render で新しい関数になっても、タイマー interval の作り直しにはつながらない。

---

## 8. W-4 `initialSeconds` のサニタイズ

### 何がいけないか

`IntervalTimer` では `normalizeSeconds` により入力値を 1〜5999 秒へ丸めている。

```ts
const [inputSeconds, setInputSeconds] = useState(
  normalizeSeconds(props.defaultSeconds ?? DEFAULT_SECONDS)
);
```

しかし、`useIntervalTimer` 単体では `initialSeconds` の妥当性を保証していない。

```ts
const [remainingSeconds, setRemainingSeconds] = useState(options.initialSeconds);
```

この Hook が将来別のコンポーネントから使われたとき、`0`、負数、`NaN` が渡ると、タイマー表示や完了判定が崩れる可能性がある。

### どう直すか

選択肢は2つ。

#### 案A: Hook 内でもサニタイズする

Hook を再利用しやすくするなら、Hook 内で最低限の正規化を行う。

```ts
const MIN_SECONDS = 1;

function normalizeInitialSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) {
    return MIN_SECONDS;
  }

  return Math.max(Math.floor(seconds), MIN_SECONDS);
}

export function useIntervalTimer(options: UseIntervalTimerOptions): UseIntervalTimerResult {
  const initialSeconds = normalizeInitialSeconds(options.initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  // ...
}
```

この場合、`options.initialSeconds` を直接参照している箇所も `initialSeconds` または ref 化した値へ置き換える。

#### 案B: 呼び出し側の責務として明文化する

Hook を薄く保つなら、`UseIntervalTimerOptions` にコメントを追加して、正規化済みの値を渡す前提を明文化する。

```ts
export interface UseIntervalTimerOptions {
  /** 1以上の整数秒。呼び出し側で正規化済みの値を渡す。 */
  readonly initialSeconds: number;
  readonly onComplete: () => void;
}
```

### 推奨

今回の実装では案Bを推奨する。  
理由は、`IntervalTimer` が自己完結コンポーネントであり、外部から Hook が直接使われる要件がまだないため。  
将来 Hook を別 UI でも使う段階で、案Aへ広げるのが自然。

---

## 9. I-1 null/undefined チェック

### 何がいけないか

`trainingSessionDetail.tsx` では、nullable 値の判定が次のように書かれている。

```tsx
{session.bodyWeight !== null && session.bodyWeight !== undefined && (
  <p className="mt-1 text-sm text-slate-600">体重: {session.bodyWeight} kg</p>
)}
```

これは正しく動くが、記述が長くなる。  
一方で、プロジェクトの ESLint 設定では `!= null` が `eqeqeq` に引っかかるため、単純に `session.bodyWeight != null` へ戻すと lint エラーになる。

### どう直すか

現状維持でよい。  
もし読みやすくしたい場合は、小さなヘルパー関数を使う。

```ts
function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

使用例:

```tsx
{exists(session.bodyWeight) && (
  <p className="mt-1 text-sm text-slate-600">体重: {session.bodyWeight} kg</p>
)}
```

ただし、このためだけにヘルパーを追加すると少し大げさ。  
今回のタイマー修正では触らなくてよい。

---

## 10. I-2 種目数分の `setInterval` が同時稼働しうる

### 何がいけないか

`TrainingSessionDetail` では、各種目ごとに `IntervalTimer` をレンダリングしている。

```tsx
{session.exercises.map(ex => (
  <li key={ex.id} className="px-4 py-3 text-sm">
    {/* 種目情報 */}
    <IntervalTimer defaultSeconds={90} />
  </li>
))}
```

つまり、種目数分だけ `useIntervalTimer` が存在する。  
複数のタイマーを同時に開始すれば、複数の `setInterval` が同時に動く。

### これは必ず直すべきか

必須ではない。  
設計書では「種目ごとに独立したタイマー」が要件なので、複数タイマーが同時に動くこと自体は仕様として解釈できる。

ただし UX として「同時に動かすタイマーは1つだけにしたい」なら、親側で active な timer id を管理する必要がある。  
これは今回の MVP スコープを超える。

### 今回の対応

現状維持でよい。  
`setInterval` は `status === 'running'` の時だけ作られるため、表示されているだけでは interval は動かない。

---

## 11. I-3 入力途中に空欄になると90秒に戻る

### 何がいけないか

現在の入力処理は、入力変更のたびに即 `normalizeSeconds` をかけている。

```ts
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
  setInputSeconds(normalizeSeconds(event.target.valueAsNumber));
};
```

`type="number"` の入力を一度空にすると、`event.target.valueAsNumber` は `NaN` になる。  
`normalizeSeconds(NaN)` は `DEFAULT_SECONDS` を返すため、空欄にした瞬間に 90 秒へ戻る。

### どう直すか

MVP では現状維持でもよい。  
より自然な入力体験にするなら、入力中は文字列として保持し、`onBlur` で数値へ確定する。

```ts
const [inputValue, setInputValue] = useState(String(DEFAULT_SECONDS));
const inputSeconds = normalizeSeconds(Number(inputValue));

function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
  setInputValue(event.target.value);
}

function handleInputBlur(): void {
  setInputValue(String(inputSeconds));
}
```

JSX 側:

```tsx
<input
  type="number"
  min={MIN_SECONDS}
  max={MAX_SECONDS}
  value={inputValue}
  onChange={handleInputChange}
  onBlur={handleInputBlur}
  disabled={isInputDisabled}
/>
```

ただし、この変更は `inputSeconds` と表示秒数の同期が少し複雑になる。  
今回の必須修正ではなく、入力 UX を改善したいタイミングで対応すればよい。

---

## 12. 推奨修正後の `useIntervalTimer.ts`

必須指摘 C-2 / C-3 を反映した形。

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface UseIntervalTimerOptions {
  /** 1以上の整数秒。呼び出し側で正規化済みの値を渡す。 */
  readonly initialSeconds: number;
  readonly onComplete: () => void;
}

export interface UseIntervalTimerResult {
  readonly remainingSeconds: number;
  readonly status: TimerStatus;
  readonly start: () => void;
  readonly pause: () => void;
  readonly reset: () => void;
}

export function useIntervalTimer(options: UseIntervalTimerOptions): UseIntervalTimerResult {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(options.initialSeconds);
  const onCompleteRef = useRef(options.onComplete);
  const initialSecondsRef = useRef(options.initialSeconds);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  }, [options.onComplete]);

  useEffect(() => {
    initialSecondsRef.current = options.initialSeconds;
  }, [options.initialSeconds]);

  useEffect(() => {
    if (status === 'idle') {
      setRemainingSeconds(options.initialSeconds);
    }
  }, [options.initialSeconds, status]);

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

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

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    remainingSeconds,
    status,
    start,
    pause,
    reset,
  };
}
```

---

## 13. 推奨修正後の `playBeep`

C-1 / W-1 を反映し、`webkitAudioContext` フォールバックを削除してシンプルにした形。

```ts
function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext;
}

function playBeep(): void {
  const AudioContextConstructor = getAudioContextConstructor();

  if (AudioContextConstructor === undefined) {
    return;
  }

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);

  oscillator.addEventListener('ended', () => {
    void context.close();
  });

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.5);
}
```

---

## 14. 動作確認リスト

| 確認 | 手順 | 期待結果 |
|---|---|---|
| TypeScript | `cd frontend && npm run build` | `tsc` と Vite build が成功する |
| 対象 lint | `npx eslint frontend/src/hooks/useIntervalTimer.ts frontend/src/components/shared/timer/IntervalTimer.tsx frontend/src/components/shared/training/trainingSessionDetail.tsx --ext .ts,.tsx` | 対象ファイルで lint エラーがない |
| 秒数変更 | idle 状態で `10` を入力して開始 | `00:10` からカウントダウンする |
| 一時停止/再開 | running 中に一時停止し、再開する | 残り秒数を保ったまま再開する |
| リセット | running / paused 中にリセット | idle に戻り、入力値の秒数へ戻る |
| 完了音 | 0 秒まで待つ | ビープ音が鳴る |
| 完了音の連続使用 | 10 秒など短い値で複数回完了させる | 毎回ビープ音が鳴り続ける |

---

## 15. 次の Action

1. `IntervalTimer.tsx` の `playBeep` で `AudioContext` を close する
2. `osillator` を `oscillator` に修正する
3. `webkitAudioContext` フォールバックを削除するか、型ガード化する
4. `useIntervalTimer.ts` に `initialSecondsRef` を追加する
5. interval effect の依存配列を `[status]` にする
6. `reset` は `setStatus('idle')` のみにする
7. `cd frontend && npm run build` を実行する
8. 対象ファイルの ESLint と手動動作確認を行う
