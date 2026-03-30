import React, { useMemo, useState } from 'react';
import { buildSolvedTiles, moveTile, shuffleSolvable } from '../../../logic';
import type { HuarongdaoConfig, HuarongdaoGameState } from '../../../types';
import HuarongdaoBoard from '../components/HuarongdaoBoard';

export interface HuarongdaoGamePageProps {
  config: HuarongdaoConfig;
}

const HuarongdaoGamePage: React.FC<HuarongdaoGamePageProps> = ({ config }) => {
  const initial = useMemo<HuarongdaoGameState>(() => {
    const tiles = config.startMode === 'custom-layout' && config.initialTiles?.length === config.rows * config.cols
      ? config.initialTiles
      : shuffleSolvable(config.rows, config.cols, config.shuffleSteps);
    return {
      tiles,
      rows: config.rows,
      cols: config.cols,
      moveCount: 0,
      startedAt: Date.now(),
      isSolved: false,
    };
  }, [config]);

  const [state, setState] = useState(initial);

  const reset = () => {
    setState({
      ...state,
      tiles: shuffleSolvable(config.rows, config.cols, config.shuffleSteps),
      moveCount: 0,
      startedAt: Date.now(),
      finishedAt: undefined,
      isSolved: false,
    });
  };

  const solveNow = () => {
    setState((prev) => ({ ...prev, tiles: buildSolvedTiles(config.rows, config.cols), isSolved: true, finishedAt: Date.now() }));
  };

  const durationSec = Math.floor(((state.finishedAt || Date.now()) - state.startedAt) / 1000);

  return (
    <section>
      <h2>{config.name}</h2>
      <p>步数：{state.moveCount} ｜ 用时：{durationSec}s {state.isSolved ? '｜已通关 🎉' : ''}</p>
      <HuarongdaoBoard
        tiles={state.tiles}
        rows={state.rows}
        cols={state.cols}
        imageUrl={config.sourceImageUrl}
        onClickTile={(idx) => setState((prev) => moveTile(prev, idx))}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={reset}>重新打乱</button>
        <button onClick={solveNow}>一键完成(测试)</button>
      </div>
      {config.showReference ? (
        <div style={{ marginTop: 12 }}>
          <div>参考图：</div>
          <img src={config.sourceImageUrl} alt="reference" style={{ width: 180, border: '1px solid #ccc' }} />
        </div>
      ) : null}
    </section>
  );
};

export default HuarongdaoGamePage;
