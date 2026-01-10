'use client';

import React, { useEffect, useRef, useState } from "react";
import { clsx } from 'clsx';

// CollisionBalls相关的类型定义
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  text?: string;
  isDragging?: boolean;
}

export interface CollisionBallsConfig {
  balls: {
    id: string;
    label: string;
    color: string;
    size: number;
  }[];
  width: number;
  height: number;
}

interface CollisionBallsProps {
  collisionBallsConfig: CollisionBallsConfig;
}

export const CollisionBalls: React.FC<CollisionBallsProps> = ({
  collisionBallsConfig: {
    balls,
    width,
    height
  },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [draggedBall, setDraggedBall] = useState<Ball | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // 更新canvas尺寸
  const updateCanvasSize = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      console.error('Container or canvas not found');
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    console.log('Container size:', { containerWidth, containerHeight });
    
    // 设置canvas的实际尺寸
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // 设置canvas的显示尺寸
    canvas.style.width = (containerWidth) + 'px';
    canvas.style.height = (containerHeight) + 'px';
    
    console.log('Canvas size updated:', {
      width: canvas.width,
      height: canvas.height,
      containerWidth,
      containerHeight
    });
  };

  // 初始化小球
  const initBalls = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found during ball initialization');
      return [];
    }

    console.log('Initializing balls with canvas size:', {
      width: canvas.width,
      height: canvas.height
    });

    return balls.map((ballConfig) => ({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: ballConfig.size,
      color: ballConfig.color,
      text: ballConfig.label,
      isDragging: false
    }));
  };

  // 添加resize监听
  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
      updateCanvasSize();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // 初始设置尺寸
      updateCanvasSize();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // 动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    console.log('Starting animation setup...');
    
    // 确保canvas尺寸已更新
    updateCanvasSize();
    
    // 初始化小球
    ballsRef.current = initBalls();
    console.log('Balls initialized:', ballsRef.current);

    let lastTime = performance.now();
    let frameCount = 0;

    const animate = (currentTime: number) => {
      try {
        // 计算帧率
        frameCount++;
        if (currentTime - lastTime >= 1000) {
          console.log('FPS: ' + (frameCount));
          frameCount = 0;
          lastTime = currentTime;
        }

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 更新和绘制每个小球
        ballsRef.current.forEach((ball) => {
          if (!ball.isDragging) {
            updatePosition(ball, canvas.width, canvas.height);
          }

          for (let i = 0; i < ballsRef.current.length; i++) {
            for (let j = i + 1; j < ballsRef.current.length; j++) {
              const ball1 = ballsRef.current[i];
              const ball2 = ballsRef.current[j];
              if (ball1 && ball2) {
                checkCollision(ball1, ball2);
              }
            }
          }

          draw(ctx, ball);
        });

        // 继续动画循环
        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error('Animation error:', error);
      }
    };

    // 启动动画
    console.log('Starting animation loop...');
    animationRef.current = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      console.log('Cleaning up animation...');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  const shake = () => {
    setIsShaking(true);
    ballsRef.current.forEach((ball) => {
      ball.vx = (Math.random() - 0.5) * 10;
      ball.vy = (Math.random() - 0.5) * 10;
    });
    setTimeout(() => setIsShaking(false), 200);
  };

  const slowdown = () => {
    setIsShaking(true);
    ballsRef.current.forEach((ball) => {
      ball.vx = ball.vx * 0.5;
      ball.vy = ball.vy * 0.5;
    });
    setTimeout(() => setIsShaking(false), 200);
  };

  const checkCollision = (ball1: Ball, ball2: Ball) => {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball1.radius + ball2.radius) {
      const angle = Math.atan2(dy, dx);
      const overlap = (ball1.radius + ball2.radius - distance) / 2;

      if (ball1.isDragging || ball2.isDragging) {
        const draggedBall = ball1.isDragging ? ball1 : ball2;
        const otherBall = ball1.isDragging ? ball2 : ball1;

        otherBall.x += (draggedBall === ball1 ? 1 : -1) * overlap * Math.cos(angle);
        otherBall.y += (draggedBall === ball1 ? 1 : -1) * overlap * Math.sin(angle);

        const pushForce = 2;
        otherBall.vx = (draggedBall === ball1 ? -1 : 1) * Math.cos(angle) * pushForce;
        otherBall.vy = (draggedBall === ball1 ? -1 : 1) * Math.sin(angle) * pushForce;

        return;
      }

      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      const vx1 = ball1.vx * cos + ball1.vy * sin;
      const vy1 = ball1.vy * cos - ball1.vx * sin;
      const vx2 = ball2.vx * cos + ball2.vy * sin;
      const vy2 = ball2.vy * cos - ball2.vx * sin;

      const newVx1 = vx2;
      const newVx2 = vx1;

      ball1.vx = newVx1 * cos - vy1 * sin;
      ball1.vy = vy1 * cos + newVx1 * sin;
      ball2.vx = newVx2 * cos - vy2 * sin;
      ball2.vy = vy2 * cos + newVx2 * sin;

      ball1.x -= overlap * Math.cos(angle);
      ball1.y -= overlap * Math.sin(angle);
      ball2.x += overlap * Math.cos(angle);
      ball2.y += overlap * Math.sin(angle);
    }
  };

  const updatePosition = (ball: Ball, width: number, height: number) => {
    const handleBoundaryCollision = (
      velocity: number,
      position: number,
      boundary: number,
      radius: number,
    ): [number, number] => {
      let newVelocity = velocity;
      let newPosition = position;

      if (position - radius < 0) {
        newPosition = radius;
        newVelocity = Math.abs(velocity);
      } else if (position + radius > boundary) {
        newPosition = boundary - radius;
        newVelocity = -Math.abs(velocity);
      }

      return [newVelocity, newPosition];
    };

    const [newVx, newX] = handleBoundaryCollision(
      ball.vx,
      ball.x,
      width,
      ball.radius,
    );
    const [newVy, newY] = handleBoundaryCollision(
      ball.vy,
      ball.y,
      height,
      ball.radius,
    );

    ball.vx = newVx;
    ball.vy = newVy;
    ball.x = newX;
    ball.y = newY;
  };

  const draw = (ctx: CanvasRenderingContext2D, ball: Ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();

    if (ball.text) {
      ctx.font = "14px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ball.text, ball.x, ball.y);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(event);
    const ball = ballsRef.current.find((b) => {
      const dx = b.x - mousePos.x;
      const dy = b.y - mousePos.y;
      return Math.sqrt(dx * dx + dy * dy) < b.radius;
    });

    if (ball) {
      ball.isDragging = true;
      setDraggedBall(ball);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(event);
    setMousePos(mousePos);

    if (draggedBall) {
      draggedBall.x = mousePos.x;
      draggedBall.y = mousePos.y;
      draggedBall.vx = 0;
      draggedBall.vy = 0;
    }
  };

  const handleMouseUp = () => {
    if (draggedBall) {
      draggedBall.isDragging = false;
      setDraggedBall(null);
    }
  };

  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: '100%',
            display: 'block' // 确保canvas正确显示
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={shake}
          className={clsx('px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors', isShaking ? "animate-pulse" : "")}
        >
          摇一摇
        </button>
        <button
          onClick={slowdown}
          className={clsx('px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors', isShaking ? "animate-pulse" : "")}
        >
          减速
        </button>
      </div>
    </div>
  );
};

export default CollisionBalls;
