export type Sa2kitSmsProvider = {
  sendOTP: (phoneNumber: string, code: string) => void | Promise<void>;
};

export type Sa2kitSmsProviderId = 'console' | 'aliyun-pnvs' | 'none';

export type AliyunPnvsSmsConfig = {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  countryCode?: string;
  codeValidMinutes?: number;
  endpoint?: string;
};
