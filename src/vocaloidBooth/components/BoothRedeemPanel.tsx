'use client';

import React, { useState } from 'react';
import type { BoothUploadRecord } from '../types';

export interface BoothRedeemPanelProps {
  loading?: boolean;
  onRedeem: (matchCode: string) => Promise<BoothUploadRecord | null>;
}

export const BoothRedeemPanel: React.FC<BoothRedeemPanelProps> = ({ onRedeem, loading }) => {
  const [matchCode, setMatchCode] = useState('');
  const [record, setRecord] = useState<BoothUploadRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRedeem = async () => {
    setError(null);
    const result = await onRedeem(matchCode.trim());

    if (!result) {
      setRecord(null);
      setError('匹配码不存在，请检查后重试');
      return;
    }

    if (result.status !== 'active') {
      setRecord(result);
      setError('匹配码已过期或失效');
      return;
    }

    setRecord(result);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">凭匹配码下载</h3>

      <div className="mb-3 flex gap-2">
        <input
          value={matchCode}
          onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
          placeholder="输入匹配码（如 A7K9Q2）"
          className="w-full rounded-md border px-3 py-2 text-sm uppercase"
        />
        <button
          type="button"
          onClick={handleRedeem}
          disabled={loading}
          className="rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
        >
          查询
        </button>
      </div>

      {error && <div className="mb-3 rounded-md bg-amber-50 p-2 text-sm text-amber-700">{error}</div>}

      {record && (
        <div className="rounded-md border border-slate-100 p-3">
          <div className="mb-2 text-xs text-slate-500">共 {record.files.length} 个文件</div>
          <ul className="space-y-1 text-sm">
            {record.files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{file.fileName}</span>
                <a href={file.objectKey} className="text-indigo-600 hover:underline" download>
                  下载
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
