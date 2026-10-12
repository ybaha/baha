'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  className?: string;
  listClassName?: string;
  contentClassName?: string;
};

export function Tabs({ items, value, defaultValue, onValueChange, label = 'Views', className, listClassName, contentClassName }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items.find(item => !item.disabled)?.value);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = items.find(item => item.value === (value ?? internalValue) && !item.disabled) ?? items.find(item => !item.disabled);
  const selectedIndex = selected ? items.indexOf(selected) : -1;

  function select(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i >= 0);
    if (!enabled.length) return;
    const position = enabled.indexOf(index);
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = enabled[(position + 1) % enabled.length]; break;
      case 'ArrowLeft': next = enabled[(position + enabled.length - 1) % enabled.length]; break;
      case 'Home': next = enabled[0]; break;
      case 'End': next = enabled[enabled.length - 1]; break;
      default: return;
    }
    event.preventDefault();
    select(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className={cn('space-y-5 font-sans', className)}>
      <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full items-center gap-0.5 rounded-xl bg-foreground/[0.035] p-1 [box-shadow:var(--lt-e1)]', listClassName)}>
        {items.map((item, index) => (
          <button key={item.value} type="button" role="tab" id={`${id}-tab-${index}`} ref={node => { refs.current[index] = node; }} disabled={item.disabled} aria-selected={item === selected} aria-controls={selected ? `${id}-panel` : undefined} tabIndex={item === selected ? 0 : -1} onClick={() => select(item.value)} onKeyDown={event => handleKey(event, index)}
            className={cn('inline-flex items-center rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium leading-tight transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40', item === selected
              ? 'text-foreground/90 [background:var(--lt-sheen-s),linear-gradient(180deg,rgb(var(--color-primary)/0.16),rgb(var(--color-primary)/0.06))] [box-shadow:var(--lt-e1)]'
              : 'text-foreground/50 hover:text-foreground/80')}>
            {item.label}
          </button>
        ))}
      </div>
      {selected && <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selectedIndex}`} tabIndex={0} className={cn('min-w-0', contentClassName)}>{selected.content}</div>}
    </div>
  );
}
