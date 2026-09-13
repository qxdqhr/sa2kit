'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card } from 'sa2kit/common/ui';

interface RestCountdownProps {
  seconds: number;
  onDismiss: () => void;
}

export function RestCountdown({ seconds, onDismiss }: RestCountdownProps) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setInterval(() => {
      setLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [left]);

  useEffect(() => {
    if (left === 0) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {
        // ignore audio errors
      }
    }
  }, [left]);

  if (left <= 0) return null;

  return (
    <Card pattern="app-teal" className="fp-rest-countdown">
      <div className="fp-rest-countdown__inner">
        <span>组间休息</span>
        <strong className="fp-rest-countdown__time">{left}s</strong>
        <Button type="default" size="small" onClick={onDismiss}>
          跳过
        </Button>
      </div>
    </Card>
  );
}

function formatElapsed(startedAt: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WorkoutTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card pattern="app-green" className="fp-workout-timer">
      <span className="fp-workout-timer__label">训练时长</span>
      <strong className="fp-workout-timer__value">{formatElapsed(startedAt, now)}</strong>
    </Card>
  );
}
