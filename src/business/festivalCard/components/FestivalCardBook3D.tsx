'use client';

import React, { useMemo, useState } from 'react';
import { normalizeFestivalCardConfig } from '../core';
import type { FestivalCardConfig, FestivalCardElement, FestivalCardPage } from '../types';
import FloatingMenu from '../../navigation/FloatingMenu';
import { FestivalCardPageRenderer } from './FestivalCardPageRenderer';

export interface FestivalCardBook3DProps {
  config: FestivalCardConfig;
  className?: string;
  editable?: boolean;
  enableExportImage?: boolean;
  currentPage?: number;
  onCurrentPageChange?: (index: number) => void;
  selectedElementId?: string | null;
  onSelectedElementChange?: (elementId: string | null) => void;
  onElementChange?: (pageIndex: number, elementId: string, patch: Partial<FestivalCardElement>) => void;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`图片加载失败: ${src}`));
    image.src = src;
  });

const drawImageWithFit = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  left: number,
  top: number,
  width: number,
  height: number,
  fit: 'cover' | 'contain'
) => {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = left;
  let offsetY = top;

  if (fit === 'cover') {
    if (imageRatio > boxRatio) {
      drawHeight = height;
      drawWidth = height * imageRatio;
      offsetX = left - (drawWidth - width) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / imageRatio;
      offsetY = top - (drawHeight - height) / 2;
    }
  } else if (imageRatio > boxRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
    offsetY = top + (height - drawHeight) / 2;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
    offsetX = left + (width - drawWidth) / 2;
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const withRoundedClip = (
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
  draw: () => void
) => {
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  if (safeRadius <= 0) {
    draw();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left + safeRadius, top);
  ctx.lineTo(left + width - safeRadius, top);
  ctx.quadraticCurveTo(left + width, top, left + width, top + safeRadius);
  ctx.lineTo(left + width, top + height - safeRadius);
  ctx.quadraticCurveTo(left + width, top + height, left + width - safeRadius, top + height);
  ctx.lineTo(left + safeRadius, top + height);
  ctx.quadraticCurveTo(left, top + height, left, top + height - safeRadius);
  ctx.lineTo(left, top + safeRadius);
  ctx.quadraticCurveTo(left, top, left + safeRadius, top);
  ctx.closePath();
  ctx.clip();
  draw();
  ctx.restore();
};

const drawMultilineText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  left: number,
  top: number,
  maxWidth: number,
  lineHeight: number
) => {
  const paragraphs = text.split('\n');
  let currentY = top;
  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.split('');
    let line = '';
    for (const word of words) {
      const testLine = line + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, left, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, left, currentY);
    currentY += lineHeight;
    if (index < paragraphs.length - 1) {
      currentY += lineHeight * 0.2;
    }
  });
};

