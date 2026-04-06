'use client';

import React from 'react';
import { Plus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { ArtworkFormData } from '../../../../../types';
import { UniversalImageUpload } from '../../../components/UniversalImageUpload';
import { ArtworkOrderManagerV2 as ArtworkOrderManager } from '../../../components/ArtworkOrderManagerV2';

interface ArtworkWithMeta {
  id: number;
  title: string;
  number: string;
  image?: string;
  createdTime?: string;
  theme?: string;
  description?: string;
  fileId?: string;
}

interface CollectionWithPages {
  id: number;
  title: string;
  pages: ArtworkWithMeta[];
}

interface ArtworksTabProps {
  collections: CollectionWithPages[];
  selectedCollection: number | null;
  setSelectedCollection: (v: number | null) => void;
  artworkForm: ArtworkFormData;
  setArtworkForm: React.Dispatch<React.SetStateAction<ArtworkFormData>>;
  showArtworkForm: boolean;
  setShowArtworkForm: (v: boolean) => void;
  editingArtwork: { collectionId: number; artworkId: number } | null;
  setEditingArtwork: (v: { collectionId: number; artworkId: number } | null) => void;
  showArtworkOrder: boolean;
  onToggleOrder: () => void;
  onSave: () => void;
  onEdit: (collectionId: number, artwork: ArtworkWithMeta) => void;
  onDelete: (collectionId: number, artworkId: number) => void;
  moveArtworkUp: (collectionId: number, artworkId: number) => void;
  moveArtworkDown: (collectionId: number, artworkId: number) => void;
  updateArtworkOrder: (collectionId: number, updates: any[]) => void;
}

export function ArtworksTab({
  collections,
  selectedCollection,
  setSelectedCollection,
  artworkForm,
  setArtworkForm,
  showArtworkForm,
  setShowArtworkForm,
  editingArtwork,
  showArtworkOrder,
  onToggleOrder,
  onSave,
  onEdit,
  onDelete,
  moveArtworkUp,
  moveArtworkDown,
  updateArtworkOrder,
}: ArtworksTabProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">商品详情图管理</h2>
        <div className="flex gap-3">
          <select
            value={selectedCollection || ''}
            onChange={(e) => setSelectedCollection(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">选择商品</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title}
              </option>
            ))}
          </select>
          {selectedCollection && (
            <>
              <button
                onClick={() => {
                  setArtworkForm({ title: '', number: '', image: '', description: '', createdTime: '', theme: '' });
                  setShowArtworkForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                添加商品详情图
              </button>
              <button
                onClick={onToggleOrder}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                <ArrowUpDown size={16} />
                {showArtworkOrder ? '关闭排序' : '商品详情图排序'}
              </button>
            </>
          )}
        </div>
      </div>

      {selectedCollection && showArtworkOrder && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">商品详情图排序管理</h3>
            <p className="text-slate-600">拖拽或使用按钮调整商品详情图在商品中的显示顺序</p>
          </div>
          <ArtworkOrderManager
            collectionId={selectedCollection}
            moveArtworkUp={moveArtworkUp}
            moveArtworkDown={moveArtworkDown}
            updateArtworkOrder={updateArtworkOrder}
            onOrderChanged={async () => {}}
          />
        </div>
      )}

      {selectedCollection && !showArtworkOrder && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections
            .find(c => c.id === selectedCollection)
            ?.pages.map((artwork) => (
              <div
                key={artwork.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-slate-100 overflow-hidden">
                  {artwork.image && (
                    <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">{artwork.title}</h4>
                  <p className="text-slate-600 text-sm mb-1">编号：{artwork.number}</p>
                  <p className="text-slate-600 text-sm mb-1">创作时间：{artwork.createdTime}</p>
                  <p className="text-slate-600 text-sm mb-1">主题：{artwork.theme}</p>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">{artwork.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(selectedCollection, artwork)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      <Edit size={14} />
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这个商品详情图吗？')) {
                          onDelete(selectedCollection, artwork.id);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      <Trash2 size={14} />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 商品详情图表单弹窗 */}
      {showArtworkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {editingArtwork ? '编辑商品详情图' : '添加商品详情图'}
              </h3>
              <button
                onClick={() => setShowArtworkForm(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={artworkForm.title}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入商品详情图标题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">编号</label>
                  <input
                    type="text"
                    value={artworkForm.number}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="输入编号"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <UniversalImageUpload
                    label="商品详情图图片"
                    value={artworkForm.image}
                    fileId={artworkForm.fileId}
                    onChange={(data: { image?: string; fileId?: string }) =>
                      setArtworkForm(prev => ({ ...prev, image: data.image, fileId: data.fileId }))
                    }
                    placeholder="上传商品详情图图片"
                    businessType="artwork"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <textarea
                    value={artworkForm.description}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入商品详情图描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">创作时间</label>
                  <input
                    type="text"
                    value={artworkForm.createdTime}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, createdTime: e.target.value }))}
                    placeholder="输入创作时间"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">主题</label>
                  <input
                    type="text"
                    value={artworkForm.theme}
                    onChange={(e) => setArtworkForm(prev => ({ ...prev, theme: e.target.value }))}
                    placeholder="输入商品详情图主题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowArtworkForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
