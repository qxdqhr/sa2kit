'use client';

import React, { useMemo, useState } from 'react';

export interface BoothUploadSubmitPayload {
  boothId: string;
  files: File[];
  nickname?: string;
  contactTail?: string;
  ttlHours?: number;
}

export interface BoothUploadPanelProps {
  boothId: string;
  maxFiles?: number;
  maxFileSizeMb?: number;
  accept?: string;
  uploading?: boolean;
  onSubmit: (payload: BoothUploadSubmitPayload) => Promise<void> | void;
}

export const BoothUploadPanel: React.FC<BoothUploadPanelProps> = ({
  boothId,
  maxFiles = 10,
  maxFileSizeMb = 2048,
  accept,
  uploading = false,
  onSubmit,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [nickname, setNickname] = useState('');
  const [contactTail, setContactTail] = useState('');
  const [ttlHours, setTtlHours] = useState(24 * 14);
  const [error, setError] = useState<string | null>(null);

  const totalSizeMb = useMemo(
    () => files.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024,
    [files]
  );

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const next = [...files, ...incoming];

    if (next.length > maxFiles) {
      setError(`最多上传 ${maxFiles} 个文件`);
      return;
    }

    const oversized = incoming.find((f) => f.size > maxFileSizeMb * 1024 * 1024);
    if (oversized) {
      setError(`文件 ${oversized.name} 超过 ${maxFileSizeMb}MB 限制`);
      return;
    }

    setError(null);
    setFiles(next);
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('请先选择至少一个文件');
      return;
    }
    setError(null);
    await onSubmit({
      boothId,
      files,
      nickname: nickname || undefined,
      contactTail: contactTail || undefined,
      ttlHours,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">上传创作文件</h3>

      <input
        type="file"
        multiple
        accept={accept}
        onChange={(e) => addFiles(e.target.files)}
        className="mb-3 block w-full text-sm"
      />

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称（可选）"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          value={contactTail}
          onChange={(e) => setContactTail(e.target.value)}
          placeholder="联系方式后4位（可选）"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          value={ttlHours}
          type="number"
          min={1}
          onChange={(e) => setTtlHours(Number(e.target.value) || 24)}
          placeholder="保存时长（小时）"
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-3 text-xs text-slate-500">
        已选 {files.length} 个文件，总计 {totalSizeMb.toFixed(2)} MB
      </div>

      <ul className="mb-3 max-h-40 overflow-auto rounded-md border border-slate-100 p-2 text-sm">
        {files.length === 0 && <li className="text-slate-400">尚未选择文件</li>}
        {files.map((file) => (
          <li key={`${file.name}-${file.size}`} className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate">{file.name}</span>
            <button type="button" className="text-rose-500" onClick={() => removeFile(file.name)}>
              移除
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="mb-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</div>}

      <button
        type="button"
        disabled={uploading}
        onClick={handleSubmit}
        className="rounded-md bg-indigo-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? '上传中...' : '开始上传'}
      </button>
    </div>
  );
};
