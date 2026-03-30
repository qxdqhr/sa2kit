'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BubbleShooterConfig, BubbleShooterProjectile, BubbleShooterStatus } from '../../../types';
import {
  DEFAULT_BUBBLE_SHOOTER_CONFIG,
  createInitialGrid,
  findAttachSlot,
  findCollisionSlot,
  getBoardHeight,
  getBoardWidth,
  getBubblePosition,
  getNearestSlot,
  hasAnyBubble,
  hasReachedDangerLine,
  pickRandomColor,
  resolveMatches,
} from '../../../logic';

export interface BubbleShooterBoardProps {
  config?: Partial<BubbleShooterConfig>;
  className?: string;
}

const clampAim = (angle: number): number => {
  const minAngle = -Math.PI + 0.15;
  const maxAngle = -0.15;
  return Math.max(minAngle, Math.min(maxAngle, angle));
};

const drawCircle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void => {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  context.lineWidth = 1;
  context.stroke();
};

const normalizeConfig = (input?: Partial<BubbleShooterConfig>): BubbleShooterConfig => {
  return {
    ...DEFAULT_BUBBLE_SHOOTER_CONFIG,
    ...input,
    palette: input?.palette?.length ? input.palette : DEFAULT_BUBBLE_SHOOTER_CONFIG.palette,
  };
};

