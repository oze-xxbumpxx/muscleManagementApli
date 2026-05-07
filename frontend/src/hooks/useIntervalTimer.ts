import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface UseIntervalTimerOptions {
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

  const start = useCallback(() => {
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setRemainingSeconds(options.initialSeconds);
  }, [options.initialSeconds]);

  return {
    remainingSeconds,
    status,
    start,
    pause,
    reset,
  };
}
