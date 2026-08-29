'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

type SelectCtx = {
  value?: string;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  labels: Record<string, ReactNode>;
  registerLabel: (key: string, label: ReactNode) => void;
};

const SelectContext = createContext<SelectCtx | null>(null);

function useSelectCtx() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select compound components require <Select>');
  return ctx;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, ReactNode>>({});
  const current = value ?? internal;
  const setValue = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
    setOpen(false);
  };
  const registerLabel = (key: string, label: ReactNode) => {
    setLabels((prev) => (prev[key] === label ? prev : { ...prev, [key]: label }));
  };
  const ctx = useMemo(
    () => ({ value: current, setValue, open, setOpen, labels, registerLabel }),
    [current, open, labels],
  );
  return (
    <SelectContext.Provider value={ctx}>
      <div className="sa2-select relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelectCtx();
  return (
    <button
      type="button"
      className={cn('sa2-select-trigger w-full', className)}
      onClick={() => setOpen(!open)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { value, labels } = useSelectCtx();
  const display = value ? (labels[value] ?? value) : placeholder;
  return (
    <span className={cn(value ? 'sa2-select-value' : 'sa2-select-placeholder', className)}>
      {display}
    </span>
  );
}

export function SelectContent({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const { open } = useSelectCtx();
  return (
    <div
      className={cn(
        'sa2-select-dropdown absolute z-50 mt-1 w-full rounded-md border bg-white p-1 shadow',
        !open && 'hidden',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { setValue, value: current, registerLabel } = useSelectCtx();
  useEffect(() => {
    registerLabel(value, children);
  }, [value, children, registerLabel]);
  return (
    <button
      type="button"
      role="option"
      aria-selected={current === value}
      className={cn(
        'sa2-select-option block w-full rounded px-3 py-2 text-left text-sm hover:bg-black/5',
        current === value && 'font-semibold',
        className,
      )}
      onClick={() => setValue(value)}
      {...rest}
    >
      {children}
    </button>
  );
}
