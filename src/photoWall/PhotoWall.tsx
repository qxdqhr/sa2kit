// =========================================
// Professional PhotoWall v3 - Modular Version
// =========================================

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Columns,
  LayoutGrid,
  Grid,
  List,
  Search,
  Download,
  Trash2,
  Folder,
  FolderPlus,
  Edit3,
  Settings
} from 'lucide-react';

// dnd-kit imports
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Local imports
import { PhotoWallProps, PhotoWallLayout } from './types';
import { Lightbox } from './components/Lightbox';
import { Skeleton } from './components/Skeleton';
import { SortableItem } from './components/SortableItem';
import { ImageEditor } from './components/ImageEditor';
import { AlbumManager } from './components/AlbumManager';
import {
  handleDragEnd,
  renameAlbum,
  deleteAlbum,
  moveSelectedToAlbum
} from './utils/albumUtils';
import {
  exportSelected,
  downloadSelected,
  handleSaveEdited
} from './utils/imageUtils';

// Re-export types
export type { PhotoWallLayout, PhotoWallProps };

// Main PhotoWall component

export function PhotoWall({ initialLayout = 'masonry', onSelectionChange, images: propImages }: PhotoWallProps) {
  const [images, setImages] = useState<string[]>(propImages || [])
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<PhotoWallLayout>(initialLayout)
  const [preview, setPreview] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const [albums, setAlbums] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('photoWallAlbums')
      return raw ? JSON.parse(raw) : { All: [] }
    } catch (e) {
      return { All: [] }
    }
  })
  const [currentAlbum, setCurrentAlbum] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState<number>(20)
  const [editingSrc, setEditingSrc] = useState<string | null>(null)
  const [showAlbumManager, setShowAlbumManager] = useState(false)

  // load images
  useEffect(() => {
    if (propImages) {
      setImages(propImages)
      setLoading(false)
      // merge into albums All if empty
      setAlbums((prev) => {
        const next = { ...prev }
        if (!next.All || next.All.length === 0) next.All = propImages
        return next
      })
    } else {
      // No images provided, set empty array and stop loading
      setImages([])
      setLoading(false)
    }
  }, [propImages])

  // persist albums/ordering to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('photoWallAlbums', JSON.stringify(albums))
    } catch (e) {}
  }, [albums])

  // visible slice + search
  const visible = useMemo(() => {
    const base = albums[currentAlbum] ?? []
    let list = base.slice()
    if (query) list = list.filter((i) => i.toLowerCase().includes(query.toLowerCase()))
    return list.slice(0, visibleCount)
  }, [albums, currentAlbum, query, visibleCount])

  // infinite scroll
  useEffect(() => {
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        setVisibleCount((v) => v + 10)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // drag end handler: reorder within current album
  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event, currentAlbum, albums, setAlbums);
  }

  function toggleSelect(src: string) {
    setSelected((prev) => {
      const n = { ...prev, [src]: !prev[src] }
      const arr = Object.keys(n).filter((k) => n[k])
      onSelectionChange?.(arr)
      return n
    })
  }


  // timeline grouping by date (uses fake dates if none)
  const timeline = useMemo(() => {
    const base = albums[currentAlbum] ?? []
    const groups: Record<string, string[]> = {}
    base.forEach((s) => {
      // try extract date from filename like 2025-11-28 or use random placeholder
      const m = s.match(/(\d{4}-\d{2}-\d{2})/)
      const date = (m ? m[1] : new Date().toISOString().slice(0, 10) )|| new Date().toISOString().slice(0, 10)
      if (!groups[date]) groups[date] = []
      groups[date].push(s)
    })
    // sort dates desc
    const ordered = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1)).reduce((acc: any, d) => {
      acc[d] = groups[d]
      return acc
    }, {})
    return ordered as Record<string, string[]>
  }, [albums, currentAlbum])

  // album manager helpers
  const onRenameAlbum = (oldName: string) => {
    renameAlbum(oldName, albums, setAlbums, currentAlbum, setCurrentAlbum);
  };

  const onDeleteAlbum = (name: string) => {
    deleteAlbum(name, albums, setAlbums, images, currentAlbum, setCurrentAlbum);
  };

  const onMoveSelectedToAlbum = (dest: string) => {
    moveSelectedToAlbum(dest, selected, albums, setAlbums, clearSelection);
  };

  function clearSelection() {
    setSelected({});
    onSelectionChange?.([]);
  }

  function onExportSelected() {
    exportSelected(selected);
  }

  function onDownloadSelected() {
    downloadSelected(selected);
  }

  function onHandleSaveEdited(newDataUrl: string, src: string) {
    handleSaveEdited(newDataUrl, src, albums, setAlbums, images, setImages);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        {/* Albums bar + manager */}
        <div className="flex items-center gap-2 mr-4 overflow-auto">
          {Object.keys(albums).map((a) => (
            <button
              key={a}
              onClick={() => {
                setCurrentAlbum(a)
                setVisibleCount(20)
              }}
              className={`px-3 py-1 rounded-full border flex items-center gap-1 ${currentAlbum === a ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              <Folder size={14} /> {a}
            </button>
          ))}

          <button
            onClick={() => {
              const name = prompt('新相册名称')
              if (!name) return
              setAlbums((p) => ({ ...p, [name]: [] }))
            }}
            className="px-2 py-1 border rounded-full"
            title="新建相册"
          >
            <FolderPlus size={14} />
          </button>

          <button onClick={() => setShowAlbumManager(true)} className="px-2 py-1 border rounded-full ml-2"><Settings size={14} /></button>
        </div>

        {/* layout buttons */}
        <div className="flex gap-2">
          <button onClick={() => setLayout('masonry')} className="btn"><Columns size={18} /></button>
          <button onClick={() => setLayout('grid')} className="btn"><LayoutGrid size={18} /></button>
          <button onClick={() => setLayout('columns')} className="btn"><Grid size={18} /></button>
          <button onClick={() => setLayout('list')} className="btn"><List size={18} /></button>
          <button onClick={() => setLayout('timeline')} className="btn">Timeline</button>
        </div>

        {/* search + actions */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索..."
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-2.5" size={18} />
          </div>

          <div className="flex gap-2">
            <button onClick={onExportSelected} className="btn" title="导出选中"><Download size={16} /></button>
            <button onClick={clearSelection} className="btn" title="清空选择"><Trash2 size={16} /></button>
            <div className="flex items-center gap-2">
              <button onClick={() => onMoveSelectedToAlbum(prompt('目标相册名称') || '')} className="btn">移动到...</button>
            </div>
          </div>
        </div>
      </div>

      {/* Album Manager Modal */}
      <AnimatePresence>
        {showAlbumManager && (
          <AlbumManager
            albums={albums}
            onRenameAlbum={onRenameAlbum}
            onDeleteAlbum={onDeleteAlbum}
            onClose={() => setShowAlbumManager(false)}
          />
        )}
      </AnimatePresence>

      {/* Content area */}
      {layout === 'timeline' ? (
        <div className="space-y-6">
          {Object.keys(timeline).map((date) => (
            <div key={date}>
              <div className="text-sm text-gray-600 mb-2">{date}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(timeline[date] ?? []).map((src) => (
                  <div key={src} className="rounded-lg overflow-hidden shadow bg-white">
                    <div className="relative">
                      <button
                        onClick={() => toggleSelect(src)}
                        className={`absolute m-2 z-10 px-2 py-1 text-xs rounded-full bg-white/90 border ${selected[src] ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        {selected[src] ? '✓' : '+'}
                      </button>
                      <div onClick={() => setPreview(src)} className="cursor-pointer">
                        <img src={src} alt={src} loading="lazy" className="w-full h-auto" />
                      </div>
                    </div>
                    <div className="p-2 text-xs text-gray-600 truncate">{src.split('/').pop()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible} strategy={verticalListSortingStrategy}>
            <div className={
              layout === 'masonry'
                ? 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
                : layout === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                : layout === 'columns'
                ? 'grid grid-cols-3 gap-4'
                : 'flex flex-col gap-6'
            }>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
                : visible.map((src) => (
                    <SortableItem id={src} key={src}>
                      <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl overflow-hidden shadow bg-white break-inside-avoid relative">
                        <button
                          onClick={() => toggleSelect(src)}
                          className={`absolute m-2 z-10 px-2 py-1 text-xs rounded-full bg-white/90 border ${selected[src] ? 'ring-2 ring-blue-400' : ''}`}
                        >
                          {selected[src] ? '✓' : '+'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (currentAlbum === 'All') return
                            setAlbums((prev) => {
                              const list = prev[currentAlbum] ?? [];
                              return {
                                ...prev,
                                [currentAlbum]: list.includes(src) ? list : [...list, src]
                              };
                            })
                          }}
                          className="absolute top-2 right-2 z-10 bg-white/80 text-xs px-2 py-1 border rounded-full"
                        >
                          + Album
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSrc(src) }}
                          className="absolute top-2 right-14 z-10 bg-white/80 text-xs px-2 py-1 border rounded-full"
                          title="编辑"
                        >
                          <Edit3 size={14} />
                        </button>

                        <div onClick={() => setPreview(src)} className="cursor-pointer">
                          <img src={src} alt={src} loading="lazy" className="w-full h-auto" />
                        </div>

                        <div className="p-2 text-xs text-gray-600 truncate">{src.split('/').pop()}</div>
                      </motion.div>
                    </SortableItem>
                  ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {preview && <Lightbox src={preview} onClose={() => setPreview('')} />}

      {editingSrc && (
        <ImageEditor
          src={editingSrc}
          onClose={() => setEditingSrc(null)}
          onSave={(d) => onHandleSaveEdited(d, editingSrc)}
        />
      )}
    </div>
  )
}

// helper export
export function createPhotoWallConfig(config: PhotoWallProps) {
  return config
}
