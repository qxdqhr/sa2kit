'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useIdeaLists } from '../hooks/useIdeaLists';
import { useIdeaItems } from '../hooks/useIdeaItems';
import { AuthGuard, UserMenu } from 'sa2kit/common/auth/components';
import CreateIdeaListModal from '../components/CreateIdeaListModal';
import EditIdeaListModal from '../components/EditIdeaListModal';
import CreateIdeaItemModal from '../components/CreateIdeaItemModal';
import EditIdeaItemModal from '../components/EditIdeaItemModal';
import IdeaItem from '../components/IdeaItem';
import type { IdeaList, IdeaListWithItems, IdeaListFormData, IdeaItemFormData, IdeaItem as IdeaItemType } from '../../../domain/types';

/**
 * 想法清单主页面
 * 展示所有想法清单，支持创建、编辑和删除
 */
export default function IdeaListPage() {
  const { 
    ideaLists, 
    loading: listsLoading, 
    error: listsError,
    refreshLists,
    createList,
    updateList,
    deleteList,
    updateListStats,
  } = useIdeaLists();

  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingList, setEditingList] = useState<IdeaList | null>(null);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IdeaItemType | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [createItemLoading, setCreateItemLoading] = useState(false);
  const [editItemLoading, setEditItemLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    items,
    loading: itemsLoading,
    error: itemsError,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
  } = useIdeaItems(selectedListId || undefined);

  // 初始化时检查是否为移动端
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // 初始检查
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // 根据设备类型选择是否自动选择第一个清单
  useEffect(() => {
    if (ideaLists.length > 0 && !selectedListId && !isMobile) {
      setSelectedListId(ideaLists[0].id);
    }
  }, [ideaLists, selectedListId, isMobile]);

  // 当从桌面端切换到移动端时，如果没有选中的清单，清除选择
  useEffect(() => {
    if (isMobile && !selectedListId) {
      setSelectedListId(null);
    }
  }, [isMobile]);

  // 初始化加载
  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  // 当选择列表时刷新项目（静默加载，避免闪烁）
  useEffect(() => {
    if (selectedListId) {
      refreshItems(false); // 不显示loading状态
    }
  }, [selectedListId, refreshItems]);

  const selectedList = ideaLists.find(list => list.id === selectedListId);

  // 处理创建清单
  const handleCreateList = async (data: IdeaListFormData) => {
    console.log('🚀 [IdeaListPage] 开始创建清单:', data);
    setCreateLoading(true);
    try {
      console.log('📡 [IdeaListPage] 调用 createList...');
      const result = await createList(data);
      console.log('✅ [IdeaListPage] 创建清单结果:', result);
      if (result.success) {
        setShowCreateModal(false);
        // 创建成功后，自动选中新创建的清单
        if (result.newListId) {
          console.log('🎯 [IdeaListPage] 自动选中新创建的清单:', result.newListId);
          setSelectedListId(result.newListId);
          // 确保 useIdeaItems hook 刷新数据
          console.log('🔄 [IdeaListPage] 等待 useIdeaItems 自动刷新...');
        }
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 创建清单失败:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  // 处理编辑清单
  const handleEditList = async (data: Partial<IdeaListFormData>) => {
    if (!editingList) return;
    console.log('🚀 [IdeaListPage] 开始编辑清单:', { listId: editingList.id, data });
    
    setEditLoading(true);
    try {
      console.log('📡 [IdeaListPage] 调用 updateList...');
      const success = await updateList(editingList.id, data);
      console.log('✅ [IdeaListPage] 编辑清单结果:', success);
      if (success) {
        setEditingList(null);
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 编辑清单失败:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // 处理删除清单
  const handleDeleteList = async () => {
    if (!editingList) return;
    console.log('🚀 [IdeaListPage] 开始删除清单:', editingList.id);
    
    setEditLoading(true);
    try {
      console.log('📡 [IdeaListPage] 调用 deleteList...');
      const success = await deleteList(editingList.id);
      console.log('✅ [IdeaListPage] 删除清单结果:', success);
      if (success) {
        setEditingList(null);
        // 如果删除的是当前选中的清单，则清除选择
        if (selectedListId === editingList.id) {
          setSelectedListId(null);
        }
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 删除清单失败:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // 处理创建想法项目
  const handleCreateItem = async (data: IdeaItemFormData) => {
    if (!selectedListId) {
      console.warn('⚠️ [IdeaListPage] 没有选中的清单ID');
      return;
    }
    console.log('🚀 [IdeaListPage] 开始创建想法项目:', { listId: selectedListId, data });
    
    setCreateItemLoading(true);
    try {
      console.log('📡 [IdeaListPage] 调用 createItem...');
      const success = await createItem(selectedListId, data);
      console.log('✅ [IdeaListPage] 创建想法项目结果:', success);
      if (success) {
        setShowCreateItemModal(false);
        // 本地更新清单统计数据（新增项目，itemCount +1）
        console.log('🔄 [IdeaListPage] 本地更新清单统计数据...');
        updateListStats(selectedListId, 1, 0);
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 创建想法项目失败:', error);
    } finally {
      setCreateItemLoading(false);
    }
  };

  // 处理编辑想法项目
  const handleEditItem = async (data: Partial<IdeaItemFormData>) => {
    if (!editingItem) {
      console.warn('⚠️ [IdeaListPage] 没有正在编辑的项目');
      return;
    }
    console.log('🚀 [IdeaListPage] 开始编辑想法项目:', { itemId: editingItem.id, data });
    
    setEditItemLoading(true);
    try {
      console.log('📡 [IdeaListPage] 调用 updateItem...');
      const success = await updateItem(editingItem.id, data);
      console.log('✅ [IdeaListPage] 编辑想法项目结果:', success);
      if (success) {
        setEditingItem(null);
        // 编辑项目通常不会影响统计数据，除非修改了完成状态
        // 这里暂时不更新统计，因为编辑操作已经通过useIdeaItems本地更新了
        console.log('✅ [IdeaListPage] 编辑项目完成');
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 编辑想法项目失败:', error);
    } finally {
      setEditItemLoading(false);
    }
  };

  // 处理删除想法项目
  const handleDeleteItem = useCallback(async (id: number) => {
    if (!selectedListId) return;
    try {
      await deleteItem(id);
      updateListStats(selectedListId, -1, 0);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }, [deleteItem, selectedListId, updateListStats]);

  // 处理编辑模态框的删除操作
  const handleEditModalDelete = useCallback(() => {
    if (!editingItem) return;
    handleDeleteItem(editingItem.id);
  }, [editingItem, handleDeleteItem]);

  // 处理切换完成状态
  const handleToggleComplete = async (id: number) => {
    console.log('🚀 [IdeaListPage] 开始切换完成状态:', id);
    
    if (!selectedListId) return;
    
    // 找到要切换的项目，获取当前完成状态
    const targetItem = items.find(item => item.id === id);
    if (!targetItem) return;
    
    try {
      console.log('📡 [IdeaListPage] 调用 toggleComplete...');
      const success = await toggleComplete(id);
      console.log('✅ [IdeaListPage] 切换完成状态结果:', success);
      
      // 切换成功后，本地更新清单统计数据（避免闪烁）
      if (success) {
        console.log('🔄 [IdeaListPage] 本地更新清单统计数据...');
        // 如果项目从未完成变为完成，completedCount +1
        // 如果项目从完成变为未完成，completedCount -1
        const completedCountChange = targetItem.isCompleted ? -1 : 1;
        updateListStats(selectedListId, 0, completedCountChange);
      }
    } catch (error) {
      console.error('❌ [IdeaListPage] 切换完成状态失败:', error);
    }
  };

  // 处理转换成功
  const handleConvertSuccess = useCallback((deleteOriginal: boolean) => {
    // 刷新清单列表以显示新创建的清单
    refreshLists();
    
    // 如果删除了原始想法，更新原清单的统计数据
    if (deleteOriginal && selectedListId) {
      updateListStats(selectedListId, -1, 0);
    }
    
    // 立即刷新原清单的内容
    refreshItems(true);
  }, [refreshLists, refreshItems, selectedListId, updateListStats]);

  return (
    <AuthGuard 
      requireAuth={true}
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                登录后使用想法清单
              </h3>
              <p className="text-gray-500 mb-6">
                想法清单功能需要登录后才能使用，请先登录您的账户。
              </p>
              <p className="text-sm text-gray-400">
                登录后您可以：创建多个想法清单、管理想法项目、设置优先级和标签等
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-gray-50 min-h-screen">
        {/* 移动端布局 */}
        <div className="block sm:hidden">
          {!selectedList ? (
            // 清单列表页面
            <div className="min-h-screen flex flex-col bg-gray-50">
              {/* 顶部导航栏 */}
              <div className="bg-white border-b">
                <div className="px-4 h-14 flex items-center justify-between">
                  <h1 className="text-xl font-semibold">想法清单</h1>
                  <div className="flex items-center space-x-2">
                    <UserMenu />
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* 清单列表 */}
              <div className="flex-1 overflow-y-auto">
                {listsLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : listsError ? (
                  <div className="p-4">
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                      {listsError}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 bg-white">
                    {ideaLists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className="p-4 active:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full bg-${list.color}-500 flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg font-bold text-white">
                              {list.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                              {list.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{list.itemCount} 项</span>
                              <span className="mx-1.5">•</span>
                              <span>{list.completedCount} 已完成</span>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}

                    {ideaLists.length === 0 && (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">创建你的第一个清单</h3>
                        <p className="text-gray-500 text-sm mb-4">开始记录和管理你的想法</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          创建清单
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 具体清单页面
            <div className="min-h-screen flex flex-col bg-gray-50">
              {/* 清单详情导航栏 */}
              <div className="bg-white border-b">
                <div className="px-4 h-14 flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedListId(null)}
                    className="flex items-center text-blue-600"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>返回</span>
                  </button>
                  <h1 className="text-lg font-medium flex-1 truncate">{selectedList.name}</h1>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingList(selectedList)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowCreateItemModal(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 清单统计信息 */}
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {selectedList.itemCount} 项
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {selectedList.completedCount} 完成
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div 
                        className={`bg-${selectedList.color}-500 h-1.5 rounded-full`}
                        style={{ 
                          width: `${selectedList.itemCount > 0 ? (selectedList.completedCount / selectedList.itemCount) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs">
                      {selectedList.itemCount > 0 ? Math.round((selectedList.completedCount / selectedList.itemCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 想法列表内容 */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {itemsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : itemsError ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {itemsError}
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">还没有想法</h3>
                    <p className="text-gray-500 mb-4">这个清单还是空的，添加你的第一个想法开始吧！</p>
                    <button
                      onClick={() => setShowCreateItemModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加第一个想法
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <IdeaItem
                        key={item.id}
                        item={item}
                        onUpdate={() => refreshItems(true)}
                        onDelete={() => {
                          handleDeleteItem(item.id);
                          refreshItems(true);
                        }}
                        onConvertSuccess={handleConvertSuccess}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 桌面端布局 */}
        <div className="hidden sm:block">
        {/* 页面标题 */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">想法清单</h1>
                <div className="flex items-center space-x-2">
              <UserMenu />
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setEditingList(null);
                }}
                    className="bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-md text-sm font-medium shadow-sm hidden sm:block"
              >
                创建新清单
              </button>
                </div>
            </div>
          </div>
        </div>

             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
         {/* 统一的想法清单视图 */}
            <div className="bg-white rounded-lg shadow-sm border min-h-[600px] flex flex-col sm:flex-row">
              {/* 桌面端侧边栏 */}
              <div className={`hidden sm:flex ${sidebarCollapsed ? 'w-16' : 'w-80'} transition-[width] duration-200 border-r border-gray-200 flex-col`}>
            {/* 侧边栏头部 */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              {!sidebarCollapsed && <h2 className="text-lg font-medium text-gray-900">我的清单</h2>}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-200"
                title={sidebarCollapsed ? '展开清单' : '收起清单'}
              >
                <svg 
                      className={`w-5 h-5 text-gray-600 transform ${sidebarCollapsed ? 'rotate-180 sm:rotate-0 sm:-rotate-180' : ''} sm:rotate-0`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            {/* 清单列表内容 */}
                <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'hidden sm:block' : ''}`}>
                {listsLoading ? (
                  <div className="p-4">
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`bg-gray-200 rounded ${sidebarCollapsed ? 'h-8 w-8 mx-auto' : 'h-16'}`}></div>
                      ))}
                    </div>
                  </div>
                ) : listsError ? (
                  <div className="p-4 text-red-600 text-sm">
                    {!sidebarCollapsed ? (
                      listsError
                    ) : (
                      <div className="flex justify-center">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={sidebarCollapsed ? 'space-y-3 p-3' : 'divide-y divide-gray-100'}>
                    {ideaLists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className={`cursor-pointer ${
                          sidebarCollapsed 
                            ? `w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                                selectedListId === list.id 
                                  ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' 
                                  : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                              }`
                            : `p-4 hover:bg-gray-50 ${
                                selectedListId === list.id ? 'bg-blue-50' : ''
                              }`
                        }`}
                        title={sidebarCollapsed ? `${list.name} (${list.itemCount}项 | ${list.completedCount}已完成)` : undefined}
                      >
                        {sidebarCollapsed ? (
                          <div className={`w-6 h-6 rounded-full bg-${list.color}-500 flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">
                              {list.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {list.name}
                              </h3>
                              {list.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {list.description}
                                </p>
                              )}
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span>{list.itemCount} 项</span>
                                <span className="mx-1">•</span>
                                <span>{list.completedCount} 已完成</span>
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ml-2 bg-${list.color}-500`}></div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {ideaLists.length === 0 && (
                      <div className={`text-center text-gray-500 ${sidebarCollapsed ? 'p-4' : 'p-8'}`}>
                        {!sidebarCollapsed ? (
                          <div>
                            <p className="text-sm text-gray-500 mb-3">还没有想法清单</p>
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              创建第一个清单
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          {/* 主内容区域 */}
              <div className="flex-1 flex flex-col overflow-hidden">
            {selectedList ? (
              <>
                    {/* 桌面端清单详情头部 */}
                    <div className="hidden sm:block p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex justify-between items-start min-w-[640px]">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full bg-${selectedList.color}-500 flex items-center justify-center flex-shrink-0`}>
                        <span className="text-lg font-bold text-white">
                          {selectedList.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedList.name}
                        </h1>
                        {selectedList.description && (
                          <p className="text-gray-600 mb-3">
                            {selectedList.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            总计 {selectedList.itemCount} 项想法
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            已完成 {selectedList.completedCount} 项
                          </div>
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-${selectedList.color}-500 h-2 rounded-full`}
                                style={{ 
                                  width: `${selectedList.itemCount > 0 ? (selectedList.completedCount / selectedList.itemCount) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs font-medium">
                              {selectedList.itemCount > 0 ? Math.round((selectedList.completedCount / selectedList.itemCount) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditingList(selectedList)}
                        className="bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow"
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        编辑清单
                      </button>
                      <button
                        onClick={() => setShowCreateItemModal(true)}
                        className="bg-white hover:bg-gray-50 text-black border border-gray-300 hover:border-gray-400 px-6 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>添加想法</span>
                      </button>
                    </div>
                  </div>
                </div>

                    {/* 渲染想法项目列表 */}
                    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                      <div className="space-y-4">
                  {itemsError ? (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {itemsError}
                      </div>
                    </div>
                  ) : itemsLoading && items.length === 0 ? (
                    <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <IdeaItem
                          key={item.id}
                          item={item}
                          onUpdate={() => refreshItems(true)}
                          onDelete={() => {
                            handleDeleteItem(item.id);
                            refreshItems(true);
                          }}
                          onConvertSuccess={handleConvertSuccess}
                        />
                      ))}
                    </div>
                  )}
                      </div>
                </div>
              </>
            ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-sm mx-auto">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">💡 开始管理你的想法</h3>
                      <p className="text-gray-600 mb-6 text-sm">
                    {sidebarCollapsed 
                      ? '点击左侧的圆形图标选择想法清单，或创建新的清单开始你的创意之旅' 
                      : '从左侧选择一个想法清单，或创建新的清单开始你的创意之旅'
                    }
                  </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700"
                    >
                        创建第一个清单
                    </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* 创建清单模态框 */}
      <CreateIdeaListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateList}
        loading={createLoading}
      />

      {/* 编辑清单模态框 */}
      <EditIdeaListModal
        isOpen={!!editingList}
        onClose={() => setEditingList(null)}
        onSubmit={handleEditList}
        onDelete={handleDeleteList}
        ideaList={editingList}
        loading={editLoading}
      />

      {/* 创建想法项目模态框 */}
      <CreateIdeaItemModal
        isOpen={showCreateItemModal}
        onClose={() => setShowCreateItemModal(false)}
        onSubmit={handleCreateItem}
        loading={createItemLoading}
      />

      {/* 编辑想法项目模态框 */}
      {editingItem && (
        <EditIdeaItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEditItem}
          onDelete={handleEditModalDelete}
          item={editingItem}
          loading={editItemLoading}
        />
      )}
      </div>
    </AuthGuard>
  );
} 