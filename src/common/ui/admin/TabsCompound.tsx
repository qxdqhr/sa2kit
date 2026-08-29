'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { cn } from '../../utils';

type TabsCtx = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsCtx | null>(null);

function useTabsCtx() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components require <Tabs>');
  return ctx;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const current = value ?? internal;
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  const ctx = useMemo(() => ({ value: current, setValue }), [current]);
  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn('sa2-tabs-panel', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn('sa2-tabs-list flex flex-wrap gap-1', className)}
      {...rest}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: active, setValue } = useTabsCtx();
  const isActive = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        'sa2-tabs-item px-3 py-2 text-sm',
        isActive && 'sa2-tabs-item-active',
        className,
      )}
      onClick={() => setValue(value)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: active } = useTabsCtx();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn('sa2-tabs-content mt-4', className)} {...rest}>
      {children}
    </div>
  );
}
