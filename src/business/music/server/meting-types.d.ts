declare module '@meting/core' {
  export default class Meting {
    constructor(source?: string);
    search(keyword: string, options?: { limit?: number; page?: number; offset?: number }): Promise<any>;
    url(id: string): Promise<any>;
    lyric(id: string): Promise<any>;
    pic(id: string): Promise<any>;
    song(id: string): Promise<any>;
  }
}

