import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyJudgeToScore,
  buildPhraseChart,
  calculateAccuracy,
  createInitialScore,
  createMikuFlickClock,
  createRuntimeNotes,
  DEFAULT_MIKU_FLICK_CONFIG,
  DEFAULT_MIKU_FLICK_KANA_KEYS,
  detectFlickDirection,
  getDirectionArrow,
  getNextExpectedNote,
  judgeInput,
  normalizeChart,
  sweepMissedNotes,
} from '../../../logic';
import type {
  MikuFlickChart,
  MikuFlickConfig,
  MikuFlickDirection,
  MikuFlickRuntimeNote,
  MikuFlickScoreState,
  MikuFlickStatus,
} from '../../../types';

export interface MikuFlickGameProps {
  phrase?: string;
  chart?: MikuFlickChart;
  config?: Partial<MikuFlickConfig>;
}

interface PointerStart {
  x: number;
  y: number;
  kana: string;
}

const defaultPhrase = 'みくみくにしてあげるよ';

const badgeStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: 10,
  padding: '0.4rem 0.65rem',
  background: '#ffffff',
  minWidth: 72,
};

const laneHeight = 300;

const getStatusText = (status: MikuFlickStatus): string => {
  if (status === 'ready') {
    return '待开始';
  }
  if (status === 'playing') {
    return '进行中';
  }
  if (status === 'paused') {
    return '已暂停';
  }
  return '已结束';
};

