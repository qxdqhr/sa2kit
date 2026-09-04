'use client';

import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from 'sa2kit/common/ui';
import { buildCalendarImageInput, type CalendarEventFromImageOutput } from '../services/calendarAiService';
import { useCalendarEventFromImage } from '../hooks/useCalendarEventFromImage';

interface ImageToEventButtonProps {
  onResult: (draft: CalendarEventFromImageOutput, previewUrl: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ImageToEventButton({
  onResult,
  onError,
  disabled = false,
  className = '',
}: ImageToEventButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { analyzeFromImage, loading } = useCalendarEventFromImage();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('请选择图片文件');
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    try {
      const { imageBase64, mimeType } = await buildCalendarImageInput(file);
      const draft = await analyzeFromImage({
        imageBase64,
        mimeType,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language || 'zh-CN',
        referenceDate: new Date().toISOString(),
      });
      onResult(draft, previewUrl);
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      onError(err instanceof Error ? err.message : '识图失败，请重试');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="default"
        size="small"
        disabled={disabled}
        loading={loading}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {!loading && <ImagePlus className="h-4 w-4" />}
        {loading ? '识别中…' : '从图片识别'}
      </Button>
    </>
  );
}
