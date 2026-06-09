export type ScreenReceiverHandle = {
  close: () => void;
};

const servers = new Map<string, ScreenReceiverHandle>();

export function getScreenReceiverServer(key: string): ScreenReceiverHandle | null {
  return servers.get(key) ?? null;
}

export function setScreenReceiverServer(
  key: string,
  handle: ScreenReceiverHandle,
): void {
  servers.set(key, handle);
}

export function clearScreenReceiverRegistry(): void {
  servers.clear();
}
