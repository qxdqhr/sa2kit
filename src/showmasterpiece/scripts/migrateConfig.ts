/**
 * ShowMasterpiece 配置迁移脚本
 *
 * 将公共配置管理器中的 OSS 及相关配置复制到 showmasterpiece 独立配置中
 */

import { writeFileSync } from 'fs';

export interface ConfigDbServiceLike {
  getAllConfigItems(): Promise<any[]>;
}

export interface ShowmasterConfigServiceLike {
  getCategoryByName(name: string): Promise<any | null>;
  createCategory(payload: any): Promise<any>;
  getAllCategories(): Promise<any[]>;
  getConfigItemByKey(key: string, environment?: string): Promise<any | null>;
  updateConfigItem(id: number | string, payload: any): Promise<any>;
  createConfigItem(payload: any): Promise<any>;
}

export interface MigrateConfigOptions {
  dryRun?: boolean;
  environment?: 'development' | 'production';
  overwrite?: boolean;
}

export interface MigrationServices {
  configDbService: ConfigDbServiceLike;
  showmasterConfigService: ShowmasterConfigServiceLike;
}

/**
 * 需要迁移的配置项映射
 */
const CONFIG_MIGRATION_MAP = {
  // OSS 配置
  ALIYUN_OSS_REGION: {
    displayName: 'OSS区域',
    description: '阿里云OSS存储区域',
    type: 'string',
    isRequired: true,
    isSensitive: false,
    category: 'oss',
  },
  ALIYUN_OSS_BUCKET: {
    displayName: 'OSS存储桶',
    description: '阿里云OSS存储桶名称',
    type: 'string',
    isRequired: true,
    isSensitive: false,
    category: 'oss',
  },
  ALIYUN_OSS_ACCESS_KEY_ID: {
    displayName: 'AccessKey ID',
    description: '阿里云AccessKey ID',
    type: 'string',
    isRequired: true,
    isSensitive: true,
    category: 'oss',
  },
  ALIYUN_OSS_ACCESS_KEY_SECRET: {
    displayName: 'AccessKey Secret',
    description: '阿里云AccessKey Secret',
    type: 'password',
    isRequired: true,
    isSensitive: true,
    category: 'oss',
  },
  ALIYUN_OSS_CUSTOM_DOMAIN: {
    displayName: '自定义域名',
    description: 'OSS自定义域名（可选）',
    type: 'string',
    isRequired: false,
    isSensitive: false,
    category: 'oss',
  },
  ALIYUN_OSS_SECURE: {
    displayName: '使用HTTPS',
    description: '是否使用HTTPS连接',
    type: 'boolean',
    isRequired: false,
    isSensitive: false,
    category: 'oss',
  },
  ALIYUN_OSS_INTERNAL: {
    displayName: '内网访问',
    description: '是否使用内网访问',
    type: 'boolean',
    isRequired: false,
    isSensitive: false,
    category: 'oss',
  },

  // CDN 配置（可选）
  ALIYUN_CDN_DOMAIN: {
    displayName: 'CDN域名',
    description: '阿里云CDN加速域名',
    type: 'string',
    isRequired: false,
    isSensitive: false,
    category: 'cdn',
  },
  ALIYUN_CDN_ACCESS_KEY_ID: {
    displayName: 'CDN AccessKey ID',
    description: '阿里云CDN AccessKey ID',
    type: 'string',
    isRequired: false,
    isSensitive: true,
    category: 'cdn',
  },
  ALIYUN_CDN_ACCESS_KEY_SECRET: {
    displayName: 'CDN AccessKey Secret',
    description: '阿里云CDN AccessKey Secret',
    type: 'password',
    isRequired: false,
    isSensitive: true,
    category: 'cdn',
  },

  // 文件服务相关配置
  MAX_FILE_SIZE: {
    displayName: '最大文件大小',
    description: '允许上传的最大文件大小（字节）',
    type: 'number',
    isRequired: false,
    isSensitive: false,
    category: 'file',
  },
  FILE_STORAGE_PATH: {
    displayName: '本地存储路径',
    description: '本地文件存储路径',
    type: 'string',
    isRequired: false,
    isSensitive: false,
    category: 'file',
  },
  FILE_BASE_URL: {
    displayName: '文件基础URL',
    description: '文件访问基础URL',
    type: 'string',
    isRequired: false,
    isSensitive: false,
    category: 'file',
  },
} as const;

/**
 * 不迁移的配置项（将在报告中列出）
 */