const MikuFlickGame: React.FC<MikuFlickGameProps> = ({
  phrase = defaultPhrase,
  chart,
  config,
}) => {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_MIKU_FLICK_CONFIG, ...config }),
    [config]
  );

  const normalizedChart = useMemo(() => {
    if (chart) {
      return normalizeChart(chart);
    }
    return normalizeChart(buildPhraseChart(phrase, mergedConfig));
  }, [chart, phrase, mergedConfig]);

  const [notes, setNotes] = useState<MikuFlickRuntimeNote[]>(() => createRuntimeNotes(normalizedChart));
  const [status, setStatus] = useState<MikuFlickStatus>('ready');
  const [score, setScore] = useState<MikuFlickScoreState>(createInitialScore());
  const [nowMs, setNowMs] = useState(0);
  const [feedback, setFeedback] = useState('点击开始，然后在对应假名键上滑动');

  const pointerStartRef = useRef<PointerStart | null>(null);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef(createMikuFlickClock());

  const expectedNote = useMemo(() => getNextExpectedNote(notes), [notes]);

  const visibleNotes = useMemo(() => {
    return notes.filter((note) => {
      if (note.judged) {
        return false;
      }
      const delta = note.timeMs - nowMs;
      return delta <= mergedConfig.previewWindowMs && delta >= -mergedConfig.judgeWindows.missMs;
    });
  }, [notes, nowMs, mergedConfig.previewWindowMs, mergedConfig.judgeWindows.missMs]);

  const accuracy = useMemo(() => calculateAccuracy(score), [score]);

  useEffect(() => {
    clockRef.current.stop();
    setNotes(createRuntimeNotes(normalizedChart));
    setStatus('ready');
    setScore(createInitialScore());
    setNowMs(0);
    setFeedback('谱面已更新，点击开始后游玩');
  }, [normalizedChart]);

  useEffect(() => {
    if (status !== 'playing') {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const current = clockRef.current.getTimeMs();
      setNowMs(current);

      setNotes((prev) => {
        const next = prev.map((item) => ({ ...item }));
        const missedResults = sweepMissedNotes(next, current, mergedConfig);

        if (missedResults.length > 0) {
          setScore((prevScore) => {
            let nextScore = prevScore;
            missedResults.forEach((result) => {
              nextScore = applyJudgeToScore(nextScore, result);
            });
            return nextScore;
          });
          setFeedback(`Miss x${missedResults.length}`);
        }

        const allDone = next.every((item) => item.judged);
        if (allDone) {
          clockRef.current.pause();
          setStatus('ended');
          setFeedback('谱面结束，点击重开可再次挑战');
        }

        return next;
      });

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, mergedConfig]);

  const startGame = () => {
    const runtimeNotes = createRuntimeNotes(normalizedChart);
    setNotes(runtimeNotes);
    setScore(createInitialScore());
    setNowMs(0);
    setFeedback('开始！请按音符提示进行滑动');
    clockRef.current.start();
    setStatus('playing');
  };

  const pauseOrResume = () => {
    if (status === 'playing') {
      clockRef.current.pause();
      setStatus('paused');
      setFeedback('已暂停');
      return;
    }
    if (status === 'paused') {
      clockRef.current.resume();
      setStatus('playing');
      setFeedback('继续');
    }
  };

  const resetGame = () => {
    clockRef.current.stop();
    setStatus('ready');
    setNotes(createRuntimeNotes(normalizedChart));
    setScore(createInitialScore());
    setNowMs(0);
    setFeedback('已重置，点击开始重新游玩');
  };

  const submitInput = (kana: string, direction: MikuFlickDirection) => {
    if (status !== 'playing') {
      return;
    }

    const inputTime = clockRef.current.getTimeMs();

    setNotes((prev) => {
      const next = prev.map((item) => ({ ...item }));
      const result = judgeInput(next, {
        kana,
        direction,
        inputTimeMs: inputTime,
      }, mergedConfig);

      setScore((prevScore) => applyJudgeToScore(prevScore, result));

      if (result.ok) {
        const gradeText = result.grade === 'perfect' ? 'Perfect' : result.grade === 'great' ? 'Great' : 'Good';
        setFeedback(`${gradeText} ${kana}${getDirectionArrow(direction)}`);
      } else if (expectedNote) {
        setFeedback(`Miss 预期 ${expectedNote.kana}${getDirectionArrow(expectedNote.direction)}`);
      } else {
        setFeedback('Miss');
      }

      return next;
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>, kana: string) => {
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      kana,
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const pointer = pointerStartRef.current;
    if (!pointer) {
      return;
    }

    const direction = detectFlickDirection(
      pointer.x,
      pointer.y,
      event.clientX,
      event.clientY,
      mergedConfig.flickThresholdPx
    );

    if (!direction) {
      setFeedback('滑动距离不足，请更明显地划动');
      return;
    }

    submitInput(pointer.kana, direction);
  };

  const lastNoteTime = normalizedChart.notes[normalizedChart.notes.length - 1]?.timeMs || 0;

  return (
    <section
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '1rem',
        display: 'grid',
        gap: '0.9rem',
        background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={badgeStyle}>状态：{getStatusText(status)}</div>
        <div style={badgeStyle}>得分：{score.score}</div>
        <div style={badgeStyle}>连击：{score.combo}</div>
        <div style={badgeStyle}>最大连击：{score.maxCombo}</div>
        <div style={badgeStyle}>准确率：{(accuracy * 100).toFixed(1)}%</div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={startGame}
          disabled={status === 'playing'}
          style={{ borderRadius: 8, border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff', padding: '0.5rem 0.8rem', cursor: status === 'playing' ? 'not-allowed' : 'pointer' }}
        >
          开始
        </button>
        <button
          type="button"
          onClick={pauseOrResume}
          disabled={status !== 'playing' && status !== 'paused'}
          style={{ borderRadius: 8, border: '1px solid #8b5cf6', background: '#8b5cf6', color: '#fff', padding: '0.5rem 0.8rem', cursor: status !== 'playing' && status !== 'paused' ? 'not-allowed' : 'pointer' }}
        >
          {status === 'paused' ? '继续' : '暂停'}
        </button>
        <button
          type="button"
          onClick={resetGame}
          style={{ borderRadius: 8, border: '1px solid #94a3b8', background: '#fff', color: '#0f172a', padding: '0.5rem 0.8rem', cursor: 'pointer' }}
        >
          重置
        </button>
      </div>

      <div style={{ borderRadius: 8, border: '1px dashed #cbd5e1', padding: '0.65rem 0.8rem', background: '#fff' }}>
        <strong>提示：</strong> {feedback}
      </div>

      <div
        style={{
          position: 'relative',
          height: laneHeight,
          borderRadius: 10,
          border: '1px solid #cbd5e1',
          background: 'linear-gradient(180deg, #ecfeff 0%, #eff6ff 100%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 40,
            borderTop: '3px solid #ef4444',
          }}
        />
        {visibleNotes.map((note) => {
          const delta = note.timeMs - nowMs;
          const progress = 1 - delta / mergedConfig.scrollWindowMs;
          const clamped = Math.max(0, Math.min(1, progress));
          const y = clamped * (laneHeight - 60);

          return (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                left: `${8 + (DEFAULT_MIKU_FLICK_KANA_KEYS.indexOf(note.kana) % 5) * 19}%`,
                bottom: `${52 + y}px`,
                transform: 'translateX(-50%)',
                borderRadius: 8,
                border: '1px solid #93c5fd',
                background: '#ffffff',
                padding: '0.2rem 0.4rem',
                fontSize: '0.84rem',
                fontWeight: 700,
              }}
            >
              {note.kana}{getDirectionArrow(note.direction)}
            </div>
          );
        })}
      </div>

      <div>
        <strong style={{ display: 'block', marginBottom: 8 }}>假名键盘（按住并滑动）</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.5rem' }}>
          {DEFAULT_MIKU_FLICK_KANA_KEYS.map((kana) => (
            <button
              key={kana}
              type="button"
              onPointerDown={(event) => handlePointerDown(event, kana)}
              onPointerUp={handlePointerUp}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '0.65rem 0.5rem',
                userSelect: 'none',
              }}
            >
              {kana}
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: '#475569', fontSize: '0.9rem' }}>
        BPM：{normalizedChart.bpm}｜音符：{normalizedChart.notes.length}｜当前时间：{Math.max(0, nowMs).toFixed(0)}ms / {(lastNoteTime + mergedConfig.judgeWindows.missMs).toFixed(0)}ms
      </div>
      <div style={{ color: '#475569', fontSize: '0.9rem' }}>
        统计：Perfect {score.perfect} · Great {score.great} · Good {score.good} · Miss {score.miss}
      </div>
    </section>
  );
};

export default MikuFlickGame;
