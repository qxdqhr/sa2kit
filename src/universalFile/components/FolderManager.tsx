/**
 * 文件夹管理组件
 * 支持创建、重命名、删除文件夹，以及文件夹树形结构显示
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FileMetadata } from '../types';

export interface FolderNode {
  /** 文件夹ID */
  id: string;
  /** 文件夹名称 */
  name: string;
  /** 父文件夹ID */
  parentId?: string;
  /** 子文件夹 */
  children: FolderNode[];
  /** 文件数量 */
  fileCount: number;
  /** 总大小 */
  totalSize: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否展开 */
  expanded?: boolean;
}

export interface FolderManagerProps {
  /** 当前文件夹ID */
  currentFolderId?: string;
  /** 文件夹树数据 */
  folderTree: FolderNode[];
  /** 是否显示文件数量 */
  showFileCount?: boolean;
  /** 是否显示文件大小 */
  showSize?: boolean;
  /** 是否允许创建文件夹 */
  allowCreate?: boolean;
  /** 是否允许重命名 */
  allowRename?: boolean;
  /** 是否允许删除 */
  allowDelete?: boolean;
  /** 是否允许拖拽 */
  allowDrag?: boolean;
  /** 文件夹选择回调 */
  onFolderSelect?: (folderId: string) => void;
  /** 文件夹创建回调 */
  onFolderCreate?: (parentId: string | undefined, name: string) => Promise<FolderNode>;
  /** 文件夹重命名回调 */
  onFolderRename?: (folderId: string, newName: string) => Promise<void>;
  /** 文件夹删除回调 */
  onFolderDelete?: (folderId: string) => Promise<void>;
  /** 文件移动回调 */
  onFileMove?: (fileIds: string[], targetFolderId: string) => Promise<void>;
}