const BubbleShooterBoard: React.FC<BubbleShooterBoardProps> = ({ config: inputConfig, className }) => {
  const config = useMemo(() => normalizeConfig(inputConfig), [inputConfig]);
  const boardWidth = useMemo(() => getBoardWidth(config), [config]);
  const boardHeight = useMemo(() => getBoardHeight(config), [config]);
  const shooterX = boardWidth / 2;
  const shooterY = boardHeight - config.bubbleRadius - 12;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const [grid, setGrid] = useState<(string | null)[][]>(() => createInitialGrid(config));
  const [status, setStatus] = useState<BubbleShooterStatus>('ready');
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [currentColor, setCurrentColor] = useState(() => pickRandomColor(config.palette));
  const [nextColor, setNextColor] = useState(() => pickRandomColor(config.palette));
  const [projectile, setProjectile] = useState<BubbleShooterProjectile | null>(null);

  const gridRef = useRef(grid);
  const currentColorRef = useRef(currentColor);
  const nextColorRef = useRef(nextColor);
  const statusRef = useRef(status);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  useEffect(() => {
    nextColorRef.current = nextColor;
  }, [nextColor]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const restart = useCallback(() => {
    setGrid(createInitialGrid(config));
    setScore(0);
    setShots(0);
    setStatus('ready');
    setProjectile(null);
    setAimAngle(-Math.PI / 2);
    setCurrentColor(pickRandomColor(config.palette));
    setNextColor(pickRandomColor(config.palette));
    lastTsRef.current = 0;
  }, [config]);

  useEffect(() => {
    restart();
  }, [restart]);

  const settleProjectile = useCallback(
    (x: number, y: number, preferredSlot?: { row: number; col: number }) => {
      const working = gridRef.current.map((row) => [...row]);
      const attach = findAttachSlot(x, y, working, config, preferredSlot);

      if (!attach) {
        setProjectile(null);
        setStatus('lost');
        return;
      }

      const rowData = working[attach.row];
      if (!rowData || rowData[attach.col]) {
        setProjectile(null);
        setStatus('lost');
        return;
      }

      rowData[attach.col] = currentColorRef.current;
      const resolved = resolveMatches(working, attach, config);

      setGrid(resolved.grid);
      setProjectile(null);
      setShots((prev) => prev + 1);
      if (resolved.removed > 0) {
        setScore((prev) => prev + resolved.matched * 10 + resolved.dropped * 15);
      }

      const hasBubbleLeft = hasAnyBubble(resolved.grid);
      if (!hasBubbleLeft) {
        setStatus('won');
      } else if (hasReachedDangerLine(resolved.grid, config)) {
        setStatus('lost');
      } else {
        setStatus('ready');
      }

      const nextCurrent = nextColorRef.current;
      const nextQueued = pickRandomColor(config.palette);
      setCurrentColor(nextCurrent);
      setNextColor(nextQueued);
    },
    [config]
  );

  useEffect(() => {
    if (status !== 'shooting') {
      return;
    }

    const step = (timestamp: number) => {
      if (statusRef.current !== 'shooting') {
        lastTsRef.current = 0;
        return;
      }

      const previousTs = lastTsRef.current || timestamp;
      const deltaSec = Math.min((timestamp - previousTs) / 1000, 0.05);
      lastTsRef.current = timestamp;
      let shouldContinue = true;

      setProjectile((prev) => {
        if (!prev || statusRef.current !== 'shooting') {
          shouldContinue = false;
          return prev;
        }

        let nextX = prev.x + prev.vx * deltaSec;
        const nextY = prev.y + prev.vy * deltaSec;
        let nextVx = prev.vx;

        if (nextX <= config.bubbleRadius) {
          nextX = config.bubbleRadius;
          nextVx = Math.abs(nextVx);
        } else if (nextX >= boardWidth - config.bubbleRadius) {
          nextX = boardWidth - config.bubbleRadius;
          nextVx = -Math.abs(nextVx);
        }

        if (nextY <= config.topOffset + config.bubbleRadius) {
          shouldContinue = false;
          settleProjectile(nextX, config.topOffset + config.bubbleRadius, getNearestSlot(nextX, nextY, config));
          return null;
        }

        const collision = findCollisionSlot(nextX, nextY, gridRef.current, config);
        if (collision) {
          shouldContinue = false;
          settleProjectile(nextX, nextY, collision);
          return null;
        }

        return {
          ...prev,
          x: nextX,
          y: nextY,
          vx: nextVx,
        };
      });

      if (shouldContinue) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        lastTsRef.current = 0;
      }
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = 0;
    };
  }, [boardWidth, config, settleProjectile, status]);

  const shoot = useCallback(() => {
    if (status !== 'ready') {
      return;
    }

    const vx = Math.cos(aimAngle) * config.launchSpeed;
    const vy = Math.sin(aimAngle) * config.launchSpeed;
    setProjectile({
      x: shooterX,
      y: shooterY - config.bubbleRadius,
      vx,
      vy,
      color: currentColor,
    });
    setStatus('shooting');
  }, [aimAngle, config.bubbleRadius, config.launchSpeed, currentColor, shooterX, shooterY, status]);

  const updateAimFromPointer = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || status !== 'ready') {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rawAngle = Math.atan2(y - shooterY, x - shooterX);
      setAimAngle(clampAim(rawAngle));
    },
    [shooterX, shooterY, status]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateAimFromPointer(event);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    updateAimFromPointer(event);
    shoot();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, boardHeight);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    context.fillStyle = gradient;
    context.fillRect(0, 0, boardWidth, boardHeight);

    context.fillStyle = 'rgba(148, 163, 184, 0.2)';
    context.fillRect(0, shooterY - config.bubbleRadius * 1.3, boardWidth, 2);

    for (let row = 0; row < config.rows; row += 1) {
      for (let col = 0; col < config.cols; col += 1) {
        const color = grid[row]?.[col];
        if (!color) {
          continue;
        }
        const position = getBubblePosition(row, col, config);
        drawCircle(context, position.x, position.y, config.bubbleRadius - 0.5, color);
      }
    }

    const aimLength = config.bubbleRadius * 9;
    const aimX = shooterX + Math.cos(aimAngle) * aimLength;
    const aimY = shooterY + Math.sin(aimAngle) * aimLength;
    context.strokeStyle = 'rgba(71, 85, 105, 0.75)';
    context.lineWidth = 2;
    context.setLineDash([4, 6]);
    context.beginPath();
    context.moveTo(shooterX, shooterY);
    context.lineTo(aimX, aimY);
    context.stroke();
    context.setLineDash([]);

    drawCircle(context, shooterX, shooterY, config.bubbleRadius - 0.5, currentColor);

    if (projectile) {
      drawCircle(context, projectile.x, projectile.y, config.bubbleRadius - 0.5, projectile.color);
    }

    drawCircle(context, boardWidth - config.bubbleRadius * 1.6, shooterY, config.bubbleRadius * 0.72, nextColor);
    context.fillStyle = '#334155';
    context.font = '12px sans-serif';
    context.textAlign = 'right';
    context.fillText('Next', boardWidth - config.bubbleRadius * 0.5, shooterY - config.bubbleRadius * 1.05);

    if (status === 'won' || status === 'lost') {
      context.fillStyle = 'rgba(15, 23, 42, 0.48)';
      context.fillRect(0, 0, boardWidth, boardHeight);
      context.fillStyle = '#ffffff';
      context.font = 'bold 26px sans-serif';
      context.textAlign = 'center';
      context.fillText(status === 'won' ? 'You Win!' : 'Game Over', boardWidth / 2, boardHeight / 2);
    }
  }, [aimAngle, boardHeight, boardWidth, config, currentColor, grid, nextColor, projectile, shooterX, shooterY, status]);

  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap', color: '#334155' }}>
        <span>状态：{status === 'ready' ? '待发射' : status === 'shooting' ? '发射中' : status === 'won' ? '胜利' : '失败'}</span>
        <span>分数：{score}</span>
        <span>发射次数：{shots}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={boardWidth}
        height={boardHeight}
        onPointerMove={updateAimFromPointer}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%',
          maxWidth: boardWidth,
          borderRadius: 12,
          border: '1px solid #cbd5e1',
          boxShadow: '0 8px 28px rgba(15, 23, 42, 0.12)',
          touchAction: 'none',
          cursor: status === 'ready' ? 'crosshair' : 'default',
          display: 'block',
        }}
      />

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button type="button" onClick={restart} style={{ padding: '8px 12px' }}>
          重新开始
        </button>
      </div>
    </div>
  );
};

export default BubbleShooterBoard;
