import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../utils/date';

export const useTimer = (
  autoStart = false
): {
  seconds: number;
  formatted: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  running: boolean;
} => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);

  const clear = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clear();
    }
    return clear;
  }, [running]);

  return {
    seconds,
    formatted: formatDuration(seconds),
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false);
      setSeconds(0);
    },
    running,
  };
};

export const useCountdownTimer = (initialSeconds: number, onComplete?: () => void) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      onComplete?.();
      return;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds, running, onComplete]);

  return {
    seconds,
    formatted: formatDuration(seconds),
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => {
      setRunning(false);
      setSeconds(initialSeconds);
    },
    running,
  };
};
