import type { ReactNode } from 'react';

export function AdminPanel({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="admin-surface">
      <header className="admin-panel-header">
        <div>
          <h2 className="admin-panel-title">{title}</h2>
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
    <div className="admin-centered-block">
      <div className="admin-spinner" aria-hidden="true" />
      <p className="m-0 text-sm text-[#93a6c7]">{message}</p>
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
    <div className="admin-centered-block border border-[#4b2d3a] bg-[#2b1821] text-[#ffc5d4]">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      <p className="m-0 text-sm">{message}</p>
      {onRetry ? (
        <button type="button" className="admin-btn admin-btn-secondary" onClick={onRetry}>
          Sprobuj ponownie
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ message }: { message: string }): JSX.Element {
  return (
    <div className="admin-centered-block border border-dashed border-[#334562] bg-[#111926] text-[#8ca0c4]">
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
      <p className="m-0 text-sm text-[#8ca0c4]">
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
          Nastepna
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
  children?: ReactNode;
}): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}>
      <article
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="admin-modal-title">{title}</h3>
        <p className="admin-modal-text">{message}</p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel ?? 'Anuluj'}
          </button>
          <button
            type="button"
            className={destructive ? 'admin-btn admin-btn-danger' : 'admin-btn admin-btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Trwa...' : confirmLabel}
          </button>
        </div>
      </article>
    </div>
  );
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
