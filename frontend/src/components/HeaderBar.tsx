import type { RoomDetails } from '../types/schedule';
import { ClockDisplay } from './ClockDisplay';
import { Icon } from './Icon';
import { ApiSettingsButton } from './ApiSettings';

interface HeaderBarProps {
  room: RoomDetails;
  scheduleCount: number;
  scheduleOpen: boolean;
  onOpenSchedule: () => void;
}

export function HeaderBar({
  room,
  scheduleCount,
  scheduleOpen,
  onOpenSchedule
}: HeaderBarProps): JSX.Element {
  return (
    <header className="app-header">
      <div className="room-heading">
        <p className="eyebrow">Panel sali</p>
        <h1>Sala {room.roomId}</h1>
        <p className="room-location">
          {room.building} · {room.floor}
        </p>
      </div>
      <div className="header-actions">
        <ClockDisplay />
        <ApiSettingsButton />
        <button
          type="button"
          className="button button--primary"
          aria-controls="schedule-panel"
          aria-expanded={scheduleOpen}
          aria-haspopup="dialog"
          onClick={onOpenSchedule}
        >
          <Icon name="calendar" />
          <span>Harmonogram</span>
          <span className="button-count">{scheduleCount}</span>
        </button>
      </div>
    </header>
  );
}
