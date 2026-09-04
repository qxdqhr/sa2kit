import { toPng } from 'html-to-image';

export type PngExportMode = 'viewport' | 'full';

export async function exportCanvasPng(
  element: HTMLElement,
  filename: string,
  mode: PngExportMode,
): Promise<void> {
  const options =
    mode === 'viewport'
      ? { pixelRatio: 2, backgroundColor: '#f8fafc' }
      : {
          pixelRatio: 2,
          backgroundColor: '#f8fafc',
          filter: (node: HTMLElement) => {
            if (node.classList?.contains('react-flow__minimap')) return false;
            if (node.classList?.contains('react-flow__controls')) return false;
            if (node.classList?.contains('react-flow__panel')) return false;
            return true;
          },
        };

  const dataUrl = await toPng(element, options);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
