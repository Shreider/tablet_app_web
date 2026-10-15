import { useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { LectureNavigator } from './components/LectureNavigator';
import { HeaderBar } from './components/HeaderBar';
import { LectureDetailsModal } from './components/LectureDetailsModal';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import type { LectureEvent } from './types/schedule';

interface AppProps {
  room: {
    roomId: string;
    building: string;
    floor: string;
  };
  schedule: LectureEvent[];
  currentLecture: LectureEvent | null;
}

export default function App({ room, schedule, currentLecture }: AppProps): JSX.Element {
  const [selectedLecture, setSelectedLecture] = useState<LectureEvent | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-4 overflow-hidden p-3 sm:p-5 lg:p-[1.1rem]">
      <HeaderBar
        room={room.roomId}
        building={room.building}
        zone={room.floor}
        scheduleCount={schedule.length}
        isScheduleOpen={isScheduleOpen}
        onOpenSchedule={() => setIsScheduleOpen(true)}
      />

      <AppLayout>
        <LectureNavigator
          schedule={schedule}
          currentLecture={currentLecture}
          disabled={isScheduleOpen || selectedLecture !== null}
        />
      </AppLayout>

      <ScheduleSidebar
        schedule={schedule}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSelect={(lecture) => {
          setIsScheduleOpen(false);
          setSelectedLecture(lecture);
        }}
      />

      <LectureDetailsModal lecture={selectedLecture} onClose={() => setSelectedLecture(null)} />
    </div>
  );
}
