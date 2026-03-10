export interface VocaloidBoothConfig {
  boothId: string;
  title: string;
  description?: string;
  defaultTtlHours: number;
  maxFiles: number;
  maxSingleFileSizeMb: number;
  maxTotalFileSizeMb: number;
  allowedExtensions: string[];
}

export const defaultVocaloidBoothConfig: VocaloidBoothConfig = {
  boothId: 'default-booth',
  title: 'MMD / Vocaloid 创作文件寄存站',
  description: '上传创作文件并生成匹配码，后续可凭码下载',
  defaultTtlHours: 24 * 14,
  maxFiles: 20,
  maxSingleFileSizeMb: 2048,
  maxTotalFileSizeMb: 5120,
  allowedExtensions: ['zip', '7z', 'rar', 'vsqx', 'vpr', 'vmd', 'pmx', 'wav', 'mp3', 'mp4'],
};

export const normalizeVocaloidBoothConfig = (
  input?: Partial<VocaloidBoothConfig>
): VocaloidBoothConfig => {
  const merged = {
    ...defaultVocaloidBoothConfig,
    ...(input ?? {}),
  };

  return {
    ...merged,
    boothId: merged.boothId || defaultVocaloidBoothConfig.boothId,
    title: merged.title || defaultVocaloidBoothConfig.title,
    defaultTtlHours: Math.max(1, merged.defaultTtlHours),
    maxFiles: Math.max(1, merged.maxFiles),
    maxSingleFileSizeMb: Math.max(1, merged.maxSingleFileSizeMb),
    maxTotalFileSizeMb: Math.max(1, merged.maxTotalFileSizeMb),
    allowedExtensions: (merged.allowedExtensions?.length
      ? merged.allowedExtensions
      : defaultVocaloidBoothConfig.allowedExtensions
    ).map((ext) => ext.toLowerCase()),
  };
};
