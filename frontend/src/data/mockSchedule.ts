import type { LectureEvent } from '../types/schedule';

export const roomMetadata = {
  room: 'A-204',
  building: 'Budynek A',
  zone: '2 piętro, skrzydło północne'
};

export const mockSchedule: LectureEvent[] = [
  {
    id: 'lec-1',
    title: 'Systemy operacyjne',
    room: 'A-204',
    lecturer: 'dr inż. Anna Kowalska',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Wykład',
    startTime: '08:00',
    endTime: '09:30',
    description:
      'Wprowadzenie do synchronizacji procesów i planowania zadań w systemach wielozadaniowych.',
    note: 'Prosimy o przygotowanie laptopów do części demonstracyjnej.',
    status: 'current',
    isCurrent: true
  },
  {
    id: 'lec-2',
    title: 'Bazy danych',
    room: 'A-204',
    lecturer: 'mgr Piotr Nowak',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Laboratorium',
    startTime: '09:45',
    endTime: '11:15',
    description: 'Projektowanie schematu relacyjnego i normalizacja tabel dla przykładowego systemu uczelnianego.',
    status: 'upcoming',
    isCurrent: false
  },
  {
    id: 'lec-3',
    title: 'Programowanie aplikacji webowych',
    room: 'A-204',
    lecturer: 'dr Ewa Wiśniewska',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Ćwiczenia',
    startTime: '11:30',
    endTime: '13:00',
    description: 'Komponentowy podział interfejsu, zarządzanie stanem i wzorce pracy z danymi po stronie klienta.',
    note: 'Krótki quiz na koniec zajęć.',
    status: 'upcoming',
    isCurrent: false
  },
  {
    id: 'lec-4',
    title: 'Sieci komputerowe',
    room: 'A-204',
    lecturer: 'dr Tomasz Zieliński',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Wykład',
    startTime: '13:15',
    endTime: '14:45',
    description: 'Model TCP/IP, podstawy routingu oraz diagnostyka problemów warstwy sieciowej.',
    status: 'upcoming',
    isCurrent: false
  },
  {
    id: 'lec-5',
    title: 'Inżynieria oprogramowania',
    room: 'A-204',
    lecturer: 'mgr inż. Marta Szymańska',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Seminarium',
    startTime: '15:00',
    endTime: '16:30',
    description: 'Praktyczne przygotowanie backlogu, estymacja zadań i planowanie sprintu dla projektu zespołowego.',
    status: 'upcoming',
    isCurrent: false
  },
  {
    id: 'lec-6',
    title: 'Bezpieczeństwo systemów IT',
    room: 'A-204',
    lecturer: 'dr inż. Rafał Maj',
    group: 'Informatyka, sem. 4, grupa 2',
    type: 'Wykład',
    startTime: '16:45',
    endTime: '18:15',
    description: 'Podstawy modelowania zagrożeń, klasyczne wektory ataku i dobre praktyki zabezpieczania aplikacji.',
    note: 'Po zajęciach konsultacje do godz. 18:30.',
    status: 'upcoming',
    isCurrent: false
  }
];
