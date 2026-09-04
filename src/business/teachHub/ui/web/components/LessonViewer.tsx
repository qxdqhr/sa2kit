'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LessonReadingProgress } from './LessonReadingProgress';
import { useLessonReaderSettings } from '../hooks/useLessonReaderSettings';
import { isVerticalReaderPosition } from '../utils/lessonReaderSettings';
import { cn } from '../utils/cn';
import {
  thLessonViewerColumn,
  thLessonViewerFrame,
  thLessonViewerFrameSlot,
  thLessonProgressOverlay,
  thLessonProgressOverlayLeft,
  thLessonProgressOverlayRight,
  thLessonViewerWrap,
} from '../styles/tw';

type LessonViewerProps = {
  src: string;
  title: string;
};

async function loadLessonHtml(src: string): Promise<string> {
  const response = await fetch(src, { credentials: 'include', cache: 'no-store' });
  const body = await response.text();
  if (!response.ok) {
    let message = `加载失败 (${response.status})`;
    try {
      const data = JSON.parse(body) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // 非 JSON 错误体，沿用默认文案
    }
    throw new Error(message);
  }
  return body;
}

function getIframeDocument(iframe: HTMLIFrameElement | null): Document | null {
  try {
    return iframe?.contentDocument ?? null;
  } catch {
    return null;
  }
}

function readScrollProgress(doc: Document): number {
  const root = doc.documentElement;
  const body = doc.body;
  const scrolling = doc.scrollingElement ?? root;
  const scrollTop = scrolling.scrollTop || root.scrollTop || body.scrollTop || 0;
  const scrollHeight = Math.max(
    scrolling.scrollHeight,
    root.scrollHeight,
    body.scrollHeight,
    1,
  );
  const clientHeight = scrolling.clientHeight || root.clientHeight || body.clientHeight || 1;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  if (maxScroll <= 0) return 100;
  return Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
}

function setScrollProgress(doc: Document, percent: number): void {
  const root = doc.documentElement;
  const body = doc.body;
  const scrolling = doc.scrollingElement ?? root;
  const scrollHeight = Math.max(
    scrolling.scrollHeight,
    root.scrollHeight,
    body.scrollHeight,
    1,
  );
  const clientHeight = scrolling.clientHeight || root.clientHeight || body.clientHeight || 1;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  const top = (percent / 100) * maxScroll;
  scrolling.scrollTop = top;
  root.scrollTop = top;
  body.scrollTop = top;
}

export function LessonViewer({ src, title }: LessonViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [percent, setPercent] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const draggingRef = useRef(false);
  const { settings } = useLessonReaderSettings();
  const { barPosition, barExpanded: defaultBarExpanded } = settings;
  const [barExpanded, setBarExpanded] = useState(defaultBarExpanded);
  const vertical = isVerticalReaderPosition(barPosition);
  const showBarFirst = barPosition === 'top' || barPosition === 'left';

  useEffect(() => {
    let mounted = true;
    setHtml(null);
    setError('');
    setPercent(0);

    void loadLessonHtml(src)
      .then((content) => {
        if (mounted) setHtml(content);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载课时失败');
        }
      });

    return () => {
      mounted = false;
    };
  }, [src]);

  const syncProgressFromScroll = useCallback(() => {
    if (draggingRef.current) return;
    const doc = getIframeDocument(iframeRef.current);
    if (!doc) return;
    setPercent(readScrollProgress(doc));
  }, []);

  const bindScrollTracking = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = getIframeDocument(iframe);
    const win = iframe?.contentWindow ?? null;
    if (!doc) return undefined;

    const onScroll = () => syncProgressFromScroll();
    doc.addEventListener('scroll', onScroll, { passive: true, capture: true });
    win?.addEventListener('scroll', onScroll, { passive: true });

    let wheelFrame = 0;
    const onWheel = () => {
      if (wheelFrame) cancelAnimationFrame(wheelFrame);
      wheelFrame = requestAnimationFrame(() => {
        wheelFrame = 0;
        onScroll();
      });
    };
    win?.addEventListener('wheel', onWheel, { passive: true });

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(onScroll)
      : null;
    if (doc.body && observer) observer.observe(doc.body);
    if (doc.documentElement && observer) observer.observe(doc.documentElement);

    onScroll();
    const retry = window.setTimeout(onScroll, 400);
    const retry2 = window.setTimeout(onScroll, 1200);

    return () => {
      doc.removeEventListener('scroll', onScroll, true);
      win?.removeEventListener('scroll', onScroll);
      win?.removeEventListener('wheel', onWheel);
      observer?.disconnect();
      window.clearTimeout(retry);
      window.clearTimeout(retry2);
      if (wheelFrame) cancelAnimationFrame(wheelFrame);
    };
  }, [syncProgressFromScroll]);

  useEffect(() => {
    if (!html) return undefined;
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    let cleanup: (() => void) | undefined;

    const attach = () => {
      cleanup?.();
      cleanup = bindScrollTracking();
    };

    iframe.addEventListener('load', attach);
    if (iframe.contentDocument?.readyState === 'complete') {
      attach();
    }

    return () => {
      iframe.removeEventListener('load', attach);
      cleanup?.();
    };
  }, [html, bindScrollTracking]);

  useEffect(() => {
    setBarExpanded(defaultBarExpanded);
  }, [src, defaultBarExpanded]);

  useEffect(() => {
    draggingRef.current = false;
    let frame = 0;
    let frame2 = 0;
    frame = requestAnimationFrame(() => {
      syncProgressFromScroll();
      frame2 = requestAnimationFrame(syncProgressFromScroll);
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(frame2);
    };
  }, [barExpanded, barPosition, syncProgressFromScroll]);

  const handleSliderChange = (value: number) => {
    draggingRef.current = true;
    setPercent(value);
    const doc = getIframeDocument(iframeRef.current);
    if (doc) setScrollProgress(doc, value);
  };

  const endDragging = () => {
    draggingRef.current = false;
    syncProgressFromScroll();
  };

  const handleExpandedChange = (next: boolean) => {
    draggingRef.current = false;
    setBarExpanded(next);
    requestAnimationFrame(() => {
      syncProgressFromScroll();
    });
  };

  const progressBar = (
    <LessonReadingProgress
      position={barPosition}
      expanded={barExpanded}
      percent={percent}
      onPercentChange={handleSliderChange}
      onDragEnd={endDragging}
      onExpandedChange={handleExpandedChange}
    />
  );

  if (error) {
    return <p className="p-4 text-sm text-red-600">{error}</p>;
  }

  if (!html) {
    return <p className="p-4 text-sm text-[#7a6f5c]">加载课时内容…</p>;
  }

  const iframe = (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title={title}
      className={thLessonViewerFrame}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );

  return (
    <div className={cn(thLessonViewerWrap, thLessonViewerColumn)}>
      {!vertical && showBarFirst ? <div className="shrink-0">{progressBar}</div> : null}
      <div className={cn(thLessonViewerFrameSlot, vertical && 'relative')}>
        {iframe}
        {vertical ? (
          <div
            className={cn(
              thLessonProgressOverlay,
              barPosition === 'left' ? thLessonProgressOverlayLeft : thLessonProgressOverlayRight,
            )}
          >
            {progressBar}
          </div>
        ) : null}
      </div>
      {!vertical && !showBarFirst ? <div className="shrink-0">{progressBar}</div> : null}
    </div>
  );
}
