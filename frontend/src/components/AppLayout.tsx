import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <main className="min-h-0 flex-1">
      {children}
    </main>
  );
}
