'use client';

import React from 'react';

interface FireworksCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function FireworksCanvas({ canvasRef }: FireworksCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{
        background:
          'radial-gradient(circle at 20% 20%, rgba(57,197,187,0.15) 0%, rgba(6,8,22,1) 45%, rgba(4,6,15,1) 100%)',
      }}
    />
  );
}
