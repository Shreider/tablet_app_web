export const mockSchedule = [
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
    description: 'Projektowanie schematu relacyjnego i normalizacja tabel.',
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
    description: 'Komponentowy podział interfejsu, zarządzanie stanem.',
    status: 'upcoming',
    isCurrent: false
  }
];