const exportPageToPng = async (page: FestivalCardPage, fileName: string) => {
  const width = 1080;
  const height = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');

  ctx.fillStyle = page.background?.color || '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const backgroundElement = page.elements.find(
    (element): element is Extract<FestivalCardElement, { type: 'image' }> => element.type === 'image' && Boolean(element.isBackground)
  );
  const backgroundImageSrc = backgroundElement?.src || page.background?.image;
  if (backgroundImageSrc) {
    const image = await loadImage(backgroundImageSrc);
    drawImageWithFit(ctx, image, 0, 0, width, height, 'cover');
  }

  const foregroundElements = page.elements.filter((element) => !(element.type === 'image' && element.isBackground));
  for (const element of foregroundElements) {
    const elementWidth = (width * (element.width ?? 70)) / 100;
    const elementHeight = element.height ? (height * element.height) / 100 : undefined;
    const centerX = (width * element.x) / 100;
    const centerY = (height * element.y) / 100;
    const left = centerX - elementWidth / 2;

    if (element.type === 'image') {
      const image = await loadImage(element.src);
      const drawHeight = elementHeight ?? elementWidth;
      const boxTop = centerY - drawHeight / 2;
      withRoundedClip(ctx, left, boxTop, elementWidth, drawHeight, element.borderRadius ?? 0, () => {
        drawImageWithFit(ctx, image, left, boxTop, elementWidth, drawHeight, element.fit || 'cover');
      });
      continue;
    }

    const fontSize = (element.fontSize || 18) * 1.5;
    ctx.fillStyle = element.color || '#f8fafc';
    ctx.font = `${element.fontWeight || 500} ${fontSize}px ${element.fontFamily || 'sans-serif'}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = (element.align || 'left') as CanvasTextAlign;
    const textX =
      element.align === 'center' ? centerX : element.align === 'right' ? left + elementWidth : left;
    drawMultilineText(ctx, element.content || '', textX, centerY - fontSize * 0.72, elementWidth, fontSize * 1.45);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('导出失败，请重试');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const FestivalCardBook3D: React.FC<FestivalCardBook3DProps> = ({
  config,
  className,
  editable = false,
  enableExportImage = !editable,
  currentPage: currentPageProp,
  onCurrentPageChange,
  selectedElementId = null,
  onSelectedElementChange,
  onElementChange,
}) => {
  const [internalCurrentPage, setInternalCurrentPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const normalized = useMemo(() => normalizeFestivalCardConfig(config), [config]);
  const pages = normalized.pages;
  const currentPage = typeof currentPageProp === 'number' ? currentPageProp : internalCurrentPage;
  const setCurrentPage = (updater: number | ((prev: number) => number)) => {
    const prev = currentPage;
    const nextValue = typeof updater === 'function' ? (updater as (prev: number) => number)(prev) : updater;
    if (typeof currentPageProp === 'number') {
      onCurrentPageChange?.(nextValue);
      return;
    }
    setInternalCurrentPage(nextValue);
    onCurrentPageChange?.(nextValue);
  };

  const canPrev = currentPage > 0;
  const canNext = currentPage < pages.length - 1;
  const currentPageData = pages[currentPage];

  const handleExportCurrentPage = async () => {
    if (!currentPageData || exporting) return;
    setExporting(true);
    try {
      const base = normalized.id || 'festival-card';
      const fileName = `${base}-page-${currentPage + 1}.png`;
      await exportPageToPng(currentPageData, fileName);
    } catch (error) {
      window.alert((error as Error).message || '导出图片失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      <div className="w-full min-h-screen px-0 py-4">
        <div className="mx-auto w-full text-center text-slate-100">
          <h3 className="mb-3 text-lg font-semibold">{normalized.coverTitle || 'Festival Card'}</h3>
        </div>

        <div className="mx-auto w-full">
          <div className="relative h-[calc(100vh-170px)] min-h-[460px]">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="absolute inset-0 transition-opacity duration-500 ease-out"
                style={{
                  opacity: index === currentPage ? 1 : 0,
                  pointerEvents: index === currentPage ? 'auto' : 'none',
                }}
              >
                <FestivalCardPageRenderer
                  page={page}
                  editable={editable && index === currentPage}
                  selectedElementId={selectedElementId}
                  onElementSelect={onSelectedElementChange}
                  onElementChange={(elementId, patch) => onElementChange?.(index, elementId, patch)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
            className="rounded-full bg-sky-300 px-5 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            下一页
          </button>
        </div>
      </div>

      {normalized.backgroundMusic?.src ? (
        <audio
          src={normalized.backgroundMusic.src}
          autoPlay={normalized.backgroundMusic.autoPlay}
          loop={normalized.backgroundMusic.loop}
          controls
          className="mt-3 w-full"
        />
      ) : null}
      {enableExportImage ? (
        <FloatingMenu
          initialPosition={{ x: 24, y: 120 }}
          trigger={
            <div className="text-lg leading-none text-slate-700" aria-hidden>
              ⌁
            </div>
          }
          menu={
            <div className="grid gap-2">
              <div className="text-xs font-semibold tracking-wide text-slate-500">贺卡工具</div>
              <button
                type="button"
                onClick={() => void handleExportCurrentPage()}
                disabled={exporting}
                className="rounded-lg bg-sky-600 px-3 py-2 text-left text-sm font-medium text-white disabled:opacity-60"
              >
                {exporting ? '导出中...' : `导出第 ${currentPage + 1} 页 PNG`}
              </button>
            </div>
          }
          triggerClassName="bg-white/95 backdrop-blur"
          menuClassName="bg-white/95 backdrop-blur"
        />
      ) : null}
    </div>
  );
};
