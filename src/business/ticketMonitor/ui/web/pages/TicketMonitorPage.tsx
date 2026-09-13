'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketMonitorApiPath } from '../../../domain/ticketMonitorApiPath';
import type { SyncStatusSummary, TicketEvent, TicketSource, TicketStatus } from '../../../domain/types';
import { SOURCE_LABEL_MAP, STATUS_LABEL_MAP, TICKET_SOURCES } from '../../../domain/types';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { fetchSyncStatus } from '../services/ticketMonitorApi';

interface TicketApiResponse {
  success: boolean;
  data: TicketEvent[];
  meta: {
    total: number;
    errors: string[];
    fetchedAt: string;
    lastSyncAt: string | null;
    cacheHit: boolean;
  };
}

interface TicketAccount {
  id: string;
  platform: TicketSource;
  label: string;
  username: string;
  password: string;
  note?: string;
  updatedAt: string;
}

interface TicketAccountFormState {
  platform: TicketSource;
  label: string;
  username: string;
  password: string;
  note: string;
}

const LOCAL_STORAGE_ACCOUNTS_KEY = 'ticket-monitor-accounts-v1';

const allStatuses: Array<{ value: '' | TicketStatus; label: string }> = [
  { value: '', label: '全部状态' },
  { value: 'upcoming', label: '未开票' },
  { value: 'on_sale', label: '售卖中' },
  { value: 'ended', label: '已结束' },
  { value: 'unknown', label: '未知' },
];

