'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { FestivalCardElement, FestivalCardPage } from '../types';

const elementStyle = (element: FestivalCardElement): React.CSSProperties => ({
  position: 'absolute',
  zIndex: 2,
  left: `${element.x}%`,
  top: `${element.y}%`,
  width: `${element.width ?? 70}%`,
  height: element.height ? `${element.height}%` : undefined,
  transform: 'translate(-50%, -50%)',
});

const renderElement = (element: FestivalCardElement) => {
  if (element.type === 'text') {
    return (
      <div
        key={element.id}
        style={{
          ...elementStyle(element),
          color: element.color || '#f8fafc',
          fontSize: element.fontSize || 18,
          fontWeight: element.fontWeight || 500,
          fontFamily: element.fontFamily || 'inherit',
          textAlign: element.align || 'left',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
        }}
      >
        {element.content}
      </div>
    );
  }

  return (
    <img
      key={element.id}
      src={element.src}
      alt={element.alt || 'festival-card-image'}
      style={{
        ...elementStyle(element),
        objectFit: element.fit || 'cover',
        borderRadius: element.borderRadius || 0,
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(2, 6, 23, 0.32)',
      }}
    />
  );
};

interface FestivalCardPageRendererProps {
  page: FestivalCardPage;
  editable?: boolean;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementChange?: (elementId: string, patch: Partial<FestivalCardElement>) => void;
}

type InteractionState = {
  pointerId: number;
  elementId: string;
  mode: 'move' | 'resize';
  rect: DOMRect;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const FestivalCardPageRenderer: React.FC<FestivalCardPageRendererProps> = ({
  page,
  editable = false,
  selectedElementId = null,
  onElementSelect,
  onElementChange,
}) => {
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const backgroundElement = useMemo(
    () =>
      page.elements.find(
        (element): element is Extract<FestivalCardElement, { type: 'image' }> => element.type === 'image' && Boolean(element.isBackground)
      ),
    [page]
  );
  const foregroundElements = useMemo(
    () => page.elements.filter((element) => !(element.type === 'image' && element.isBackground)),
    [page]
  );

  const updateElementByPointer = (element: FestivalCardElement, interaction: InteractionState, clientX: number, clientY: number) => {
    if (!onElementChange || interaction.rect.width <= 0 || interaction.rect.height <= 0) return;
    const xPercent = clamp(((clientX - interaction.rect.left) / interaction.rect.width) * 100, 0, 100);
    const yPercent = clamp(((clientY - interaction.rect.top) / interaction.rect.height) * 100, 0, 100);
    if (interaction.mode === 'move') {
      onElementChange(element.id, { x: xPercent, y: yPercent });
      return;
    }

    const nextWidth = clamp(Math.abs(xPercent - element.x) * 2, 4, 100);
    if (element.type === 'image') {
      const nextHeight = clamp(Math.abs(yPercent - element.y) * 2, 4, 100);
      onElementChange(element.id, { width: nextWidth, height: nextHeight });
      return;
    }
    onElementChange(element.id, { width: nextWidth });
  };

  const beginInteraction = (
    event: React.PointerEvent<HTMLElement>,
    elementId: string,
    mode: InteractionState['mode']
  ) => {
    if (!editable || !stageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = stageRef.current.getBoundingClientRect();
    interactionRef.current = {
      pointerId: event.pointerId,
      elementId,
      mode,
      rect,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onElementSelect?.(elementId);
    if (mode === 'move') {
      setDraggingElementId(elementId);
      setResizingElementId(null);
    } else {
      setResizingElementId(elementId);
      setDraggingElementId(null);
    }
    const element = foregroundElements.find((item) => item.id === elementId);
    if (element) {
      updateElementByPointer(element, interactionRef.current, event.clientX, event.clientY);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    const element = foregroundElements.find((item) => item.id === interaction.elementId);
    if (!element) return;
    updateElementByPointer(element, interaction, event.clientX, event.clientY);
  };

  const endInteraction = (event: React.PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    interactionRef.current = null;
    setDraggingElementId(null);
    setResizingElementId(null);
  };

  return (
    <div
      ref={stageRef}
      onPointerMove={editable ? handlePointerMove : undefined}
      onPointerUp={editable ? endInteraction : undefined}
      onPointerCancel={editable ? endInteraction : undefined}
      onClick={editable ? () => onElementSelect?.(null) : undefined}
      className={`relative h-full w-full overflow-hidden rounded-2xl ${editable ? 'touch-none' : ''}`}
      style={{
        backgroundColor: page.background?.color || '#0f172a',
        backgroundImage: backgroundElement
          ? `url(${backgroundElement.src})`
          : page.background?.image
            ? `url(${page.background.image})`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/20" />
      {foregroundElements.map((element) => {
        if (!editable) {
          return renderElement(element);
        }
        const isSelected = selectedElementId === element.id;
        const isDragging = draggingElementId === element.id;
        const isResizing = resizingElementId === element.id;
        return (
          <div
            key={element.id}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onElementSelect?.(element.id);
            }}
            onPointerDown={(event) => beginInteraction(event, element.id, 'move')}
            className={`absolute select-none touch-none rounded-md ${
              isDragging ? 'cursor-grabbing' : isResizing ? 'cursor-se-resize' : 'cursor-grab'
            } ${isSelected ? 'ring-2 ring-sky-300' : 'ring-1 ring-white/40'}`}
            style={{
              ...elementStyle(element),
              zIndex: isSelected ? 4 : 2,
            }}
          >
            {element.type === 'text' ? (
              <div
                className="rounded-md bg-black/20 px-2 py-1"
                style={{
                  color: element.color || '#f8fafc',
                  fontSize: element.fontSize || 18,
                  fontWeight: element.fontWeight || 500,
                  fontFamily: element.fontFamily || 'inherit',
                  textAlign: element.align || 'left',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {element.content}
              </div>
            ) : (
              <img
                src={element.src}
                alt={element.alt || 'festival-card-image'}
                draggable={false}
                className="pointer-events-none h-full w-full"
                style={{
                  objectFit: element.fit || 'cover',
                  borderRadius: element.borderRadius || 0,
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(2, 6, 23, 0.32)',
                }}
              />
            )}
            <button
              type="button"
              aria-label="resize"
              onPointerDown={(event) => beginInteraction(event, element.id, 'resize')}
              className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border border-white bg-sky-500 shadow"
            />
          </div>
        );
      })}
    </div>
  );
};
