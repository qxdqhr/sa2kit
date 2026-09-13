import React, { useState } from 'react';
import { IdeaItem as IdeaItemType } from '../../../domain/types';
import { IdeaListService } from '../services/ideaListService';
import ConvertToListModal from './ConvertToListModal';

interface IdeaItemProps {
  item: IdeaItemType;
  onUpdate: () => void;
  onDelete: () => void;
  onConvertSuccess?: (deleteOriginal: boolean) => void;
}

export default function IdeaItem({ item, onUpdate, onDelete, onConvertSuccess }: IdeaItemProps) {
  const [isCompleted, setIsCompleted] = useState(item.isCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const handleToggleComplete = async () => {
    try {
      setIsLoading(true);
      await IdeaListService.toggleItemComplete(item.id);
      setIsCompleted(!isCompleted);
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToList = async (data: { name: string; description: string; color: string; deleteOriginal: boolean }) => {
    try {
      setIsLoading(true);
      await IdeaListService.convertToList(item.id, data);
      setIsConvertModalOpen(false);
      
      // 如果需要删除原始想法，先删除
      if (data.deleteOriginal) {
        onDelete();
      }
      
      // 通知转换成功
      onConvertSuccess?.(data.deleteOriginal);
      
      // 如果不删除原始想法，更新它
      if (!data.deleteOriginal) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to convert to list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={handleToggleComplete}
            disabled={isLoading}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <h3 className={`text-lg font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {item.title}
            </h3>
            {item.description && (
              <p className={`mt-1 text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConvertModalOpen(true)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            转换为清单
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            删除
          </button>
        </div>
      </div>

      <ConvertToListModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSubmit={handleConvertToList}
        item={item}
        loading={isLoading}
      />
    </>
  );
} 