import { ClockDisplay } from './ClockDisplay';

interface HeaderBarProps {
  room: string;
  building: string;
  zone: string;
}

export function HeaderBar({ room, building, zone }: HeaderBarProps): JSX.Element {
  return (
    <header className="header-bar">
      <div>
        <p className="header-label">Panel sali</p>
        <h1 className="header-title">Sala {room}</h1>
        <p className="header-meta">
          {building} • {zone}
        </p>
      </div>
      <ClockDisplay />
    </header>
  );
}
