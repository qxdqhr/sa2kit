import type { AliyunPnvsSmsConfig, Sa2kitSmsProvider } from '../types';

type PopCoreClient = {
  request(
    action: string,
    params: Record<string, string>,
    options?: { method?: string },
  ): Promise<{ Code?: string; Success?: boolean; Message?: string }>;
};

async function loadPopCore(): Promise<new (config: Record<string, string>) => PopCoreClient> {
  try {
    const mod = await import('@alicloud/pop-core');
    return (mod.default ?? mod) as unknown as new (config: Record<string, string>) => PopCoreClient;
  } catch {
    throw new Error(
      '启用 SA2KIT_SMS_PROVIDER=aliyun-pnvs 需要安装 @alicloud/pop-core：pnpm add @alicloud/pop-core',
    );
  }
}

export function createAliyunPnvsSmsProvider(config: AliyunPnvsSmsConfig): Sa2kitSmsProvider {
  return {
    async sendOTP(phoneNumber, code) {
      const Core = await loadPopCore();
      const client = new Core({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        endpoint: config.endpoint ?? 'https://dypnsapi.aliyuncs.com',
        apiVersion: '2017-05-25',
      });

      const minutes = String(config.codeValidMinutes ?? 5);
      const result = await client.request(
        'SendSmsVerifyCode',
        {
          PhoneNumber: phoneNumber,
          CountryCode: config.countryCode ?? '86',
          SignName: config.signName,
          TemplateCode: config.templateCode,
          TemplateParam: JSON.stringify({ code, min: minutes }),
        },
        { method: 'POST' },
      );

      if (result.Code !== 'OK' && result.Success !== true) {
        throw new Error(
          `阿里云短信认证发送失败: ${result.Message ?? result.Code ?? 'unknown error'}`,
        );
      }
    },
  };
}
