export interface BoothRedeemGuardOptions {
  maxAttempts?: number;
  windowMs?: number;
  blockMs?: number;
}

interface AttemptState {
  attempts: number[];
  blockedUntil?: number;
}

export class BoothRedeemGuard {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockMs: number;
  private readonly state = new Map<string, AttemptState>();

  constructor(options: BoothRedeemGuardOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 8;
    this.windowMs = options.windowMs ?? 60_000;
    this.blockMs = options.blockMs ?? 5 * 60_000;
  }

  assertAllowed(subjectKey: string, now = Date.now()): void {
    const state = this.getState(subjectKey, now);
    if (state.blockedUntil && state.blockedUntil > now) {
      const seconds = Math.ceil((state.blockedUntil - now) / 1000);
      throw new Error(`Too many attempts, retry in ${seconds}s`);
    }
  }

  registerAttempt(subjectKey: string, success: boolean, now = Date.now()): void {
    const state = this.getState(subjectKey, now);

    if (success) {
      this.state.delete(subjectKey);
      return;
    }

    state.attempts.push(now);
    state.attempts = state.attempts.filter((t) => now - t <= this.windowMs);

    if (state.attempts.length >= this.maxAttempts) {
      state.blockedUntil = now + this.blockMs;
      state.attempts = [];
    }

    this.state.set(subjectKey, state);
  }

  private getState(subjectKey: string, now: number): AttemptState {
    const state = this.state.get(subjectKey) ?? { attempts: [] };
    state.attempts = state.attempts.filter((t) => now - t <= this.windowMs);

    if (state.blockedUntil && state.blockedUntil <= now) {
      delete state.blockedUntil;
    }

    return state;
  }
}

export interface ValidateUploadFilesOptions {
  maxFiles?: number;
  maxSingleFileSizeBytes?: number;
  maxTotalSizeBytes?: number;
  allowedExtensions?: string[];
}

export interface UploadLikeFile {
  fileName: string;
  size: number;
}

const ext = (name: string): string => {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
};

export const validateUploadFiles = (
  files: UploadLikeFile[],
  options: ValidateUploadFilesOptions = {}
): void => {
  const maxFiles = options.maxFiles ?? 20;
  const maxSingle = options.maxSingleFileSizeBytes ?? 2 * 1024 * 1024 * 1024;
  const maxTotal = options.maxTotalSizeBytes ?? 5 * 1024 * 1024 * 1024;
  const allowed = options.allowedExtensions?.map((e) => e.toLowerCase());

  if (files.length === 0) {
    throw new Error('No files uploaded');
  }
  if (files.length > maxFiles) {
    throw new Error(`Too many files (max ${maxFiles})`);
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > maxTotal) {
    throw new Error('Total upload size exceeded');
  }

  for (const file of files) {
    if (file.size > maxSingle) {
      throw new Error(`File too large: ${file.fileName}`);
    }
    if (allowed && allowed.length > 0 && !allowed.includes(ext(file.fileName))) {
      throw new Error(`File extension not allowed: ${file.fileName}`);
    }
  }
};
