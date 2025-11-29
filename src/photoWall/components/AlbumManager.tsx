import React from 'react';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';

interface AlbumManagerProps {
  albums: Record<string, string[]>;
  onRenameAlbum: (oldName: string) => void;
  onDeleteAlbum: (name: string) => void;
  onClose: () => void;
}

export function AlbumManager({ albums, onRenameAlbum, onDeleteAlbum, onClose }: AlbumManagerProps) {
  return (
    <motion.div
      className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-4 w-full max-w-2xl"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        exit={{ y: 20 }}
      >
        <h3 className="text-lg font-medium mb-2">相册管理</h3>
        <div className="flex flex-col gap-2">
          {Object.keys(albums).map((a) => (
            <div key={a} className="flex items-center justify-between border rounded px-2 py-1">
              <div className="flex items-center gap-2">
                <Folder size={16} />
                <div>{a}</div>
                <div className="text-xs text-gray-500">{(albums[a]?.length ?? 0)} 张</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => onRenameAlbum(a)}>
                  重命名
                </button>
                {a !== 'All' && (
                  <button className="btn" onClick={() => onDeleteAlbum(a)}>
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

