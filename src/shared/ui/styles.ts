export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type BadgeTone = 'neutral' | 'new' | 'review' | 'error' | 'success' | 'warning'
export type CardTone = 'default' | 'new' | 'review' | 'error'

export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]'

export const buttonBase =
  'inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none'

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-action)] text-[var(--color-action-text)] hover:bg-[var(--color-action-hover)]',
  secondary:
    'border border-[var(--color-border-strong)] bg-[var(--color-panel)] text-[var(--color-text)] hover:bg-[var(--color-panel-raised)]',
  ghost:
    'text-[var(--color-text-muted)] hover:bg-[var(--color-panel-raised)] hover:text-[var(--color-text)]',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-strong)]',
}

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export const iconButtonSizes: Record<ButtonSize, string> = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-11',
}

export const cardBase =
  'rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-panel)]'

export const cardTones: Record<CardTone, string> = {
  default: '',
  new: 'border-[var(--color-new-border)] bg-[var(--color-new-surface)]',
  review: 'border-[var(--color-review-border)] bg-[var(--color-review-surface)]',
  error: 'border-[var(--color-error-border)] bg-[var(--color-error-surface)]',
}

export const badgeTones: Record<BadgeTone, string> = {
  neutral:
    'border-[var(--color-border)] bg-[var(--color-panel-raised)] text-[var(--color-text-muted)]',
  new: 'border-[var(--color-new-border)] bg-[var(--color-new-surface)] text-[var(--color-new-text)]',
  review:
    'border-[var(--color-review-border)] bg-[var(--color-review-surface)] text-[var(--color-review-text)]',
  error:
    'border-[var(--color-error-border)] bg-[var(--color-error-surface)] text-[var(--color-error-text)]',
  success:
    'border-[var(--color-success-border)] bg-[var(--color-success-surface)] text-[var(--color-success-text)]',
  warning:
    'border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] text-[var(--color-warning-text)]',
}

export const floatingPanel =
  'z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-2 shadow-xl shadow-black/10'

export const fieldBase =
  'h-10 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]'
