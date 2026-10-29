import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

const PATHS = {
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  mountain: 'M2 20l7-12 4 7 3-4 6 9z',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h2',
  bag: 'M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  down: 'M6 9l6 6 6-6',
  up: 'M6 15l6-6 6 6',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  share: 'M12 16V4M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  bed: 'M3 18V6M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  download: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  upload: 'M12 16V5M7 9l5-5 5 5M4 20h16',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  snow: 'M12 2v20M4 6l16 12M20 6L4 18',
  cloud: 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 11a4 4 0 0 1-1 7z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={clsx('shrink-0', className)}>
      <path d={PATHS[name]} />
    </svg>
  )
}

export function Card({ className, children, onClick, tone }: { className?: string; children: ReactNode; onClick?: () => void; tone?: 'warn' | 'bad' | 'good' }) {
  const base = clsx(
    'rounded-2xl border p-4',
    tone === 'warn' ? 'border-warn/40 bg-warn-soft' : tone === 'bad' ? 'border-bad/40 bg-bad-soft' : tone === 'good' ? 'border-good/40 bg-good-soft' : 'border-line bg-surface',
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clsx(base, 'block w-full text-left', className)}>
        {children}
      </button>
    )
  }
  return <div className={clsx(base, className)}>{children}</div>
}

export function Screen({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rise mx-auto w-full max-w-xl px-4 pb-28">
      <header className="safe-top flex items-end justify-between gap-3 pb-3 pt-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {right}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; block?: boolean }

export function Btn({ variant = 'primary', size = 'md', block, className, type = 'button', ...p }: BtnProps) {
  return (
    <button
      type={type}
      {...p}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'min-h-12 px-4 text-base',
        size === 'lg' && 'min-h-14 px-5 text-lg',
        block && 'w-full',
        variant === 'primary' && 'bg-accent text-accent-fg',
        variant === 'soft' && 'bg-surface2 text-ink',
        variant === 'ghost' && 'text-muted hover:text-ink',
        variant === 'danger' && 'bg-bad-soft text-bad',
        className,
      )}
    />
  )
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' | 'bad' | 'good' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone === 'neutral' && 'bg-surface2 text-muted',
        tone === 'accent' && 'bg-accent-soft text-accent',
        tone === 'warn' && 'bg-warn-soft text-warn',
        tone === 'bad' && 'bg-bad-soft text-bad',
        tone === 'good' && 'bg-good-soft text-good',
      )}
    >
      {children}
    </span>
  )
}

export function Banner({ tone = 'warn', icon = 'alert', title, children, action }: { tone?: 'warn' | 'bad' | 'good' | 'accent'; icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={clsx('flex items-start gap-3 rounded-2xl p-4', tone === 'bad' ? 'bg-bad-soft text-bad' : tone === 'good' ? 'bg-good-soft text-good' : tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-warn-soft text-warn')} role={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-sm text-ink/80">{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}

export const inputCls = 'min-h-12 w-full rounded-xl border border-line bg-surface2 px-3 text-base placeholder:text-muted/70 focus:border-accent focus:outline-none'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={clsx('relative h-7 w-12 shrink-0 rounded-full', checked ? 'bg-accent' : 'bg-line')}>
      <span className={clsx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface2 p-1">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)} className={clsx('min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold', o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-muted')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Bar({ value, max, tone = 'accent' }: { value: number; max: number; tone?: 'accent' | 'bad' | 'good' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx('h-full rounded-full transition-all duration-500', tone === 'bad' ? 'bg-bad' : tone === 'good' ? 'bg-good' : 'bg-accent')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  // rendered on <body> so no animated/transformed ancestor can trap it beneath the tab bar
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet-in relative flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-3xl bg-bg shadow-2xl">
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <h2 className="min-w-0 truncate text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-surface2 text-muted">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Confirm({ open, title, body, confirmLabel, danger, onConfirm, onCancel }: { open: boolean; title: string; body?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      {body && <p className="mb-5 text-muted">{body}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Btn variant="soft" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Btn>
      </div>
    </Sheet>
  )
}

/** Short-lived message at the top of the screen. */
let toastSet: ((m: string) => void) | null = null
export const toast = (m: string) => toastSet?.(m)

export function Toaster() {
  const [msgs, setMsgs] = useState<{ id: number; m: string }[]>([])
  useEffect(() => {
    toastSet = (m) => {
      const id = Math.random()
      setMsgs((x) => [...x.slice(-2), { id, m }])
      setTimeout(() => setMsgs((x) => x.filter((y) => y.id !== id)), 2600)
    }
    return () => {
      toastSet = null
    }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 safe-top">
      {msgs.map((t) => (
        <div key={t.id} role="status" className="rise pointer-events-auto max-w-sm rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-lg">
          {t.m}
        </div>
      ))}
    </div>
  )
}
