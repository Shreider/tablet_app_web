import type { ReactNode } from 'react';

interface AppLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function AppLayout({ left, right }: AppLayoutProps): JSX.Element {
  return (
    <main className="grid min-h-0 flex-1 gap-4 lg:overflow-hidden [grid-template-columns:minmax(0,4fr)_minmax(290px,1fr)] max-[1160px]:[grid-template-columns:minmax(0,3fr)_minmax(270px,1fr)] max-[900px]:grid-cols-1 max-[900px]:grid-rows-[auto_auto]">
      <section className="min-h-0">{left}</section>
      {right}
    </main>
  );
}
