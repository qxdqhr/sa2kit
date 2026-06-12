import { z } from 'zod';

const aliyunSmsSchema = z.object({
  accessKeyId: z.string().optional(),
  accessKeySecret: z.string().optional(),
  signName: z.string().optional(),
  templateCode: z.string().optional(),
  countryCode: z.string().optional(),
  codeValidMinutes: z.coerce.number().int().positive().optional(),
  endpoint: z.string().url().optional(),
});

const authSchema = z.object({
  secret: z.string().min(32, 'auth.secret 至少 32 字符'),
  url: z.string().url('auth.url 须为合法 URL'),
  publicUrl: z.string().url('auth.publicUrl 须为合法 URL'),
  trustedOrigins: z.array(z.string().url()).optional(),
  logOtpInDev: z.boolean().optional(),
  sms: z
    .object({
      provider: z.enum(['console', 'aliyun-pnvs', 'none']).optional(),
      aliyun: aliyunSmsSchema.optional(),
    })
    .optional(),
  email: z
    .object({
      provider: z.string().optional(),
    })
    .optional(),
});

const databaseSchema = z.object({
  url: z.string().min(1, 'database.url 不能为空'),
  poolSize: z.coerce.number().int().positive().max(100).optional(),
  timeout: z.coerce.number().int().positive().max(30000).optional(),
  sslMode: z.enum(['disable', 'prefer', 'require']).optional(),
});

const aliyunOssSchema = z.object({
  enabled: z.boolean().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  accessKeyId: z.string().optional(),
  accessKeySecret: z.string().optional(),
  customDomain: z.string().optional(),
  secure: z.boolean().optional(),
  internal: z.boolean().optional(),
});

const aliyunCdnSchema = z.object({
  enabled: z.boolean().optional(),
  domain: z.string().optional(),
  accessKeyId: z.string().optional(),
  accessKeySecret: z.string().optional(),
});

const huarongdaoLevelSchema = z.object({
  id: z.coerce.number(),
  label: z.string(),
  rows: z.coerce.number(),
  cols: z.coerce.number(),
  shuffleSteps: z.coerce.number(),
  sourceImageUrl: z.string().optional().default(''),
});

const businessSchema = z
  .object({
    /** 首页 Hero / 导航 / 时间线等（profile-v1 Home 模块） */
    homePage: z.record(z.string(), z.unknown()).optional(),
    huarongdao: z
      .object({
        theme: z.enum(['miku', 'sakura']).optional(),
        levels: z.array(huarongdaoLevelSchema).optional(),
        bgmTracks: z.array(z.string()).optional(),
      })
      .optional(),
    qiniu: z
      .object({
        accessKey: z.string().optional(),
        secretKey: z.string().optional(),
        bucketName: z.string().optional(),
        domain: z.string().optional(),
      })
      .optional(),
  })
  .optional();

export const appConfigSchema = z.object({
  app: z.object({
    name: z.string().min(1),
    env: z.enum(['development', 'production', 'test']).optional(),
  }),
  database: databaseSchema,
  auth: authSchema,
  storage: z
    .object({
      aliyunOss: aliyunOssSchema.optional(),
      aliyunCdn: aliyunCdnSchema.optional(),
    })
    .optional(),
  business: businessSchema,
});

export type AppConfig = z.infer<typeof appConfigSchema>;
export type AppConfigInput = z.input<typeof appConfigSchema>;
