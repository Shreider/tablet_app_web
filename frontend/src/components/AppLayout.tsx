import type { ReactNode } from 'react';

interface AppLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function AppLayout({ left, right }: AppLayoutProps): JSX.Element {
  return (
    <main className="content-grid">
      <section className="main-column">{left}</section>
      {right}
    </main>
  );
}
