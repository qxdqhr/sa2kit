'use client';

import React from 'react';
import { Plus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import {
  CollectionFormData,
  CollectionCategory,
  CollectionCategoryType,
  CategoryOption,
  getCategoryDisplayName,
} from '../../../../../types';
import { UniversalImageUpload } from '../../../components/UniversalImageUpload';
import { CollectionOrderManagerV2 as CollectionOrderManager } from '../../../components/CollectionOrderManagerV2';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';

interface CollectionWithPages {
  id: number;
  title: string;
  number: string;
  coverImage?: string;
  category: { displayName: string };
  price?: number | null;
  pages: any[];
  isPublished: boolean;
}

interface CollectionsTabProps {
  collections: CollectionWithPages[];
  collectionForm: CollectionFormData;
  setCollectionForm: React.Dispatch<React.SetStateAction<CollectionFormData>>;
  showCollectionForm: boolean;
  setShowCollectionForm: (v: boolean) => void;
  editingCollection: number | null;
  setEditingCollection: (v: number | null) => void;
  showCollectionOrder: boolean;
  categoryOptions: CategoryOption[];
  onToggleOrder: () => void;
  onSave: () => void;
  onEdit: (collection: CollectionWithPages) => void;
  onDelete: (id: number) => void;
  moveCollectionUp: (id: number) => void;
  moveCollectionDown: (id: number) => void;
  updateCollectionOrder: (updates: any[]) => void;
}

export function CollectionsTab({
  collections,
  collectionForm,
  setCollectionForm,
  showCollectionForm,
  setShowCollectionForm,
  editingCollection,
  showCollectionOrder,
  categoryOptions,
  onToggleOrder,
  onSave,
  onEdit,
  onDelete,
  moveCollectionUp,
  moveCollectionDown,
  updateCollectionOrder,
}: CollectionsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>商品管理</CardTitle>
              <CardDescription>管理商品</CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setCollectionForm({
                    title: '',
                    number: '',
                    coverImage: '',
                    coverImageFileId: undefined,
                    description: '',
                    category: CollectionCategory.COLLECTION,
                    tags: [],
                    isPublished: true,
                    price: undefined,
                  });
                  setShowCollectionForm(true);
                }}
                className="gap-2"
              >
                <Plus size={16} />
                添加商品
              </Button>
              <Button variant="outline" onClick={onToggleOrder} className="gap-2">
                <ArrowUpDown size={16} />
                {showCollectionOrder ? '关闭排序' : '商品排序'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCollectionOrder && (
            <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-800 mb-2">商品排序管理</h3>
                <p className="text-slate-600">拖拽或使用按钮调整商品在前台的显示顺序</p>
              </div>
              <CollectionOrderManager
                moveCollectionUp={moveCollectionUp}
                moveCollectionDown={moveCollectionDown}
                updateCollectionOrder={updateCollectionOrder}
                onOrderChanged={async () => {}}
              />
            </div>
          )}

          {!showCollectionOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {collection.coverImage ? (
                      <img src={collection.coverImage} alt={collection.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-400 text-sm">暂无封面</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{collection.title}</h3>
                    <p className="text-slate-600 text-sm mb-1">编号：{collection.number}</p>
                    <p className="text-slate-600 text-sm mb-1">分类：{collection.category.displayName}</p>
                    <p className="text-slate-600 text-sm mb-1">价格：{collection.price ? `¥${collection.price}` : '免费'}</p>
                    <p className="text-slate-600 text-sm mb-1">商品详情图数量：{collection.pages.length}</p>
                    <p className="text-slate-600 text-sm mb-3">状态：{collection.isPublished ? '已发布' : '草稿'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(collection)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-200 transition-colors"
                      >
                        <Edit size={14} />
                        编辑
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('确定要删除这个商品吗？')) {
                            await onDelete(collection.id);
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
        </CardContent>
      </Card>

      {/* 商品表单弹窗 */}
      {showCollectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {editingCollection ? '编辑商品' : '添加商品'}
              </h3>
              <button
                onClick={() => setShowCollectionForm(false)}
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
                    value={collectionForm.title}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入商品标题"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">编号</label>
                  <input
                    type="text"
                    value={collectionForm.number}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="输入编号"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <UniversalImageUpload
                    label="封面图片"
                    value={collectionForm.coverImage}
                    fileId={collectionForm.coverImageFileId}
                    onChange={(data: { image?: string; fileId?: string }) =>
                      setCollectionForm(prev => ({
                        ...prev,
                        coverImage: data.image || '',
                        coverImageFileId: data.fileId,
                      }))
                    }
                    placeholder="上传封面图片"
                    businessType="cover"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <textarea
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入商品描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
                  <select
                    value={collectionForm.category}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, category: e.target.value as CollectionCategoryType }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.description || getCategoryDisplayName(category.name as CollectionCategoryType)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">价格（元）</label>
                  <input
                    type="number"
                    value={collectionForm.price || ''}
                    onChange={(e) =>
                      setCollectionForm(prev => ({
                        ...prev,
                        price: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    placeholder="输入价格（留空表示免费）"
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectionForm.isPublished}
                      onChange={(e) => setCollectionForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">发布商品</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowCollectionForm(false)}
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
