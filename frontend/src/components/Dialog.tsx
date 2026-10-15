import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  id?: string;
  drawer?: boolean;
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  id,
  drawer = false,
  children
}: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      id={id}
      className={`dialog ${drawer ? 'dialog--drawer' : ''}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog__content">
        <header className="dialog__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={`Zamknij: ${title}`}
            autoFocus
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="dialog__body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}
