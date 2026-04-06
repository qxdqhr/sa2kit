'use client';

import React from 'react';
import { Save, RotateCcw, Plus } from 'lucide-react';
import { ConfigFormData, CollectionCategoryType, CategoryOption, getCategoryDisplayName } from '../../../../../types';
import {
  Button,
  Input,
  Label,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Badge,
} from '@/components';

interface HomeTabsTabProps {
  configForm: ConfigFormData;
  newHomeTabCategory: string;
  setNewHomeTabCategory: (v: string) => void;
  newHomeTabDescription: string;
  setNewHomeTabDescription: (v: string) => void;
  onSave: () => void;
  onResetOrder: () => void;
  onSetAllVisible: (visible: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle: (category: CollectionCategoryType) => void;
  onAdd: () => void;
  onRemove: (category: CollectionCategoryType) => void;
}

export function HomeTabsTab({
  configForm,
  newHomeTabCategory,
  setNewHomeTabCategory,
  newHomeTabDescription,
  setNewHomeTabDescription,
  onSave,
  onResetOrder,
  onSetAllVisible,
  onMove,
  onToggle,
  onAdd,
  onRemove,
}: HomeTabsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>首页分类Tab配置</CardTitle>
            <CardDescription>管理首页分类Tab的显示顺序与显示/隐藏</CardDescription>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onSetAllVisible(true)}>全部显示</Button>
            <Button variant="outline" onClick={() => onSetAllVisible(false)}>全部隐藏</Button>
            <Button variant="outline" onClick={onResetOrder} className="gap-2">
              <RotateCcw size={16} />
              重置顺序
            </Button>
            <Button onClick={onSave} className="gap-2">
              <Save size={16} />
              保存配置
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
          <div className="flex-1 space-y-2">
            <Label>分类名称</Label>
            <Input
              value={newHomeTabCategory}
              onChange={(e) => setNewHomeTabCategory(e.target.value)}
              placeholder="输入分类名称"
            />
            <Label>展示文案</Label>
            <Input
              value={newHomeTabDescription}
              onChange={(e) => setNewHomeTabDescription(e.target.value)}
              placeholder="输入展示文案"
            />
          </div>
          <Button onClick={onAdd} className="gap-2">
            <Plus size={16} />
            新增Tab
          </Button>
        </div>

        <div className="space-y-2">
          {configForm.homeTabConfig.map((item, index) => (
            <div
              key={item.category}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-slate-200 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    {item.description || item.name || getCategoryDisplayName(item.category)}
                  </span>
                  {item.description ? (
                    <span className="text-xs text-slate-500">{item.name || item.category}</span>
                  ) : null}
                </div>
                {!item.visible && <Badge variant="secondary" className="text-xs">已隐藏</Badge>}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onMove(index, -1)} disabled={index === 0}>
                  上移
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMove(index, 1)}
                  disabled={index === configForm.homeTabConfig.length - 1}
                >
                  下移
                </Button>
                <Button
                  variant={item.visible ? 'secondary' : 'default'}
                  size="sm"
                  onClick={() => onToggle(item.category)}
                >
                  {item.visible ? '隐藏' : '显示'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(item.category)}
                  disabled={configForm.homeTabConfig.length <= 1}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
