import { describe, expect, it } from 'vitest';
import { amapProvider } from '../../src/common/appLauncher/providers/amap';
import { qqProvider } from '../../src/common/appLauncher/providers/qq';
import { wechatProvider } from '../../src/common/appLauncher/providers/wechat';
import { parseReturnUrl } from '../../src/common/appLauncher/core/return-handler';
import { buildAmapNavigationUrl } from '../../src/common/appLauncher/shortcuts';
import { AppLaunchError } from '../../src/common/appLauncher/types';

describe('common/appLauncher providers', () => {
  const context = {
    sourceApplication: 'test-app',
    options: {},
  };

  it('amap navigate 生成关键词导航链接', () => {
    const urls = amapProvider.buildUrls(
      'navigate',
      { destination: '方恒国际中心' },
      context,
    );

    expect(decodeURIComponent(urls.primary)).toContain('方恒国际中心');
    expect(urls.fallback).toContain('uri.amap.com');
  });

  it('buildAmapNavigationUrl 与 provider 一致', () => {
    const fromShortcut = buildAmapNavigationUrl('测试地点', 'profile-v1');
    const fromProvider = amapProvider.buildUrls(
      'navigate',
      { destination: '测试地点' },
      { sourceApplication: 'profile-v1', options: {} },
    ).primary;

    expect(fromShortcut).toBe(fromProvider);
  });

  it('qq share 生成 mqqapi scheme', () => {
    const urls = qqProvider.buildUrls(
      'share',
      { title: '标题', url: 'https://example.com', summary: '摘要' },
      context,
    );

    expect(urls.primary.startsWith('mqqapi://share/to_fri')).toBe(true);
    expect(urls.primary).toContain('title=');
    expect(urls.primary).toContain('url=');
  });

  it('wechat share 需要 title 与 url', () => {
    expect(() =>
      wechatProvider.validateParams?.('share', { title: '', url: '' }),
    ).toThrow(AppLaunchError);
  });

  it('parseReturnUrl 解析 query 参数', () => {
    const payload = parseReturnUrl(
      'myapp://callback?provider=amap&action=navigate&code=1',
    );

    expect(payload.provider).toBe('amap');
    expect(payload.action).toBe('navigate');
    expect(payload.params.code).toBe('1');
  });
});
