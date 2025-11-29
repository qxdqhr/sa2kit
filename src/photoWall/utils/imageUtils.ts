export function exportSelected(selected: Record<string, boolean>) {
  const arr = Object.keys(selected).filter((k) => selected[k]);
  const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected-images.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSelected(selected: Record<string, boolean>) {
  const arr = Object.keys(selected).filter((k) => selected[k]);
  arr.forEach((url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

export function handleSaveEdited(
  newDataUrl: string,
  src: string,
  albums: Record<string, string[]>,
  setAlbums: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
  images: string[],
  setImages: (updater: (prev: string[]) => string[]) => void
) {
  setAlbums((prev) => {
    const next: Record<string, string[]> = {};
    for (const k of Object.keys(prev)) {
      next[k] = prev[k]?.map((s) => (s === src ? newDataUrl : s)) ?? [];
    }
    return next;
  });

  // also images list
  setImages((prev) => prev.map((s) => (s === src ? newDataUrl : s)));
}