const statusColorMap: Record<TicketStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-800',
  on_sale: 'bg-green-100 text-green-800',
  ended: 'bg-gray-100 text-gray-700',
  unknown: 'bg-yellow-100 text-yellow-800',
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getFallbackCover(event: TicketEvent) {
  const label = SOURCE_LABEL_MAP[event.source].toUpperCase();
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0%' stop-color='#111827'/>
<stop offset='100%' stop-color='#1f2937'/>
</linearGradient>
</defs>
<rect width='1200' height='675' fill='url(#g)'/>
<text x='60' y='110' font-size='44' fill='#93c5fd' font-family='Arial, sans-serif'>${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getEmptyAccountFormState(platform: TicketSource = 'eplus'): TicketAccountFormState {
  return { platform, label: '', username: '', password: '', note: '' };
}

export default function TicketMonitorPage() {
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | TicketStatus>('');
  const [sortByEndAtDesc, setSortByEndAtDesc] = useState(false);
  const [selectedSources, setSelectedSources] = useState<TicketSource[]>([...TICKET_SOURCES]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, true>>({});
  const [accounts, setAccounts] = useState<TicketAccount[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<TicketAccountFormState>(getEmptyAccountFormState());
  const [accountFormError, setAccountFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncStatusSummary | null>(null);

  const buildQueryString = useCallback((
    nextQ: string,
    nextStatus: '' | TicketStatus,
    nextSources: TicketSource[],
    nextSortByEndAtDesc: boolean,
  ) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    nextSources.forEach((source) => params.append('source', source));
    if (nextStatus) params.set('status', nextStatus);
    if (nextSortByEndAtDesc) params.set('sortByEndAtDesc', '1');
    params.set('limit', '50');
    return params.toString();
  }, []);

  const loadEvents = useCallback(async (
    next: {
      q?: string;
      status?: '' | TicketStatus;
      sources?: TicketSource[];
      sortByEndAtDesc?: boolean;
    } = {},
  ) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const requestQ = next.q ?? q;
      const requestStatus = next.status ?? status;
      const requestSources = next.sources ?? selectedSources;
      const requestSortByEndAtDesc = next.sortByEndAtDesc ?? sortByEndAtDesc;
      const queryString = buildQueryString(
        requestQ,
        requestStatus,
        requestSources,
        requestSortByEndAtDesc,
      );

      const [eventsResponse, sync] = await Promise.all([
        fetch(ticketMonitorApiPath(`events?${queryString}`), { cache: 'no-store' }),
        fetchSyncStatus(),
      ]);

      if (!eventsResponse.ok) {
        throw new Error(`request failed with status ${eventsResponse.status}`);
      }

      const data = (await eventsResponse.json()) as TicketApiResponse;
      setEvents(data.data || []);
      setBrokenImageIds({});
      setFetchedAt(data.meta?.fetchedAt || '');
      setLastSyncAt(data.meta?.lastSyncAt ?? null);
      setSyncSummary(sync);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败';
      setErrorMessage(message);
      setEvents([]);
      setBrokenImageIds({});
      setFetchedAt('');
      setLastSyncAt(null);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString, q, selectedSources, sortByEndAtDesc, status]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TicketAccount[];
      if (!Array.isArray(parsed)) return;
      const valid = parsed.filter((item) => (
        item
        && TICKET_SOURCES.includes(item.platform)
        && typeof item.label === 'string'
        && typeof item.username === 'string'
        && typeof item.password === 'string'
      ));
      setAccounts(valid);
    } catch {
      // ignore invalid localStorage data
    }
  }, []);

  const saveAccountsToLocalStorage = useCallback((nextAccounts: TicketAccount[]) => {
    setAccounts(nextAccounts);
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  }, []);

  const addAccount = () => {
    const label = accountForm.label.trim();
    const username = accountForm.username.trim();
    const password = accountForm.password.trim();
    if (!label || !username || !password) {
      setAccountFormError('请至少填写平台、账号标签、登录账号、密码');
      return;
    }

    const newAccount: TicketAccount = {
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      platform: accountForm.platform,
      label,
      username,
      password,
      note: accountForm.note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    saveAccountsToLocalStorage([newAccount, ...accounts]);
    setAccountForm(getEmptyAccountFormState(accountForm.platform));
    setAccountFormError('');
  };

  const deleteAccount = (id: string) => {
    saveAccountsToLocalStorage(accounts.filter((item) => item.id !== id));
  };

  const toggleSource = (source: TicketSource) => {
    setSelectedSources((prev) => {
      let next = prev;
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        next = prev.filter((item) => item !== source);
      } else {
        next = [...prev, source];
      }
      void loadEvents({ sources: next });
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">开票信息聚合（后台缓存）</h1>
            <p className="mt-1 text-sm text-gray-600">
              数据由后台每 5 分钟同步；飞书通知请在配置页设置
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ticket-monitor/config"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              通知配置
            </Link>
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              抢票账号（
              {accounts.length}
              ）
            </button>
          </div>
        </div>

        <SyncStatusBar summary={syncSummary} lastSyncAt={lastSyncAt} />

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">关键词</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="如：初音未来 / LoveLive"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
              <select
                value={status}
                onChange={(e) => {
                  const nextStatus = e.target.value as '' | TicketStatus;
                  setStatus(nextStatus);
                  void loadEvents({ status: nextStatus });
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {allStatuses.map((item) => (
                  <option key={item.value || 'all'} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void loadEvents()}
                disabled={loading}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '加载中...' : '刷新列表'}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">来源平台</p>
            <div className="flex flex-wrap gap-2">
              {TICKET_SOURCES.map((source) => {
                const checked = selectedSources.includes(source);
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleSource(source)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      checked ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {SOURCE_LABEL_MAP[source]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={sortByEndAtDesc}
                onChange={() => {
                  const next = !sortByEndAtDesc;
                  setSortByEndAtDesc(next);
                  void loadEvents({ sortByEndAtDesc: next });
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              按结束售卖时间倒序
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <span>结果数：{events.length}</span>
            <div className="flex items-center gap-2">
              <span>缓存读取：{fetchedAt ? formatDateTime(fetchedAt) : '-'}</span>
              <div className="ml-1 flex gap-2">
                <button type="button" onClick={() => setView('list')} className={`rounded-md px-3 py-1.5 text-xs ${view === 'list' ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>列表</button>
                <button type="button" onClick={() => setView('grid')} className={`rounded-md px-3 py-1.5 text-xs ${view === 'grid' ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}>网格</button>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              接口请求失败：
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && events.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              缓存中暂无数据。请先运行
              {' '}
              <code className="rounded bg-gray-100 px-1">pnpm ticket-monitor:sync</code>
              {' '}
              或等待后台 cron 同步。
            </div>
          ) : null}

          <div className={view === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {events.map((event) => (
              <article key={event.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                  <img
                    src={brokenImageIds[event.id] ? getFallbackCover(event) : (event.coverImage || getFallbackCover(event))}
                    alt={event.title}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImageIds((prev) => ({ ...prev, [event.id]: true }))}
                  />
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{SOURCE_LABEL_MAP[event.source]}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusColorMap[event.status]}`}>{STATUS_LABEL_MAP[event.status]}</span>
                </div>
                <h2 className="text-base font-semibold leading-snug text-gray-900">{event.title}</h2>
                {event.source === 'asobistore' && event.receptionTitle ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-lg leading-snug text-gray-900" style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}>{event.receptionTitle}</p>
                    {event.seatInfo ? <p className="text-sm leading-snug text-gray-600" style={{ fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif' }}>{event.seatInfo}</p> : null}
                  </div>
                ) : null}
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    开票时间：
                    {formatDateTime(event.ticketOpenAt)}
                  </p>
                  {event.ticketEndAt ? (
                    <p>
                      结束售卖：
                      {formatDateTime(event.ticketEndAt)}
                    </p>
                  ) : null}
                  <p>
                    抓取时间：
                    {formatDateTime(event.fetchedAt)}
                  </p>
                  <p>
                    地区：
                    {event.location || '-'}
                  </p>
                </div>
                <div className="mt-3">
                  <a href={event.eventUrl} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">
                    前往官网
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {isAccountModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">抢票账号预填信息</h2>
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">关闭</button>
              </div>
              <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">平台</label>
                  <select value={accountForm.platform} onChange={(e) => setAccountForm((prev) => ({ ...prev, platform: e.target.value as TicketSource }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                    {TICKET_SOURCES.map((source) => (
                      <option key={source} value={source}>{SOURCE_LABEL_MAP[source]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">账号标签</label>
                  <input value={accountForm.label} onChange={(e) => setAccountForm((prev) => ({ ...prev, label: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">登录账号</label>
                  <input value={accountForm.username} onChange={(e) => setAccountForm((prev) => ({ ...prev, username: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
                  <input type="password" value={accountForm.password} onChange={(e) => setAccountForm((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">备注（可选）</label>
                  <input value={accountForm.note} onChange={(e) => setAccountForm((prev) => ({ ...prev, note: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  {accountFormError ? <p className="mb-2 text-sm text-red-600">{accountFormError}</p> : null}
                  <button type="button" onClick={addAccount} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">增加账号</button>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {TICKET_SOURCES.map((source) => {
                  const sourceAccounts = accounts.filter((item) => item.platform === source);
                  return (
                    <section key={source} className="rounded-lg border border-gray-200 p-3">
                      <h3 className="mb-2 text-sm font-semibold text-gray-800">
                        {SOURCE_LABEL_MAP[source]}
                        （
                        {sourceAccounts.length}
                        ）
                      </h3>
                      {sourceAccounts.length === 0 ? (
                        <p className="text-sm text-gray-500">暂无账号</p>
                      ) : (
                        <div className="space-y-2">
                          {sourceAccounts.map((account) => (
                            <div key={account.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-900">{account.label}</p>
                                  <p className="truncate text-xs text-gray-600">
                                    账号：
                                    {account.username}
                                  </p>
                                </div>
                                <button type="button" onClick={() => deleteAccount(account.id)} className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50">删除</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
