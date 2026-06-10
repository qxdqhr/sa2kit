'use client';

import React from 'react';

export interface BoothSuccessCardProps {
  matchCode: string;
  expiresAt: string;
  downloadUrlPath: string;
  onCopyCode?: (code: string) => void;
  className?: string;
}

export const BoothSuccessCard: React.FC<BoothSuccessCardProps> = ({
  matchCode,
  expiresAt,
  downloadUrlPath,
  onCopyCode,
  className,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matchCode);
    } catch {
      // ignore clipboard errors in non-secure contexts
    }
    onCopyCode?.(matchCode);
  };

  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm ${className ?? ''}`}>
      <div className="mb-2 text-xs text-emerald-800">上传完成，已生成匹配码</div>
      <div className="mb-3 text-2xl font-bold tracking-widest text-emerald-900">{matchCode}</div>
      <div className="mb-3 text-xs text-emerald-800">过期时间：{new Date(expiresAt).toLocaleString()}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          复制匹配码
        </button>
        <a
          href={downloadUrlPath}
          className="rounded-md border border-emerald-400 bg-white px-3 py-2 text-emerald-700 hover:bg-emerald-100"
        >
          打开下载页
        </a>
      </div>
    </div>
  );
};
