import { useIntervalTimer } from '@/hooks/useIntervalTimer';
import type { TimerStatus } from '@/hooks/useIntervalTimer';
import { useState } from 'react';

export interface IntervalTimerProps {
  readonly defaultSeconds?: number;
}

const DEFAULT_SECONDS = 90;
const MIN_SECONDS = 1;
const MAX_SECONDS = 5999;

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

function getTimeColor(status: TimerStatus, remainingSeconds: number): string {
  if (status === 'running' && remainingSeconds <= 10) {
    return 'text-red-600';
  }

  if (status === 'running') {
    return 'text-emerald-600';
  }

  return 'text-slate-900';
}

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

  oscillator.onended = () => {
    void context.close();
  };

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.5);
}

function normalizeSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_SECONDS;
  }

  return Math.min(Math.max(Math.floor(value), MIN_SECONDS), MAX_SECONDS);
}

export function IntervalTimer(props: IntervalTimerProps): React.JSX.Element {
  const [inputSeconds, setInputSeconds] = useState(
    normalizeSeconds(props.defaultSeconds ?? DEFAULT_SECONDS)
  );

  function handleComplete(): void {
    playBeep();
  }

  const timer = useIntervalTimer({
    initialSeconds: inputSeconds,
    onComplete: handleComplete,
  });

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setInputSeconds(normalizeSeconds(event.target.valueAsNumber));
  }

  const timeColorClassName = getTimeColor(timer.status, timer.remainingSeconds);
  const isInputDisabled = timer.status !== 'idle';

  return (
    <details className="mt-3">
      <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-700">
        インターバルタイマー
      </summary>
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="number"
              min={MIN_SECONDS}
              max={MAX_SECONDS}
              value={inputSeconds}
              onChange={handleInputChange}
              disabled={isInputDisabled}
              className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            />
            秒
          </label>
          <p className={`text-4xl font-semibold tabular-nums ${timeColorClassName}`}>
            {formatTime(timer.remainingSeconds)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {timer.status === 'idle' && (
            <button
              type="button"
              onClick={timer.start}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              開始
            </button>
          )}
          {timer.status === 'running' && (
            <>
              <button
                type="button"
                onClick={timer.pause}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                一時停止
              </button>
              <button
                type="button"
                onClick={timer.reset}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                リセット
              </button>
            </>
          )}
          {timer.status === 'paused' && (
            <>
              <button
                type="button"
                onClick={timer.start}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                再開
              </button>
              <button
                type="button"
                onClick={timer.reset}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                リセット
              </button>
            </>
          )}
        </div>
      </div>
    </details>
  );
}
