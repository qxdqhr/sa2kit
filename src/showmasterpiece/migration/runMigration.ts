/**
 * ShowMasterpiece模块 - 作品图片迁移运行脚本
 *
 * 将Base64图片数据迁移到通用文件服务系统的逻辑封装。
 */

import { ArtworkMigrator, type MigrationConfig, type MigrationStats } from './ArtworkMigrator';

export interface ParsedMigrationArgs {
  config: MigrationConfig;
  showHelp: boolean;
}

export function parseMigrationArguments(args: string[]): ParsedMigrationArgs {
  const config: MigrationConfig = {
    batchSize: 50,
    dryRun: false,
    validateFiles: true,
    backupOldData: true,
    forceOverwrite: false,
    enableOSSUpload: false,
    collectionIds: undefined,
  };

  let showHelp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        showHelp = true;
        break;

      case '--dry-run':
        config.dryRun = true;
        break;

      case '--batch-size': {
        const batchSize = parseInt(args[++i] || '', 10);
        if (isNaN(batchSize) || batchSize <= 0) {
          throw new Error('批大小必须是大于0的数字');
        }
        config.batchSize = batchSize;
        break;
      }

      case '--collection-id':
      case '--collection-ids': {
        const collectionIdsStr = args[++i];
        if (!collectionIdsStr) {
          throw new Error('请指定画集ID');
        }
        config.collectionIds = collectionIdsStr.split(',').map((id) => {
          const num = parseInt(id.trim(), 10);
          if (isNaN(num)) {
            throw new Error(`无效的画集ID: ${id}`);
          }
          return num;
        });
        break;
      }

      case '--no-validate':
        config.validateFiles = false;
        break;

      case '--validate':
        config.validateFiles = true;
        break;

      case '--no-backup':
        config.backupOldData = false;
        break;

      case '--backup':
        config.backupOldData = true;
        break;

      case '--force':
        config.forceOverwrite = true;
        break;

      case '--enable-oss':
        config.enableOSSUpload = true;
        break;

      default:
        throw new Error(`未知选项: ${arg}`);
    }
  }

  return { config, showHelp };
}

export function getMigrationHelpText(): string {
  return `
ShowMasterpiece模块图片迁移工具

用法:
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts [选项]

选项:
  -h, --help              显示帮助信息
  --dry-run               试运行，不实际执行迁移
  --batch-size <number>   批处理大小（默认: 50）
  --collection-id <ids>   指定画集ID，用逗号分隔（如: 1,2,3）
  --validate              验证文件完整性（默认开启）
  --no-validate           跳过文件验证
  --backup                备份原始数据（默认开启）
  --no-backup             跳过数据备份
  --force                 强制覆盖已存在的文件
  --enable-oss            启用OSS上传

示例:
  # 试运行，查看将要迁移的数据
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --dry-run

  # 迁移指定画集的作品
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --collection-id 1,2,3

  # 小批量测试迁移
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --batch-size 5 --dry-run

  # 完整迁移（包含验证和备份）
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --validate --backup

  # 强制覆盖已迁移的文件
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --force

  # 不验证文件，快速迁移
  npx tsx src/modules/showmasterpiece/migration/runMigration.ts --no-validate --no-backup

注意事项:
  - 首次运行建议使用 --dry-run 进行测试
  - 迁移前会自动备份原始数据（除非使用 --no-backup）
  - 使用 --force 选项会覆盖已迁移的文件
  - 迁移过程中请保持数据库连接稳定
`;
}

export function validateMigrationPrerequisites(config: MigrationConfig): void {
  console.log('🔍 验证迁移前置条件...');

  if (!process.env.DATABASE_URL) {
    throw new Error('数据库连接URL未设置，请设置 DATABASE_URL 环境变量');
  }

  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
  if (majorVersion < 16) {
    throw new Error(`Node.js版本过低: ${nodeVersion}，请使用 Node.js 16 或更高版本`);
  }

  if (config.dryRun) {
    console.log('🔍 当前为试运行模式，不会实际修改数据');
  }

  console.log('✅ 前置条件验证通过');
}

export async function runArtworkMigration(db: any, config: MigrationConfig): Promise<MigrationStats> {
  const migrator = new ArtworkMigrator(db, config);
  return migrator.migrate();
}