interface FolderManagerState {
  expandedFolders: Set<string>;
  editingFolder: string | null;
  editingName: string;
  creatingFolder: string | null; // 正在创建子文件夹的父文件夹ID
  newFolderName: string;
  dragOverFolder: string | null;
  contextMenu: {
    folderId: string;
    x: number;
    y: number;
  } | null;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  currentFolderId,
  folderTree,
  showFileCount = true,
  showSize = true,
  allowCreate = true,
  allowRename = true,
  allowDelete = true,
  allowDrag = false,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onFileMove
}) => {
  const [state, setState] = useState<FolderManagerState>({
    expandedFolders: new Set(currentFolderId ? [currentFolderId] : []),
    editingFolder: null,
    editingName: '',
    creatingFolder: null,
    newFolderName: '',
    dragOverFolder: null,
    contextMenu: null
  });

  // 切换文件夹展开状态
  const toggleFolder = useCallback((folderId: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { ...prev, expandedFolders: newExpanded };
    });
  }, []);

  // 选择文件夹
  const selectFolder = useCallback((folderId: string) => {
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  }, [onFolderSelect]);

  // 开始创建文件夹
  const startCreateFolder = useCallback((parentId?: string) => {
    setState(prev => ({
      ...prev,
      creatingFolder: parentId || null,
      newFolderName: '新建文件夹',
      contextMenu: null
    }));
  }, []);

  // 确认创建文件夹
  const confirmCreateFolder = useCallback(async () => {
    if (!state.newFolderName.trim() || !onFolderCreate) return;

    try {
      await onFolderCreate(state.creatingFolder || undefined, state.newFolderName.trim());
      setState(prev => ({
        ...prev,
        creatingFolder: null,
        newFolderName: ''
      }));
    } catch (error) {
      console.error('创建文件夹失败:', error);
    }
  }, [state.creatingFolder, state.newFolderName, onFolderCreate]);

  // 取消创建文件夹
  const cancelCreateFolder = useCallback(() => {
    setState(prev => ({
      ...prev,
      creatingFolder: null,
      newFolderName: ''
    }));
  }, []);

  // 开始重命名文件夹
  const startRenameFolder = useCallback((folderId: string, currentName: string) => {
    setState(prev => ({
      ...prev,
      editingFolder: folderId,
      editingName: currentName,
      contextMenu: null
    }));
  }, []);

  // 确认重命名文件夹
  const confirmRenameFolder = useCallback(async () => {
    if (!state.editingFolder || !state.editingName.trim() || !onFolderRename) return;

    try {
      await onFolderRename(state.editingFolder, state.editingName.trim());
      setState(prev => ({
        ...prev,
        editingFolder: null,
        editingName: ''
      }));
    } catch (error) {
      console.error('重命名文件夹失败:', error);
    }
  }, [state.editingFolder, state.editingName, onFolderRename]);

  // 取消重命名文件夹
  const cancelRenameFolder = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingFolder: null,
      editingName: ''
    }));
  }, []);

  // 删除文件夹
  const deleteFolder = useCallback(async (folderId: string, folderName: string) => {
    if (!window.confirm(`确定要删除文件夹"${folderName}"吗？此操作将删除文件夹内的所有文件。`)) {
      return;
    }

    if (!onFolderDelete) return;

    try {
      await onFolderDelete(folderId);
      setState(prev => ({ ...prev, contextMenu: null }));
    } catch (error) {
      console.error('删除文件夹失败:', error);
    }
  }, [onFolderDelete]);

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      contextMenu: {
        folderId,
        x: e.clientX,
        y: e.clientY
      }
    }));
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setState(prev => ({ ...prev, contextMenu: null }));
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent, folderId: string) => {
    if (!allowDrag) return;
    e.preventDefault();
    setState(prev => ({ ...prev, dragOverFolder: folderId }));
  }, [allowDrag]);

  const handleDragLeave = useCallback(() => {
    setState(prev => ({ ...prev, dragOverFolder: null }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, folderId: string) => {
    if (!allowDrag || !onFileMove) return;
    
    e.preventDefault();
    setState(prev => ({ ...prev, dragOverFolder: null }));

    try {
      const fileIds = JSON.parse(e.dataTransfer.getData('application/json'));
      await onFileMove(fileIds, folderId);
    } catch (error) {
      console.error('移动文件失败:', error);
    }
  }, [allowDrag, onFileMove]);

  // 格式化文件大小
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 渲染文件夹节点
  const renderFolderNode = useCallback((folder: FolderNode, level: number = 0) => {
    const isExpanded = state.expandedFolders.has(folder.id);
    const isSelected = currentFolderId === folder.id;
    const isEditing = state.editingFolder === folder.id;
    const isDragOver = state.dragOverFolder === folder.id;

    return (
      <div key={folder.id} className="select-none">
        {/* 文件夹项 */}
        <div
          className={`flex items-center py-1 px-2 rounded-md cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-800' 
              : isDragOver
              ? 'bg-green-100'
              : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => selectFolder(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder.id)}
          onDragOver={allowDrag ? (e) => handleDragOver(e, folder.id) : undefined}
          onDragLeave={allowDrag ? handleDragLeave : undefined}
          onDrop={allowDrag ? (e) => handleDrop(e, folder.id) : undefined}
        >
          {/* 展开图标 */}
          {folder.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-1 p-1 hover:bg-gray-200 rounded"
            >
              <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
          )}

          {/* 文件夹图标 */}
          <span className="mr-2 text-yellow-600">
            {isExpanded ? '📂' : '📁'}
          </span>

          {/* 文件夹名称 */}
          <div className="flex-1 flex items-center justify-between">
            {isEditing ? (
              <input
                type="text"
                value={state.editingName}
                onChange={(e) => setState(prev => ({ ...prev, editingName: e.target.value }))}
                onBlur={confirmRenameFolder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRenameFolder();
                  } else if (e.key === 'Escape') {
                    cancelRenameFolder();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-1 py-0 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <span className="text-sm truncate">{folder.name}</span>
            )}

            {/* 文件信息 */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 ml-2">
              {showFileCount && (
                <span>{folder.fileCount} 项</span>
              )}
              {showSize && folder.totalSize > 0 && (
                <span>{formatSize(folder.totalSize)}</span>
              )}
            </div>
          </div>
        </div>

        {/* 创建新文件夹输入框 */}
        {state.creatingFolder === folder.id && (
          <div
            className="flex items-center py-1 px-2 ml-4"
            style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
          >
            <span className="mr-2 text-yellow-600">📁</span>
            <input
              type="text"
              value={state.newFolderName}
              onChange={(e) => setState(prev => ({ ...prev, newFolderName: e.target.value }))}
              onBlur={confirmCreateFolder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmCreateFolder();
                } else if (e.key === 'Escape') {
                  cancelCreateFolder();
                }
              }}
              className="flex-1 px-1 py-0 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* 子文件夹 */}
        {isExpanded && folder.children.map(child => 
          renderFolderNode(child, level + 1)
        )}
      </div>
    );
  }, [
    state.expandedFolders,
    state.editingFolder,
    state.editingName,
    state.creatingFolder,
    state.newFolderName,
    state.dragOverFolder,
    currentFolderId,
    allowDrag,
    showFileCount,
    showSize,
    selectFolder,
    toggleFolder,
    handleContextMenu,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    confirmRenameFolder,
    cancelRenameFolder,
    confirmCreateFolder,
    cancelCreateFolder,
    formatSize
  ]);

  // 渲染右键菜单
  const renderContextMenu = () => {
    if (!state.contextMenu) return null;

    const folder = findFolderById(folderTree, state.contextMenu.folderId);
    if (!folder) return null;

    return (
      <div
        className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[50] py-1"
        style={{
          left: state.contextMenu.x,
          top: state.contextMenu.y
        }}
        onClick={closeContextMenu}
      >
        {allowCreate && (
          <button
            onClick={() => startCreateFolder(folder.id)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <span className="mr-2">📁</span>
            新建子文件夹
          </button>
        )}
        
        {allowRename && (
          <button
            onClick={() => startRenameFolder(folder.id, folder.name)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
          >
            <span className="mr-2">✏️</span>
            重命名
          </button>
        )}
        
        {allowDelete && (
          <button
            onClick={() => deleteFolder(folder.id, folder.name)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center"
          >
            <span className="mr-2">🗑️</span>
            删除文件夹
          </button>
        )}
      </div>
    );
  };

  // 根据ID查找文件夹
  const findFolderById = (folders: FolderNode[], id: string): FolderNode | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolderById(folder.children, id);
      if (found) return found;
    }
    return null;
  };

  // 点击外部关闭菜单
  React.useEffect(() => {
    if (!state.contextMenu) return;

    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [state.contextMenu, closeContextMenu]);

  return (
    <div className="relative">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700">文件夹</h3>
        {allowCreate && (
          <button
            onClick={() => startCreateFolder()}
            className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            title="新建文件夹"
          >
            ➕
          </button>
        )}
      </div>

      {/* 文件夹树 */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {folderTree.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-sm">暂无文件夹</p>
            {allowCreate && (
              <button
                onClick={() => startCreateFolder()}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                创建第一个文件夹
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {folderTree.map(folder => renderFolderNode(folder))}
          </div>
        )}

        {/* 根目录创建文件夹 */}
        {state.creatingFolder === null && (
          <div className="flex items-center py-1 px-2">
            <span className="mr-2 text-yellow-600">📁</span>
            <input
              type="text"
              value={state.newFolderName}
              onChange={(e) => setState(prev => ({ ...prev, newFolderName: e.target.value }))}
              onBlur={confirmCreateFolder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmCreateFolder();
                } else if (e.key === 'Escape') {
                  cancelCreateFolder();
                }
              }}
              className="flex-1 px-1 py-0 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {renderContextMenu()}
    </div>
  );
};

export default FolderManager; 