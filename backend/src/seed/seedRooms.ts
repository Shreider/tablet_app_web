export interface RoomSeedEntry {
  title: string;
  lecturer: string;
  groupName: string;
  classType: string;
  startTime: string;
  endTime: string;
  description: string;
  note?: string;
  fieldOfStudy?: string;
  subjectCode?: string;
}

export interface RoomSeed {
  roomCode: string;
  displayName: string;
  building: string;
  floorLabel: string;
  entries: RoomSeedEntry[];
}

export const roomSeeds: RoomSeed[] = [
  {
    roomCode: '30',
    displayName: 'Sala 30',
    building: 'Budynek A',
    floorLabel: 'Parter',
    entries: [
      {
        title: 'Systemy operacyjne',
        lecturer: 'dr inż. Anna Kowalska',
        groupName: 'Informatyka sem. 4, grupa 2',
        classType: 'Wykład',
        startTime: '08:00',
        endTime: '09:30',
        description: 'Planowanie procesów i synchronizacja wątków.',
        note: 'Przygotuj notatki z poprzednich zajęć.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-SO-204'
      },
      {
        title: 'Bazy danych',
        lecturer: 'mgr Piotr Nowak',
        groupName: 'Informatyka sem. 4, grupa 2',
        classType: 'Laboratorium',
        startTime: '09:45',
        endTime: '11:15',
        description: 'Projektowanie tabel i kluczy obcych.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-BD-212'
      },
      {
        title: 'Aplikacje webowe',
        lecturer: 'dr Ewa Wiśniewska',
        groupName: 'Informatyka sem. 4, grupa 2',
        classType: 'Ćwiczenia',
        startTime: '12:00',
        endTime: '13:30',
        description: 'Projektowanie komponentów frontendowych.',
        note: 'Oddanie mini-projektu do 13:00.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-WEB-220'
      },
      {
        title: 'Sieci komputerowe',
        lecturer: 'dr Tomasz Zieliński',
        groupName: 'Informatyka sem. 4, grupa 2',
        classType: 'Wykład',
        startTime: '14:00',
        endTime: '15:30',
        description: 'Routing i podstawy diagnostyki ruchu.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-SK-223'
      },
      {
        title: 'Bezpieczeństwo systemów IT',
        lecturer: 'dr inż. Rafał Maj',
        groupName: 'Informatyka sem. 4, grupa 2',
        classType: 'Seminarium',
        startTime: '16:00',
        endTime: '17:30',
        description: 'Analiza zagrożeń i planowanie testów bezpieczeństwa.',
        fieldOfStudy: 'Cyberbezpieczeństwo',
        subjectCode: 'CYB-BSI-301'
      }
    ]
  },
  {
    roomCode: '31',
    displayName: 'Sala 31',
    building: 'Budynek A',
    floorLabel: 'Parter',
    entries: [
      {
        title: 'Matematyka dyskretna',
        lecturer: 'dr Alicja Brzezińska',
        groupName: 'Informatyka sem. 2, grupa 1',
        classType: 'Wykład',
        startTime: '07:45',
        endTime: '09:15',
        description: 'Relacje, grafy i kombinatoryka.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-MD-102'
      },
      {
        title: 'Algorytmy i struktury danych',
        lecturer: 'mgr inż. Karol Bania',
        groupName: 'Informatyka sem. 2, grupa 1',
        classType: 'Laboratorium',
        startTime: '09:30',
        endTime: '11:00',
        description: 'Drzewa, kopce i analiza złożoności.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-AISD-108'
      },
      {
        title: 'Architektura komputerów',
        lecturer: 'dr Paweł Król',
        groupName: 'Informatyka sem. 2, grupa 1',
        classType: 'Ćwiczenia',
        startTime: '11:30',
        endTime: '13:00',
        description: 'Pamięć cache, potok rozkazów i ISA.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-AK-111'
      },
      {
        title: 'Programowanie obiektowe',
        lecturer: 'mgr Joanna Wróbel',
        groupName: 'Informatyka sem. 2, grupa 1',
        classType: 'Laboratorium',
        startTime: '13:30',
        endTime: '15:00',
        description: 'Dziedziczenie, polimorfizm i testy jednostkowe.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-PO-115'
      },
      {
        title: 'Analiza wymagań',
        lecturer: 'dr Katarzyna Sobczak',
        groupName: 'Informatyka sem. 2, grupa 1',
        classType: 'Projekt',
        startTime: '15:30',
        endTime: '17:00',
        description: 'User stories i modelowanie przypadków użycia.',
        note: 'Spotkanie projektowe z klientem o 16:20.',
        fieldOfStudy: 'Informatyka',
        subjectCode: 'INF-AW-118'
      }
    ]
  },
  {
    roomCode: '101',
    displayName: 'Sala 101',
    building: 'Budynek B',
    floorLabel: '1 piętro',
    entries: [
      {
        title: 'Podstawy elektroniki',
        lecturer: 'dr inż. Filip Mróz',
        groupName: 'Automatyka sem. 3, grupa A',
        classType: 'Wykład',
        startTime: '08:15',
        endTime: '09:45',
        description: 'Elementy pasywne i aktywne w układach analogowych.',
        fieldOfStudy: 'Automatyka',
        subjectCode: 'AUT-EL-203'
      },
      {
        title: 'Mikrokontrolery',
        lecturer: 'mgr inż. Natalia Czarnecka',
        groupName: 'Automatyka sem. 3, grupa A',
        classType: 'Laboratorium',
        startTime: '10:00',
        endTime: '11:30',
        description: 'Obsługa peryferiów i komunikacja UART.',
        fieldOfStudy: 'Automatyka',
        subjectCode: 'AUT-MCU-209'
      },
      {
        title: 'Systemy wbudowane',
        lecturer: 'dr inż. Marek Piątek',
        groupName: 'Automatyka sem. 3, grupa A',
        classType: 'Ćwiczenia',
        startTime: '12:00',
        endTime: '13:30',
        description: 'Projektowanie sterowników czasu rzeczywistego.',
        fieldOfStudy: 'Automatyka',
        subjectCode: 'AUT-SW-215'
      },
      {
        title: 'Automatyka przemysłowa',
        lecturer: 'dr Joanna Chojnacka',
        groupName: 'Automatyka sem. 3, grupa A',
        classType: 'Wykład',
        startTime: '14:00',
        endTime: '15:30',
        description: 'Regulatory PID i diagnostyka linii produkcyjnej.',
        fieldOfStudy: 'Automatyka',
        subjectCode: 'AUT-AP-221'
      },
      {
        title: 'Roboty mobilne',
        lecturer: 'mgr inż. Łukasz Kwiecień',
        groupName: 'Automatyka sem. 3, grupa A',
        classType: 'Laboratorium',
        startTime: '16:45',
        endTime: '18:15',
        description: 'Planowanie ruchu i omijanie przeszkód.',
        note: 'Test toru jazdy od 17:30.',
        fieldOfStudy: 'Robotyka',
        subjectCode: 'ROB-RM-304'
      }
    ]
  },
  {
    roomCode: '205',
    displayName: 'Sala 205',
    building: 'Budynek C',
    floorLabel: '2 piętro',
    entries: [
      {
        title: 'Ekonometria',
        lecturer: 'dr Monika Górska',
        groupName: 'Analityka danych sem. 5, grupa 1',
        classType: 'Wykład',
        startTime: '08:00',
        endTime: '09:30',
        description: 'Modele regresji wielorakiej i walidacja założeń.',
        fieldOfStudy: 'Analityka danych',
        subjectCode: 'AND-EK-501'
      },
      {
        title: 'Wizualizacja danych',
        lecturer: 'mgr Tomasz Walczak',
        groupName: 'Analityka danych sem. 5, grupa 1',
        classType: 'Laboratorium',
        startTime: '10:00',
        endTime: '11:30',
        description: 'Dashboardy i storytelling na danych biznesowych.',
        fieldOfStudy: 'Analityka danych',
        subjectCode: 'AND-WD-506'
      },
      {
        title: 'Uczenie maszynowe',
        lecturer: 'dr Sylwia Janas',
        groupName: 'Analityka danych sem. 5, grupa 1',
        classType: 'Ćwiczenia',
        startTime: '12:30',
        endTime: '14:00',
        description: 'Klasyfikacja i ewaluacja modeli predykcyjnych.',
        fieldOfStudy: 'Analityka danych',
        subjectCode: 'AND-ML-512'
      },
      {
        title: 'Przetwarzanie języka naturalnego',
        lecturer: 'dr inż. Jan Wyrwa',
        groupName: 'Analityka danych sem. 5, grupa 1',
        classType: 'Seminarium',
        startTime: '15:00',
        endTime: '16:30',
        description: 'Tokenizacja, embeddingi i klasyfikacja tekstu.',
        fieldOfStudy: 'Analityka danych',
        subjectCode: 'AND-NLP-517'
      },
      {
        title: 'Projekt zespołowy AI',
        lecturer: 'mgr inż. Paulina Sowa',
        groupName: 'Analityka danych sem. 5, grupa 1',
        classType: 'Projekt',
        startTime: '17:30',
        endTime: '19:00',
        description: 'Warsztat planowania sprintu i podział ról.',
        note: 'Przegląd postępu prac o 18:40.',
        fieldOfStudy: 'Sztuczna inteligencja',
        subjectCode: 'AI-PROJ-520'
      }
    ]
  },
  {
    roomCode: 'A12',
    displayName: 'Sala A12',
    building: 'Budynek D',
    floorLabel: 'Parter',
    entries: [
      {
        title: 'Grafika komputerowa',
        lecturer: 'dr inż. Damian Wójcik',
        groupName: 'Multimedia sem. 4, grupa B',
        classType: 'Wykład',
        startTime: '09:00',
        endTime: '10:30',
        description: 'Transformacje 2D/3D i podstawy rasteryzacji.',
        fieldOfStudy: 'Multimedia',
        subjectCode: 'MUL-GK-230'
      },
      {
        title: 'Animacja i motion design',
        lecturer: 'mgr Marta Olejnik',
        groupName: 'Multimedia sem. 4, grupa B',
        classType: 'Laboratorium',
        startTime: '11:00',
        endTime: '12:30',
        description: 'Praca z kluczowymi klatkami i timingiem ruchu.',
        fieldOfStudy: 'Multimedia',
        subjectCode: 'MUL-AM-236'
      },
      {
        title: 'Projektowanie UX',
        lecturer: 'dr Aleksandra Cieślak',
        groupName: 'Multimedia sem. 4, grupa B',
        classType: 'Warsztat',
        startTime: '13:00',
        endTime: '14:30',
        description: 'Architektura informacji i walidacja prototypów.',
        fieldOfStudy: 'Projektowanie UX',
        subjectCode: 'UX-PRO-242'
      },
      {
        title: 'Fotografia cyfrowa',
        lecturer: 'mgr Adam Czerwiński',
        groupName: 'Multimedia sem. 4, grupa B',
        classType: 'Pracownia',
        startTime: '15:00',
        endTime: '16:30',
        description: 'Praca ze światłem studyjnym i obróbka RAW.',
        fieldOfStudy: 'Multimedia',
        subjectCode: 'MUL-FOT-247'
      },
      {
        title: 'Postprodukcja wideo',
        lecturer: 'mgr inż. Elżbieta Roman',
        groupName: 'Multimedia sem. 4, grupa B',
        classType: 'Laboratorium',
        startTime: '17:00',
        endTime: '18:30',
        description: 'Montaż nieliniowy i korekcja kolorystyczna.',
        note: 'Eksport finalnej sekwencji do 18:20.',
        fieldOfStudy: 'Multimedia',
        subjectCode: 'MUL-VID-252'
      }
    ]
  }
];
