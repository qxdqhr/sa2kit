declare module '@tarojs/taro' {
  interface TaroRequestResult<T = unknown> {
    statusCode: number;
    data: T;
  }

  interface TaroRequestOptions {
    url: string;
    method?: string;
    data?: unknown;
    header?: Record<string, string>;
  }

  const Taro: {
    request<T = unknown>(options: TaroRequestOptions): Promise<TaroRequestResult<T>>;
  };

  export default Taro;
}