const NON_MIGRATED_CONFIGS = {
  DATABASE_URL: '数据库连接字符串 - 建议由平台统一管理',
  DATABASE_POOL_SIZE: '数据库连接池配置 - 建议由平台统一管理',
  DATABASE_TIMEOUT: '数据库超时配置 - 建议由平台统一管理',
  DATABASE_SSL_MODE: '数据库SSL配置 - 建议由平台统一管理',

  NODE_ENV: '运行环境标识 - 由部署环境决定',
  NEXTAUTH_SECRET: 'NextAuth密钥 - 建议由平台统一管理',
  NEXTAUTH_URL: 'NextAuth回调URL - 建议由平台统一管理',

  QINIU_ACCESS_KEY: '七牛云配置 - ShowMasterpiece模块不使用',
  QINIU_SECRET_KEY: '七牛云配置 - ShowMasterpiece模块不使用',
  QINIU_BUCKET_NAME: '七牛云配置 - ShowMasterpiece模块不使用',
  QINIU_DOMAIN: '七牛云配置 - ShowMasterpiece模块不使用',

  OPENAI_API_KEY: 'OpenAI配置 - 不属于文件存储范畴',
  REDIS_URL: 'Redis配置 - 建议由平台统一管理',
  'EMAIL_*': '邮件服务配置 - 不属于文件存储范畴',
} as const;

