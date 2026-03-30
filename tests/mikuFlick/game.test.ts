import { describe, expect, it } from 'vitest';

import {
  buildPhraseChart,
  createRuntimeNotes,
  DEFAULT_MIKU_FLICK_CONFIG,
  detectFlickDirection,
  judgeInput,
  sweepMissedNotes,
} from '../../src/business/mikuFlick/logic';

describe('mikuFlick engine logic', () => {
  it('detects basic flick direction', () => {
    expect(detectFlickDirection(0, 0, 50, 5, 10)).toBe('right');
    expect(detectFlickDirection(0, 0, -40, 0, 10)).toBe('left');
    expect(detectFlickDirection(0, 0, 0, -30, 10)).toBe('up');
    expect(detectFlickDirection(0, 0, 0, 40, 10)).toBe('down');
    expect(detectFlickDirection(0, 0, 3, 4, 10)).toBeNull();
  });

  it('judges a matching input with grade', () => {
    const chart = buildPhraseChart('みく');
    const runtime = createRuntimeNotes(chart);
    const first = runtime[0];

    if (!first) {
      throw new Error('missing first note');
    }

    const result = judgeInput(runtime, {
      kana: first.kana,
      direction: first.direction,
      inputTimeMs: first.timeMs + 20,
    }, DEFAULT_MIKU_FLICK_CONFIG);

    expect(result.ok).toBe(true);
    expect(result.grade).toBe('perfect');
    expect(runtime[0]?.judged).toBe(true);
  });

  it('sweeps timeout notes as miss', () => {
    const chart = buildPhraseChart('みく');
    const runtime = createRuntimeNotes(chart);
    const first = runtime[0];

    if (!first) {
      throw new Error('missing first note');
    }

    const misses = sweepMissedNotes(
      runtime,
      first.timeMs + DEFAULT_MIKU_FLICK_CONFIG.judgeWindows.missMs + 10,
      DEFAULT_MIKU_FLICK_CONFIG
    );

    expect(misses.length).toBeGreaterThan(0);
    expect(misses[0]?.grade).toBe('miss');
    expect(runtime[0]?.judged).toBe(true);
  });
});
