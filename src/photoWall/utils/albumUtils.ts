import { arrayMove } from '@dnd-kit/sortable';

export function handleDragEnd(
  event: any,
  currentAlbum: string,
  albums: Record<string, string[]>,
  setAlbums: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void
) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setAlbums((prev) => {
    const list = prev[currentAlbum] ? [...prev[currentAlbum]] : [];
    const oldIndex = list.indexOf(String(active.id));
    const newIndex = list.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return prev;
    const nextList = arrayMove(list, oldIndex, newIndex);
    return { ...prev, [currentAlbum]: nextList };
  });
}

export function renameAlbum(
  oldName: string,
  albums: Record<string, string[]>,
  setAlbums: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
  currentAlbum: string,
  setCurrentAlbum: (album: string) => void
) {
  const name = prompt('重命名相册', oldName);
  if (!name || name === oldName) return;

  setAlbums((prev) => {
    const next: Record<string, string[]> = {};
    Object.keys(prev).forEach((k) => {
      if (k === oldName) next[name] = prev[k] ?? [];
      else next[k] = prev[k] ?? [];
    });
    return next;
  });

  if (currentAlbum === oldName) setCurrentAlbum(name);
}

export function deleteAlbum(
  name: string,
  albums: Record<string, string[]>,
  setAlbums: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
  images: string[],
  currentAlbum: string,
  setCurrentAlbum: (album: string) => void
) {
  if (!confirm(`删除相册 ${name} ?`)) return;

  setAlbums((prev) => {
    const next = { ...prev };
    delete next[name];
    if (!next.All) next.All = images;
    return next;
  });

  if (currentAlbum === name) setCurrentAlbum('All');
}

export function moveSelectedToAlbum(
  dest: string,
  selected: Record<string, boolean>,
  albums: Record<string, string[]>,
  setAlbums: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
  clearSelection: () => void
) {
  const sel = Object.keys(selected).filter((k) => selected[k]);
  if (!sel.length) return alert('未选中图片');

  setAlbums((prev) => {
    const next = { ...prev };
    next[dest] = Array.from(new Set([...(next[dest] || []), ...sel]));
    return next;
  });

  clearSelection();
}
