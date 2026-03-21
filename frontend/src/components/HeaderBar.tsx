import { ClockDisplay } from './ClockDisplay';

interface HeaderBarProps {
  room: string;
  building: string;
  zone: string;
}

export function HeaderBar({ room, building, zone }: HeaderBarProps): JSX.Element {
  return (
    <header className="flex flex-col gap-3 rounded-panel border border-border bg-surface/90 px-5 py-4 shadow-panel backdrop-blur-sm md:flex-row md:items-center md:justify-between">
      <div>
        <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">Panel sali</p>
        <h1 className="m-0 my-1 text-[clamp(1.35rem,2.1vw,1.9rem)] font-bold text-foreground">Sala {room}</h1>
        <p className="m-0 text-sm text-muted">
          {building} • {zone}
        </p>
      </div>
      <ClockDisplay />
    </header>
  );
}