export async function migrateConfigToShowmasterpiece(
  services: MigrationServices,
  options: MigrateConfigOptions = {},
): Promise<any> {
  const { configDbService, showmasterConfigService } = services;
  const { dryRun = false, environment = 'development', overwrite = false } = options;

  console.log('🚀 [配置迁移] 开始迁移公共配置到ShowMasterpiece独立配置...');
  console.log(`📋 [配置迁移] 选项: 预演=${dryRun}, 环境=${environment}, 覆盖=${overwrite}`);

  const migrationResult = {
    categories: 0,
    migrated: 0,
    skipped: 0,
    errors: [] as string[],
    migratedConfigs: [] as string[],
    skippedConfigs: [] as string[],
    nonMigratableConfigs: Object.keys(NON_MIGRATED_CONFIGS),
  };

  // 1. 创建配置分类
  console.log('📦 [配置迁移] 创建配置分类...');
  const categories = [
    {
      name: 'oss',
      displayName: '阿里云OSS配置',
      description: 'ShowMasterpiece模块专用的阿里云对象存储服务配置',
      icon: 'fas fa-cloud',
      sortOrder: 1,
    },
    {
      name: 'cdn',
      displayName: '阿里云CDN配置',
      description: 'ShowMasterpiece模块专用的阿里云内容分发网络配置',
      icon: 'fas fa-globe',
      sortOrder: 2,
    },
    {
      name: 'file',
      displayName: '文件服务配置',
      description: 'ShowMasterpiece模块的文件存储和处理配置',
      icon: 'fas fa-file',
      sortOrder: 3,
    },
  ];

  for (const category of categories) {
    if (!dryRun) {
      try {
        const existingCategory = await showmasterConfigService.getCategoryByName(category.name);
        if (!existingCategory) {
          await showmasterConfigService.createCategory({
            ...category,
            isActive: true,
          });
          migrationResult.categories++;
          console.log(`✅ [配置迁移] 创建分类: ${category.displayName}`);
        } else {
          console.log(`ℹ️ [配置迁移] 分类已存在: ${category.displayName}`);
        }
      } catch (error) {
        console.error(`❌ [配置迁移] 创建分类失败: ${category.displayName}`, error);
        migrationResult.errors.push(`创建分类失败: ${category.displayName}`);
      }
    } else {
      console.log(`🔍 [配置迁移] 预演: 将创建分类 ${category.displayName}`);
    }
  }

  // 2. 获取公共配置项
  console.log('📋 [配置迁移] 获取公共配置项...');
  const publicConfigItems = await configDbService.getAllConfigItems();

  // 3. 获取所有分类的映射
  const categoryMap = new Map<string, any>();
  if (!dryRun) {
    const allCategories = await showmasterConfigService.getAllCategories();
    for (const cat of allCategories) {
      categoryMap.set(cat.name, cat);
    }
  } else {
    categoryMap.set('oss', { id: 'mock-oss-id', name: 'oss', displayName: '阿里云OSS配置' });
    categoryMap.set('cdn', { id: 'mock-cdn-id', name: 'cdn', displayName: '阿里云CDN配置' });
    categoryMap.set('file', { id: 'mock-file-id', name: 'file', displayName: '文件服务配置' });
  }

  // 4. 迁移配置项
  console.log('🔄 [配置迁移] 开始迁移配置项...');
  for (const [configKey, migrationInfo] of Object.entries(CONFIG_MIGRATION_MAP)) {
    try {
      const publicConfigItem = publicConfigItems.find((item) => item.key === configKey);

      if (!publicConfigItem) {
        console.log(`⚠️ [配置迁移] 公共配置中未找到: ${configKey}`);
        migrationResult.skippedConfigs.push(`${configKey} (公共配置中不存在)`);
        migrationResult.skipped++;
        continue;
      }

      const existingConfig = !dryRun
        ? await showmasterConfigService.getConfigItemByKey(configKey, environment)
        : null;

      if (existingConfig && !overwrite) {
        console.log(`ℹ️ [配置迁移] 配置已存在，跳过: ${configKey}`);
        migrationResult.skippedConfigs.push(`${configKey} (已存在)`);
        migrationResult.skipped++;
        continue;
      }

      const category = categoryMap.get(migrationInfo.category);
      if (!category) {
        console.error(`❌ [配置迁移] 分类不存在: ${migrationInfo.category} for ${configKey}`);
        migrationResult.errors.push(`分类不存在: ${migrationInfo.category}`);
        continue;
      }

      if (!dryRun) {
        const configData = {
          categoryId: category.id,
          key: configKey,
          displayName: migrationInfo.displayName,
          description: migrationInfo.description,
          value: publicConfigItem.value || publicConfigItem.defaultValue || '',
          defaultValue: publicConfigItem.defaultValue || '',
          type: migrationInfo.type,
          isRequired: migrationInfo.isRequired,
          isSensitive: migrationInfo.isSensitive,
          environment,
          sortOrder: migrationResult.migrated + 1,
          isActive: true,
        };

        if (existingConfig && overwrite) {
          await showmasterConfigService.updateConfigItem(existingConfig.id, {
            ...configData,
            value: publicConfigItem.value || existingConfig.value,
          });
          console.log(
            `🔄 [配置迁移] 更新配置: ${configKey} = ${publicConfigItem.value ? '***' : '(empty)'}`,
          );
        } else {
          await showmasterConfigService.createConfigItem(configData);
          console.log(`✅ [配置迁移] 迁移配置: ${configKey} = ${publicConfigItem.value ? '***' : '(empty)'}`);
        }

        migrationResult.migratedConfigs.push(configKey);
        migrationResult.migrated++;
      } else {
        console.log(
          `🔍 [配置迁移] 预演: 将迁移 ${configKey} = ${publicConfigItem.value ? '***' : '(empty)'}`,
        );
        migrationResult.migratedConfigs.push(configKey);
      }
    } catch (error) {
      console.error(`❌ [配置迁移] 迁移配置失败: ${configKey}`, error);
      migrationResult.errors.push(`迁移配置失败: ${configKey} - ${error}`);
    }
  }

  // 5. 生成迁移报告
  console.log('\n📊 [配置迁移] 迁移完成！生成报告...\n');

  const report = `
# ShowMasterpiece 配置迁移报告

## 迁移概要
- **迁移模式**: ${dryRun ? '预演模式' : '实际迁移'}
- **目标环境**: ${environment}
- **覆盖模式**: ${overwrite ? '启用' : '禁用'}
- **执行时间**: ${new Date().toLocaleString()}

## 迁移统计
- **创建分类**: ${migrationResult.categories} 个
- **成功迁移**: ${migrationResult.migrated} 个配置项
- **跳过项目**: ${migrationResult.skipped} 个配置项
- **错误数量**: ${migrationResult.errors.length} 个

## 已迁移的配置项
${
  migrationResult.migratedConfigs.length > 0
    ? migrationResult.migratedConfigs
        .map(
          (key) =>
            `- ✅ ${key}: ${CONFIG_MIGRATION_MAP[key as keyof typeof CONFIG_MIGRATION_MAP]?.displayName}`,
        )
        .join('\n')
    : '- 无'
}

## 跳过的配置项
${
  migrationResult.skippedConfigs.length > 0
    ? migrationResult.skippedConfigs.map((item) => `- ⏭️ ${item}`).join('\n')
    : '- 无'
}

## 不可迁移的配置项 (需要人工处理)
${Object.entries(NON_MIGRATED_CONFIGS)
  .map(([key, reason]) => `- ⚠️ ${key}: ${reason}`)
  .join('\n')}

## 错误列表
${
  migrationResult.errors.length > 0
    ? migrationResult.errors.map((error) => `- ❌ ${error}`).join('\n')
    : '- 无错误'
}

## 后续步骤

### 1. 验证迁移结果
访问 ShowMasterpiece 配置页面验证配置是否正确迁移：
\`\`\`
http://localhost:3000/testField/ShowMasterPieces/config
\`\`\`

### 2. 测试文件上传功能
尝试在 ShowMasterpiece 中上传图片，验证 OSS 配置是否正常工作。

### 3. 处理敏感配置
以下敏感配置项需要人工填入实际值：
${migrationResult.migratedConfigs
  .filter((key) => CONFIG_MIGRATION_MAP[key as keyof typeof CONFIG_MIGRATION_MAP]?.isSensitive)
  .map((key) => `- ${key}: ${CONFIG_MIGRATION_MAP[key as keyof typeof CONFIG_MIGRATION_MAP]?.displayName}`)
  .join('\n')}

### 4. 清理旧配置（可选）
迁移成功后，可以考虑在公共配置管理器中禁用或删除已迁移的配置项，避免配置冲突。

### 5. 更新文档
更新项目文档，说明 ShowMasterpiece 模块现在使用独立配置。
`;

  const reportPath = `showmasterpiece-config-migration-report-${environment}-${Date.now()}.md`;
  writeFileSync(reportPath, report);

  console.log(report);
  console.log(`📄 [配置迁移] 详细报告已保存到: ${reportPath}`);

  return migrationResult;
}
