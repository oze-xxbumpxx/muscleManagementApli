import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface UseIntervalTimerOptions {
  // 1以上の整数秒。呼び出し側で正規化済みの値を渡す。
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

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
  }, [options.onComplete]);

  useEffect(() => {
    if (status === 'idle') {
      setRemainingSeconds(options.initialSeconds);
    }
  }, [options.initialSeconds, status]);

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
