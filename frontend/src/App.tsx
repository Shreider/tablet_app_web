import { useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { CurrentLecturePanel } from './components/CurrentLecturePanel';
import { HeaderBar } from './components/HeaderBar';
import { LectureDetailsModal } from './components/LectureDetailsModal';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import type { LectureEvent } from './types/schedule';

interface AppProps {
  room: {
    roomId: string;
    building: string;
    wing: string;
    floor: string;
  };
  schedule: LectureEvent[];
  currentLecture: LectureEvent | null;
}

export default function App({ room, schedule, currentLecture }: AppProps): JSX.Element {
  const [selectedLecture, setSelectedLecture] = useState<LectureEvent | null>(null);

  return (
    <div className="flex min-h-screen flex-col gap-5 p-4 sm:p-5 lg:h-screen lg:overflow-hidden lg:p-[1.1rem]">
      <HeaderBar
        room={room.roomId}
        building={room.building}
        zone={`${room.floor} • ${room.wing}`}
      />

      <AppLayout
        left={<CurrentLecturePanel lecture={currentLecture} />}
        right={<ScheduleSidebar schedule={schedule} onSelect={setSelectedLecture} />}
      />

      <LectureDetailsModal lecture={selectedLecture} onClose={() => setSelectedLecture(null)} />
    </div>
  );
}
