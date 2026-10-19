import { useId, type MouseEvent, type ReactNode } from 'react';
import { AdminDialog } from './AdminDialog';

export function AdminPanel({
  title,
  subtitle,
  actions,
  children
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  const titleId = useId();
  return (
    <section className="admin-surface" aria-labelledby={titleId}>
      <header className="admin-panel-header">
        <div>
          <h2 id={titleId} className="admin-panel-title">
            {title}
          </h2>
          {subtitle ? <p className="admin-panel-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function LoadingBlock({ message }: { message: string }): JSX.Element {
  return (
    <div className="admin-centered-block" role="status">
      <div className="admin-spinner" aria-hidden="true" />
      <p className="m-0 text-sm text-[#a6bbdb]">{message}</p>
    </div>
  );
}

export function ErrorBlock({
  title,
  message,
  onRetry
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <div className="admin-centered-block admin-state-error" role="alert">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      <p className="m-0 text-sm">{message}</p>
      {onRetry ? (
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onRetry}>
          Spróbuj ponownie
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ message }: { message: string }): JSX.Element {
  return (
    <div className="admin-centered-block admin-state-empty" role="status">
      <p className="m-0 text-sm">{message}</p>
    </div>
  );
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
}): JSX.Element {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-sm text-[#a6bbdb]">
        Strona {page} / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Poprzednia
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Następna
        </button>
      </div>
    </div>
  );
}

export function StatusBadge({
  tone,
  children
}: {
  tone: 'ok' | 'warn' | 'critical' | 'info';
  children: ReactNode;
}): JSX.Element {
  const className =
    tone === 'ok'
      ? 'admin-badge admin-badge-ok'
      : tone === 'warn'
        ? 'admin-badge admin-badge-warn'
        : tone === 'critical'
          ? 'admin-badge admin-badge-critical'
          : 'admin-badge admin-badge-info';

  return <span className={className}>{children}</span>;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
  destructive = false,
  busy = false,
  hideCancel = false,
  confirmDisabled = false,
  children
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  busy?: boolean;
  hideCancel?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
}): JSX.Element | null {
  return (
    <AdminDialog
      open={open}
      title={title}
      subtitle={message}
      onClose={onCancel}
      busy={busy}
      footer={
        <>
          {!hideCancel && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelLabel ?? 'Anuluj'}
            </button>
          )}
          <button
            type="button"
            className={destructive ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-primary'}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {busy ? 'Trwa…' : confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </AdminDialog>
  );
}

// Kalendarz / wybór godziny otwiera się po kliknięciu w dowolne miejsce pola, nie tylko w ikonę.
export function openNativePicker(event: MouseEvent<HTMLInputElement>): void {
  try {
    event.currentTarget.showPicker();
  } catch {
    // Przeglądarka bez showPicker() — zostaje domyślne zachowanie.
  }
}

export const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleDateString('pl-PL')} ${date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

export const formatDate = (value: string): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('pl-PL');
};
