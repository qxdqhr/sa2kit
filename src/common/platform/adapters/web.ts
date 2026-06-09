import { WebRequestAdapter } from '../../../request/adapters/web-adapter';
import { WebStorageAdapter } from '../../../storage/adapters/web-adapter';
import type {
  FilePickAdapter,
  FilePickOptions,
  PlatformAdapter,
  PickedFile,
} from '../types';

function createWebFilePickAdapter(): FilePickAdapter {
  return {
    async pickFiles(options?: FilePickOptions): Promise<PickedFile[]> {
      if (typeof document === 'undefined') {
        throw new Error('[PlatformAdapter:web] filePick 需要浏览器 document');
      }

      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        if (options?.accept) {
          input.accept = options.accept;
        }
        if (options?.multiple) {
          input.multiple = true;
        }

        input.onchange = () => {
          const files = Array.from(input.files ?? []);
          input.remove();
          resolve(
            files.map(file => ({
              name: file.name,
              mimeType: file.type || undefined,
              size: file.size,
              blob: file,
            })),
          );
        };

        input.oncancel = () => {
          input.remove();
          resolve([]);
        };

        document.body.appendChild(input);
        input.click();
        input.addEventListener('error', () => {
          input.remove();
          reject(new Error('[PlatformAdapter:web] filePick 失败'));
        });
      });
    },
  };
}

/** 浏览器 / Next.js CSR 官方 adapter */
export function createWebPlatformAdapter(
  options: { filePick?: boolean } = {},
): PlatformAdapter {
  return {
    storage: new WebStorageAdapter(),
    fetch: new WebRequestAdapter(),
    filePick: options.filePick === false ? undefined : createWebFilePickAdapter(),
  };
}
