import { useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { CurrentLecturePanel } from './components/CurrentLecturePanel';
import { HeaderBar } from './components/HeaderBar';
import { LectureDetailsModal } from './components/LectureDetailsModal';
import { ScheduleSidebar } from './components/ScheduleSidebar';
import { mockSchedule, roomMetadata } from './data/mockSchedule';
import type { LectureEvent } from './types/schedule';

export default function App(): JSX.Element {
  const [selectedLecture, setSelectedLecture] = useState<LectureEvent | null>(null);

  const currentLecture = mockSchedule.find((lecture) => lecture.isCurrent) ?? mockSchedule[0];

  return (
    <div className="app-shell">
      <HeaderBar room={roomMetadata.room} building={roomMetadata.building} zone={roomMetadata.zone} />

      <AppLayout
        left={<CurrentLecturePanel lecture={currentLecture} />}
        right={<ScheduleSidebar schedule={mockSchedule} onSelect={setSelectedLecture} />}
      />

      <LectureDetailsModal lecture={selectedLecture} onClose={() => setSelectedLecture(null)} />
    </div>
  );
}
