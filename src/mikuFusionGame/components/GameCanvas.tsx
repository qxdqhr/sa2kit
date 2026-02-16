import React from 'react';
import type { PointerEvent, RefObject } from 'react';

interface GameCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  onPointerMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLCanvasElement>) => void;
}

export function GameCanvas({
  canvasRef,
  width,
  height,
  displayWidth,
  displayHeight,
  onPointerMove,
  onPointerDown,
  onPointerUp,
}: GameCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-cyan-200 bg-cyan-50 shadow-sm"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        maxWidth: '100%',
        touchAction: 'none',
      }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
