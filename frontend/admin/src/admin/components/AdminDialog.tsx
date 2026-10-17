import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AdminIcon } from './AdminIcon';

interface AdminDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  busy?: boolean;
  drawer?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

export function AdminDialog({
  open,
  title,
  subtitle,
  onClose,
  busy = false,
  drawer = false,
  children,
  footer
}: AdminDialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`admin-dialog${drawer ? ' admin-dialog--drawer' : ''}`}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      aria-busy={busy || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-dialog-content">
        <header className="admin-dialog-header">
          <div>
            <h2 id={titleId} className="admin-modal-title">
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className="admin-modal-text">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="admin-icon-btn"
            aria-label={`Zamknij: ${title}`}
            onClick={onClose}
            disabled={busy}
            autoFocus
          >
            <AdminIcon name="close" />
          </button>
        </header>
        <div className="admin-dialog-body">{open ? children : null}</div>
        {footer && <footer className="admin-dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
