'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Menu, Rocket, Sparkles, X } from 'lucide-react';
import React, { useState } from 'react';
import { AuthGuard, UserMenu } from 'sa2kit/common/auth/components';

const NAV_ITEMS = [
  { href: '/prompts', label: '提示词管理', icon: Sparkles },
  { href: '/plaza', label: '提示词广场', icon: LayoutGrid },
  { href: '/run', label: '远程运行', icon: Rocket },
] as const;

function normalizePath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/comfy-prompt')) {
    const stripped = path.slice('/comfy-prompt'.length) || '/';
    return stripped;
  }
  return path;
}

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={className}>
      {NAV_ITEMS.map((item) => {
        const active = normalizePath(pathname) === item.href || normalizePath(pathname).startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ComfyPromptLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AuthGuard requireAuth>
        <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-slate-100">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-slate-950/60 backdrop-blur-md lg:flex">
            <div className="border-b border-white/10 px-4 py-5">
              <div className="flex items-center gap-2">
                <Sparkles className="text-violet-400" size={20} />
                <span className="font-semibold">ComfyUI</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">提示词与远程任务</p>
            </div>
            <div className="flex-1 p-3">
              <NavLinks pathname={pathname} className="flex flex-col gap-1" />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="rounded-lg border border-white/10 p-2 lg:hidden"
                    aria-label="打开导航"
                  >
                    <Menu size={18} />
                  </button>
                  <div className="min-w-0 lg:hidden">
                    <div className="flex items-center gap-2">
                      <Sparkles className="shrink-0 text-violet-400" size={18} />
                      <span className="truncate font-semibold">ComfyUI</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href="/testField"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    返回实验田
                  </Link>
                  <UserMenu />
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-auto px-4 py-6 lg:px-6">{children}</main>
          </div>

          {mobileNavOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                aria-label="关闭导航"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 lg:hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-violet-400" size={20} />
                    <span className="font-semibold">ComfyUI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-lg p-2 hover:bg-white/10"
                    aria-label="关闭"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 p-3">
                  <NavLinks
                    pathname={pathname}
                    onNavigate={() => setMobileNavOpen(false)}
                    className="flex flex-col gap-1"
                  />
                </div>
              </aside>
            </>
          )}
        </div>
      </AuthGuard>
  );
}
