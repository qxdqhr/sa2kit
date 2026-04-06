'use client';

import React from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { ConfigFormData } from '../../../../../types';
import {
  Button,
  Input,
  Label,
  Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components';

interface GeneralConfigTabProps {
  configForm: ConfigFormData;
  setConfigForm: React.Dispatch<React.SetStateAction<ConfigFormData>>;
  onSave: () => void;
  onReset: () => void;
}

export function GeneralConfigTab({ configForm, setConfigForm, onSave, onReset }: GeneralConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>基础配置</CardTitle>
            <CardDescription>配置网站的基本信息和显示选项</CardDescription>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onReset} className="gap-2">
              <RotateCcw size={16} />
              重置默认
            </Button>
            <Button onClick={onSave} className="gap-2">
              <Save size={16} />
              保存配置
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">网站名称</Label>
            <Input
              id="siteName"
              type="text"
              value={configForm.siteName}
              onChange={(e) => setConfigForm(prev => ({ ...prev, siteName: e.target.value }))}
              placeholder="输入网站名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">网站描述</Label>
            <Textarea
              id="siteDescription"
              value={configForm.siteDescription}
              onChange={(e) => setConfigForm(prev => ({ ...prev, siteDescription: e.target.value }))}
              placeholder="输入网站描述"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroTitle">主标题</Label>
            <Input
              id="heroTitle"
              type="text"
              value={configForm.heroTitle}
              onChange={(e) => setConfigForm(prev => ({ ...prev, heroTitle: e.target.value }))}
              placeholder="输入主标题"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">副标题</Label>
            <Textarea
              id="heroSubtitle"
              value={configForm.heroSubtitle}
              onChange={(e) => setConfigForm(prev => ({ ...prev, heroSubtitle: e.target.value }))}
              placeholder="输入副标题"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCollections">每页显示商品数量</Label>
            <Input
              id="maxCollections"
              type="number"
              value={configForm.maxCollectionsPerPage}
              onChange={(e) => setConfigForm(prev => ({ ...prev, maxCollectionsPerPage: parseInt(e.target.value) }))}
              min="1"
              max="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">主题</Label>
            <Select
              value={configForm.theme}
              onValueChange={(value) => setConfigForm(prev => ({ ...prev, theme: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="auto">自动</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">语言</Label>
            <Select
              value={configForm.language}
              onValueChange={(value) => setConfigForm(prev => ({ ...prev, language: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择语言" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="enableSearch"
              type="checkbox"
              checked={configForm.enableSearch}
              onChange={(e) => setConfigForm(prev => ({ ...prev, enableSearch: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enableSearch" className="text-sm font-medium">
              启用搜索功能
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="enableCategories"
              type="checkbox"
              checked={configForm.enableCategories}
              onChange={(e) => setConfigForm(prev => ({ ...prev, enableCategories: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="enableCategories" className="text-sm font-medium">
              启用分类功能
            </Label>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-900">小程序悬浮按钮</p>
            <div className="flex items-center space-x-2">
              <input
                id="miniappShowCart"
                type="checkbox"
                checked={configForm.miniappFloatingButtons.showCart}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    miniappFloatingButtons: { ...prev.miniappFloatingButtons, showCart: e.target.checked },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="miniappShowCart" className="text-sm font-medium">显示"购物车"按钮</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="miniappShowHistory"
                type="checkbox"
                checked={configForm.miniappFloatingButtons.showHistory}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    miniappFloatingButtons: { ...prev.miniappFloatingButtons, showHistory: e.target.checked },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="miniappShowHistory" className="text-sm font-medium">显示"历史记录"按钮</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="miniappShowAddToCart"
                type="checkbox"
                checked={configForm.miniappFloatingButtons.showAddToCart}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    miniappFloatingButtons: { ...prev.miniappFloatingButtons, showAddToCart: e.target.checked },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="miniappShowAddToCart" className="text-sm font-medium">显示"加入购物车"按钮</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
