import React from 'react';
import { cn } from '../utils';

export interface ImageMappingItem {
  id: string;
  label: string;
}

export type ImageMappingValue = Record<string, string>;

export interface ImageMappingPanelProps {
  title: string;
  items: ImageMappingItem[];
  value: ImageMappingValue;
  onChange: (next: ImageMappingValue) => void;
  className?: string;
  uploadLabel?: string;
  clearLabel?: string;
}

export function ImageMappingPanel({
  title,
  items,
  value,
  onChange,
  className,
  uploadLabel = '上传图片',
  clearLabel = '清除',
}: ImageMappingPanelProps) {
  const handleFileChange = (id: string, file?: File) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      if (!base64) {
        return;
      }
      onChange({
        ...value,
        [id]: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (id: string) => {
    const next = { ...value };
    delete next[id];
    onChange(next);
  };

  return (
    <details className={cn('rounded-lg border border-slate-200 bg-white/80 p-3', className)}>
      <summary className="cursor-pointer text-sm font-semibold text-slate-700">{title}</summary>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const image = value[item.id];
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2"
            >
              <div className="w-16 text-xs font-semibold text-slate-600">{item.label}</div>
              <label className="flex-1 cursor-pointer rounded-md bg-cyan-600 px-2 py-1 text-center text-xs font-medium text-white">
                {uploadLabel}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    handleFileChange(item.id, event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {image ? (
                <>
                  <img
                    src={image}
                    alt={item.label}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                    onClick={() => handleRemove(item.id)}
                  >
                    {clearLabel}
                  </button>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}

