'use client';

import { STYLE_PRESETS, normalizeHexColor } from '../../../domain/nodeStyle';

interface ColorStyleFieldProps {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (color: string) => void;
}

export function ColorStyleField({ id, label, value, fallback, onChange }: ColorStyleFieldProps) {
  const normalized = normalizeHexColor(value, fallback);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 cursor-pointer rounded-lg border border-[var(--nn-shell-border)] bg-transparent p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-24 rounded-lg border border-[var(--nn-shell-border)] bg-[var(--nn-shell-bg)] px-2 font-mono text-xs text-[var(--nn-shell-text)]"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              title={preset}
              onClick={() => onChange(preset)}
              className={`h-7 w-7 cursor-pointer rounded-md border-2 transition-transform duration-150 hover:scale-110 ${
                normalized === preset
                  ? 'border-[var(--nn-primary)]'
                  : 'border-[var(--nn-shell-border)]'
              }`}
              style={{ backgroundColor: preset }}
              aria-label={`使用颜色 ${preset}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
