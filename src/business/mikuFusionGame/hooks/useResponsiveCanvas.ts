'use client';

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

interface ResponsiveSize {
  displayWidth: number;
  displayHeight: number;
  scale: number;
}

export function useResponsiveCanvas(
  logicalWidth: number,
  logicalHeight: number,
  containerRef: RefObject<HTMLElement>
): ResponsiveSize {
  const [size, setSize] = useState<ResponsiveSize>({
    displayWidth: logicalWidth,
    displayHeight: logicalHeight,
    scale: 1,
  });

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      if (!container || typeof window === 'undefined') {
        return;
      }

      const rect = container.getBoundingClientRect();
      const maxWidth = Math.max(280, rect.width);
      const maxHeight = Math.max(420, Math.floor(window.innerHeight * 0.78));
      const scale = Math.min(maxWidth / logicalWidth, maxHeight / logicalHeight, 1);

      setSize({
        displayWidth: Math.floor(logicalWidth * scale),
        displayHeight: Math.floor(logicalHeight * scale),
        scale,
      });
    };

    updateSize();

    const container = containerRef.current;
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (container && observer) {
      observer.observe(container);
    }

    window.addEventListener('resize', updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [containerRef, logicalWidth, logicalHeight]);

  return size;
}
