import { Icon } from './Icon';

interface PageStateProps {
  title: string;
  message: string;
  loading?: boolean;
  onRetry?: () => void;
}

export function PageState({ title, message, loading, onRetry }: PageStateProps): JSX.Element {
  return (
    <main className="state-page">
      <section className="state-card" role={loading ? 'status' : 'alert'}>
        <div className={`state-icon ${loading ? 'is-spinning' : ''}`}>
          <Icon name={loading ? 'refresh' : 'info'} size={28} />
        </div>
        <p className="eyebrow">Plan sali</p>
        <h1>{title}</h1>
        <p>{message}</p>
        {!loading && onRetry && (
          <div className="state-actions">
            <button type="button" className="button button--primary" onClick={onRetry}>
              Spróbuj ponownie
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
