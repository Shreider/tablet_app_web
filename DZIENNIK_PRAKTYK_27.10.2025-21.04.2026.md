# Dziennik praktyk zawodowych (Frontend Developer)

Projekt: Room Tablet Preview  
Zakres: 27.10.2025 - 21.04.2026

Technologie i obszary pracy uwzglednione w dzienniku wynikaja z analizy repozytorium oraz historii commitow: React 18, TypeScript, Vite, Tailwind CSS, React Router, fetch API, panel admina, frontend wyswietlaczy sal, backend REST (Express), PostgreSQL, Prisma, Docker Compose, praca z Git i przegladami zmian.

## Tydzien od 27.10.2025 do 31.10.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpoczalem praktyki od analizy celu projektu oraz scenariuszy uzycia dla ekranow przy salach. Zweryfikowalem, jak powinien wygladac przeplyw danych od harmonogramu do czytelnego widoku dla uzytkownika koncowego. |
| Dzien 2 | Przeprowadzilem przeglad struktury repozytorium i podzialu na warstwy frontend, backend oraz database. Ustalilem, ze prace frontendowe beda rozwijane rownolegle dla widoku sali oraz panelu administracyjnego. |
| Dzien 3 | Opracowalem zalozenia dotyczace ukladu informacji na ekranie sali: naglowek, aktualne zajecia i lista kolejnych wpisow. Skoncentrowalem sie na czytelnosci tresci z wiekszej odleglosci oraz ograniczeniu zbednych elementow wizualnych. |
| Dzien 4 | Przygotowalem plan prac frontendowych z podzialem na komponenty i etapy implementacji. Zdefiniowalem kolejnosc: najpierw widok bazowy i mock danych, a nastepnie integracja z API i dopracowanie UX. |
| Dzien 5 | Skonfigurowalem lokalne srodowisko developerskie i zweryfikowalem uruchamianie projektu w kontenerach. Udokumentowalem podstawowe komendy robocze dla codziennego startu aplikacji i debugowania. |

## Tydzien od 03.11.2025 do 07.11.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpisalem model danych prezentacyjnych dla wydarzen zajeciowych, ktory pozniej zostal odwzorowany w typach TypeScript. Uwzglednilem pola czasu, statusu zajec i metadanych takich jak prowadzacy, grupa i typ zajec. |
| Dzien 2 | Przeanalizowalem format harmonogramu pod katem przyszlej obslugi statusow `current`, `upcoming` i `finished`. Przygotowalem zalozenia do logiki wskazywania aktualnie trwajacych i nastepnych zajec. |
| Dzien 3 | Pracowalem nad koncepcja komponentowego podzialu widoku sali i granic odpowiedzialnosci miedzy elementami UI. Szczegolna uwage poswiecilem separacji warstwy danych od warstwy prezentacji. |
| Dzien 4 | Ocenilem wymagania responsywnosci dla tabletow i mniejszych ekranow awaryjnych. Zaplanowalem zachowanie layoutu dla szerokich paneli oraz wariantu jednokolumnowego. |
| Dzien 5 | Przeprowadzilem przeglad sposobu nawigacji i ustalilem, ze routing powinien obslugiwac identyfikator sali w URL. Uzgodnilem, ze wejscie na strone glowna bedzie przekierowywalo do dostepnej sali. |

## Tydzien od 10.11.2025 do 14.11.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpoczalem implementacje szkieletu frontendu w React + TypeScript z naciskiem na czytelna strukture katalogow. Przygotowalem podzial na `components`, `pages`, `types` oraz warstwe API. |
| Dzien 2 | Zaimplementowalem pierwsza wersje widoku bazujaca na danych testowych, co umozliwilo szybkie iteracje UI bez zaleznosci od backendu. Zweryfikowalem poprawne mapowanie listy zajec do komponentow. |
| Dzien 3 | Dopracowalem interfejsy typow danych, aby uniknac niejednoznacznosci na styku komponentow. Ujednolicilem nazewnictwo pol czasu i opisow zajec w modelu frontendu. |
| Dzien 4 | Przeprowadzilem testy manualne scenariuszy pustego harmonogramu i braku biezacych zajec. Dodalem odpowiednie komunikaty informacyjne, aby ekran zachowywal sie przewidywalnie. |
| Dzien 5 | Pracowalem nad ergonomia odswiezania danych mockowych i uproszczeniem ich utrzymania. Zadbano, aby zespol mogl latwo podmieniac przypadki testowe bez zmian w logice komponentow. |

## Tydzien od 17.11.2025 do 21.11.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozwijalem komponent `HeaderBar` oraz sekcje identyfikacji sali i lokalizacji. Ustawilem hierarchie typografii pod szybki odczyt numeru sali i strefy. |
| Dzien 2 | Zaimplementowalem komponent zegara `ClockDisplay` z automatyczna aktualizacja co sekunde. Zweryfikowalem formatowanie daty i czasu dla lokalizacji `pl-PL`. |
| Dzien 3 | Rozbudowalem `CurrentLecturePanel` o warunki wyswietlania dla braku zajec i aktywnego wpisu. Przygotowalem miejsce na opis, notatke i najwazniejsze metadane zajec. |
| Dzien 4 | Uporzadkowalem uklad `AppLayout`, tak aby glowny panel i lista harmonogramu dzialaly poprawnie w roznych szerokosciach. Sprawdzilem zachowanie przy przejsciu do wariantu jednokolumnowego. |
| Dzien 5 | Przeprowadzilem przeglad dostepnosci kluczowych elementow i etykiet ARIA. Poprawilem semantyke naglowkow oraz czytelnosc kontrolek interaktywnych. |

## Tydzien od 24.11.2025 do 28.11.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Implementowalem boczny panel harmonogramu `ScheduleSidebar` wraz z przewijaniem listy wpisow. Zadbano o czytelny podzial wpisow i szybkie skanowanie osi czasu. |
| Dzien 2 | Rozwijalem komponent `ScheduleItem`, dodajac stany wizualne dla zajec trwajacych i pozostalych wpisow. Zweryfikowalem reakcje przyciskow i style focus dla obslugi klawiatury. |
| Dzien 3 | Przygotowalem modal szczegolow `LectureDetailsModal` otwierany po wyborze wpisu harmonogramu. Dodalem obsluge zamkniecia kliknieciem poza modalem oraz klawiszem Escape. |
| Dzien 4 | Uporzadkowalem przeplyw stanu lokalnego w komponencie glownym `App` dla zaznaczonego wpisu. Ograniczylem przekazywanie danych do niezbednych propsow i uproscilem obieg zdarzen. |
| Dzien 5 | Wykonalem testy manualne interakcji miedzy lista zajec a modalem, w tym przypadki szybkich klikniec. Potwierdzilem stabilnosc renderowania przy zmianie wyboru. |

## Tydzien od 01.12.2025 do 05.12.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpoczalem porzadkowanie warstwy stylow i przygotowanie pod migracje do Tailwind CSS. Zidentyfikowalem powtarzalne klasy i sekcje, ktore powinny zostac znormalizowane. |
| Dzien 2 | Przeanalizowalem spojnosc kolorystyki i kontrastu pod warunki oswietleniowe korytarzy szkolnych. Ustalilem kierunek motywu ciemnoniebieskiego z wyraznymi akcentami statusow. |
| Dzien 3 | Przygotowalem liste komponentow wymagajacych refaktoryzacji stylow po zmianie technologii CSS. Zaplanowalem zachowanie proporcji i odstepow po przejsciu na utility classes. |
| Dzien 4 | Uporzadkowalem strukture plikow styli oraz dokumentacje robocza dla zespolu. Ustalilem zasady nazewnictwa i miejsca przechowywania tokenow wizualnych. |
| Dzien 5 | Przeprowadzilem przeglad zaleznosci frontendowych i gotowosc projektu do rozszerzenia pipeline o PostCSS i Tailwind. Zweryfikowalem, ze build pozostaje stabilny po przygotowaniach. |

## Tydzien od 08.12.2025 do 12.12.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Skonfigurowalem `tailwind.config` i bazowe tokeny kolorow (`background`, `surface`, `primary`, `muted`, `border`). Przenioslem glowny uklad wizualny do `index.css` i warstw Tailwinda. |
| Dzien 2 | Zmigrowalem komponenty naglowka i panelu biezacych zajec na klasy utility, zachowujac dotychczasowa funkcjonalnosc. Sprawdzilem zgodnosc z projektem typografii i cieni. |
| Dzien 3 | Dostosowalem style listy harmonogramu oraz elementow kart zajec do nowej palety. Skorygowalem paddingi i promienie zaokraglen pod ekran dotykowy. |
| Dzien 4 | Wprowadzilem animacje `fade-in` i `pop-in` dla poprawy odbioru modala oraz przejsc. Zweryfikowalem, ze animacje nie pogarszaja czytelnosci i nie obciazaja interfejsu. |
| Dzien 5 | Wykonalem manualna walidacje wygladu na roznych szerokosciach i poprawilem drobne regresje po migracji styli. Zaktualizowalem notatki wdrozeniowe dotyczace nowego systemu CSS. |

## Tydzien od 15.12.2025 do 19.12.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Pracowalem nad poprawa czytelnosci osi czasu i separatorow miedzy wpisami harmonogramu. Wzmocnilem kontrast etykiet godzin oraz odstepy miedzy elementami. |
| Dzien 2 | Usprawnilem zachowanie panelu bocznego przez dopracowanie przewijania pionowego i wysokosci sekcji. Przetestowalem scenariusze z dlugim harmonogramem zajec. |
| Dzien 3 | Skorygowalem style kart zajec, aby informacje o prowadzacym i grupie byly stabilne przy dlugich nazwach. Wprowadzilem bezpieczne lamanie tekstu i ograniczylem ryzyko overflow. |
| Dzien 4 | Dopracowalem komunikaty o braku danych i fallbacki wizualne, aby ekran nie wygladal na uszkodzony przy pustej liscie. Ujednolicilem ton komunikatow informacyjnych. |
| Dzien 5 | Zweryfikowalem zachowanie komponentow po serii zmian i przygotowalem liste korekt do kolejnego sprintu. Celem bylo utrzymanie spojnosc UI bez regresji funkcjonalnych. |

## Tydzien od 22.12.2025 do 26.12.2025

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Skupilem sie na testach interfejsu w warunkach zblizonych do docelowych ekranow tabletowych. Sprawdzilem czytelnosc tresci z wiekszej odleglosci i stabilnosc layoutu. |
| Dzien 2 | Przeanalizowalem obciazenie poznawcze widoku i usunalem elementy o niskiej wartosci informacyjnej. Zachowalem tylko dane kluczowe dla szybkiej orientacji przed sala. |
| Dzien 3 | Dopracowalem wielkosci fontow i skale naglowkow w sekcjach krytycznych. Poprawilem rowniez proporcje sekcji bocznej wzgledem panelu glwnego. |
| Dzien 4 | Wykonalem debugowanie zachowania modala i fokusowania elementow po jego zamknieciu. Doprecyzowalem obsluge zdarzen klawiaturowych w celu poprawy ergonomii. |
| Dzien 5 | Podsumowalem wykonane zmiany UI i przygotowalem plan integracji z warstwa API. Zidentyfikowalem obszary wymagajace zmian w modelu danych po odejsciu od mockow. |

## Tydzien od 29.12.2025 do 02.01.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpoczalem przygotowanie kontraktow danych dla komunikacji z backendem REST. Ujednolicilem typy odpowiedzi dla listy sal, harmonogramu globalnego i widoku pojedynczej sali. |
| Dzien 2 | Opracowalem zalozenia obslugi bledow HTTP i mapowania komunikatow backendowych na warstwe UI. Przygotowalem podejscie oparte na klasach bledow aplikacyjnych. |
| Dzien 3 | Przeanalizowalem scenariusze przejsciowe: brak sal, brak harmonogramu, bledna sala i problem polaczenia. Dostosowalem architekture stron tak, aby obslugiwaly te przypadki bez awarii. |
| Dzien 4 | Zaplanowalem routing z przekierowaniem ze strony glownej do pierwszej dostepnej sali. Zwrciem uwage na bezpieczne kodowanie `roomId` w adresie URL. |
| Dzien 5 | Zweryfikowalem przygotowanie projektu do integracji backendowej i odnotowalem konieczne zmiany w komponencie strony glownej. Ustalilem kolejnosc wdrazania endpointow po stronie frontendu. |

## Tydzien od 05.01.2026 do 09.01.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozwijalem warstwe API frontendu (`roomApi`) z funkcjami pobierania sali, listy sal i harmonogramu. Dodalem wspolny parser odpowiedzi JSON oraz obsluge kodow bledow. |
| Dzien 2 | Zaimplementowalem klase `ApiError` i przenioslem logike formatowania komunikatow do jednego miejsca. Uproscilo to obsluge bledow w komponentach stron. |
| Dzien 3 | Ustawilem bazowy adres API przez `VITE_API_BASE_URL` z domyslnym `/api`, aby zachowac zgodnosc z proxy Vite. Przygotowalem projekt pod uruchomienie lokalne i kontenerowe bez zmian kodu. |
| Dzien 4 | Dodalem mozliwosc przekazywania `AbortSignal` do zapytan `fetch`, by unikac race condition po zmianie widoku. Przetestowalem scenariusz szybkiego przechodzenia miedzy trasami. |
| Dzien 5 | Wykonalem debugowanie odpowiedzi backendowych i dopasowalem typy `RoomScheduleResponse`, `RoomsResponse` oraz `ScheduleResponse`. Potwierdzilem poprawny przeplyw danych od API do UI. |

## Tydzien od 12.01.2026 do 16.01.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Przebudowalem `RoomPage` tak, aby pobierala dane dynamicznie z API i obslugiwala stany `loading`, `error` oraz `success`. Wprowadzilem komponent informacyjny dla przypadkow 404 i bledow polaczenia. |
| Dzien 2 | Zaimplementowalem logike wyboru wpisu priorytetowego (`currentLecture` lub `nextLecture`) po odebraniu danych z backendu. Zapewnilo to stabilne dzialanie panelu glwnego niezaleznie od kompletnoci odpowiedzi. |
| Dzien 3 | Przenioslem strone glowna na mechanizm automatycznego przekierowania do pierwszej sali przez `fetchRooms`. Dodalem obsluge sytuacji, gdy baza nie zwraca zadnych sal. |
| Dzien 4 | Dopracowalem komunikaty statusowe i ich tresc techniczna, aby byly jednoznaczne dla uzytkownika i zespolu wsparcia. Zweryfikowalem zachowanie po blednym `roomId` oraz braku backendu. |
| Dzien 5 | Przeprowadzilem testy regresji komponentow po odejsciu od danych mockowych. Potwierdzilem, ze modal szczegolow i panel harmonogramu poprawnie dzialaja na danych z API. |

## Tydzien od 19.01.2026 do 23.01.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Skonfigurowalem i zweryfikowalem proxy Vite (`/api` -> backend) dla aplikacji frontendowej. Ujednolicilem podejscie uruchamiania w `dev` bez twardego wpisywania adresu hosta backendu. |
| Dzien 2 | Dopracowalem routing React Router (`/`, `/room/:roomId`, fallback `*`) i sprawdzilem przekierowania w przypadkach granicznych. Usunalem niejednoznacznosci dotyczace startowej trasy aplikacji. |
| Dzien 3 | Wykonalem optymalizacje drobnych elementow renderowania i porzadki w strukturze komponentow. Skupilem sie na ograniczeniu zbednych re-renderow i czystym przeplywie propsow. |
| Dzien 4 | Przeprowadzilem testy wydajnosciowe manualne na dluzszych listach harmonogramu i ocenilem plynno przewijania. Wprowadzilem korekty stylow przewijania oraz odstpow w kartach. |
| Dzien 5 | Uporzadkowalem dokumentacje developerska dotyczaca uruchamiania i integracji frontend-backend. Przygotowalem notatki pod przejscie do pelnej architektury z baza PostgreSQL. |

## Tydzien od 26.01.2026 do 30.01.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Wspieralem przygotowanie projektu do pracy z realna baza danych, zachowujac kompatybilnosc warstwy frontendu. Zweryfikowalem, ze modele danych po stronie UI sa gotowe na zrodlo PostgreSQL. |
| Dzien 2 | Przeanalizowalem endpointy backendowe i ich zachowanie przy filtrach daty oraz identyfikatorze sali. Dostosowalem frontendowe zalozenia do walidacji formatu `YYYY-MM-DD`. |
| Dzien 3 | Rozszerzylem testy manualne scenariuszy bledow sieciowych i timeoutow w zapytaniach. Potwierdzilem prawidlowe zwalnianie zapytan przez `AbortController` przy zmianie widokow. |
| Dzien 4 | Zweryfikowalem zgodnosc mapowania statusu zajec z logika backendowa oparta na czasie i strefie `Europe/Warsaw`. Doprecyzowalem prezentacje przypadku przejscia miedzy lekcjami. |
| Dzien 5 | Przygotowalem backlog zmian dla panelu administracyjnego, ktory mial zostac oddzielony do osobnej aplikacji. Ustalilem priorytety: auth, dashboard, sale i harmonogram. |

## Tydzien od 02.02.2026 do 06.02.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Opracowalem wstepna architekture panelu admina jako niezaleznego frontendu React + Vite + TypeScript. Zdefiniowalem podstawowy podzial na `api`, `auth`, `components`, `pages` i `config`. |
| Dzien 2 | Zaplanowalem system tras admina z obszarami logowania, dashboardu, sal i harmonogramu. Przygotowalem koncepcje ochrony tras oraz wspolnego layoutu z `Outlet`. |
| Dzien 3 | Przeanalizowalem wymagania funkcjonalne modulu sal: filtrowanie, sortowanie, paginacja, szczegoly i usuwanie. Opracowalem strukture formularza create/edit i walidacji po stronie UI. |
| Dzien 4 | Rozpisalem wymagania modulu harmonogramu, w tym relacje do sal, prowadzacych, grup, typow zajec i przedmiotow. Ustalilem zakres filtrow i pola formularza zgodnie z kontraktem API. |
| Dzien 5 | Przygotowalem zalozenia warstwy wspolnych komponentow admina (panele, stany ladowania, modale, paginacja, odznaki statusu). Celem bylo ograniczenie duplikacji kodu w widokach. |

## Tydzien od 09.02.2026 do 13.02.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Skonfigurowalem wizualna baze panelu admina w Tailwind i dopracowalem globalne klasy komponentowe w `index.css`. Zadbano o spojnosc typografii i kontrast pod dluzsza prace operacyjna. |
| Dzien 2 | Przygotowalem `AdminLayout` z nawigacja boczna, topbarem i miejscem na akcje kontekstowe. Dodalem obsluge wariantu mobilnego z otwieraniem i zamykaniem menu. |
| Dzien 3 | Zaimplementowalem wspolne komponenty `AdminUi` dla loadingu, bledow, pustych stanow i potwierdzen operacji. Skrocilo to czas implementacji kolejnych stron administracyjnych. |
| Dzien 4 | Pracowalem nad nawigacja i grupowaniem sekcji tak, aby latwo przechodzic miedzy obszarami danych. Uporzadkowalem nazwy menu pod realne operacje wykonywane przez administratora. |
| Dzien 5 | Wykonalem testy responsywnosci panelu admina i poprawilem zachowanie elementow przy mniejszych szerokosciach. Potwierdzilem stabilnosc tabel z poziomym przewijaniem. |

## Tydzien od 16.02.2026 do 20.02.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozwijalem warstwe autoryzacji admina z kontekstem `AdminAuthContext` i stanem sesji. Dodalem przechowywanie tokenu w `sessionStorage` oraz odtwarzanie sesji po odswiezeniu strony. |
| Dzien 2 | Zaimplementowalem walidacje sesji przez endpoint `/api/admin/auth/session` i obsluge wygaszania niepoprawnego tokenu. Uporzadkowalem scenariusz wylogowania i czyszczenia stanu. |
| Dzien 3 | Dodalem `AdminProtectedRoute`, aby zabezpieczyc trasy wymagajace autoryzacji. Zweryfikowalem przekierowanie na `/login` przy braku prawidlowego tokenu. |
| Dzien 4 | Rozbudowalem formularz logowania administratora i obsluge komunikatow bledow `401`. Uspojnilem walidacje danych wejsciowych i komunikaty zwrotne dla uzytkownika. |
| Dzien 5 | Przeprowadzilem manualny test przeplywu logowanie -> sekcje admina -> wylogowanie -> ponowne logowanie. Potwierdzilem poprawna wspolprace tras, kontekstu auth i naglowkow `Authorization`. |

## Tydzien od 23.02.2026 do 27.02.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Przygotowalem klienta API panelu admina (`adminApi.ts`) oparty o natywny `fetch` i centralna obsluge bledow. Ustalilem wzorzec budowania naglowkow `Bearer` dla wszystkich zapytan chronionych. |
| Dzien 2 | Zaimplementowalem metody dla dashboardu i widokow list, z zachowaniem spjnego parsowania odpowiedzi. Ujednolicilem sposob tworzenia query stringow dla filtrow i paginacji. |
| Dzien 3 | Dodalem typowanie odpowiedzi API dla modulow administracyjnych, aby zminimalizowac ryzyko bledow runtime. Zweryfikowalem zgodnosc typow z aktualnymi kontrolerami backendu. |
| Dzien 4 | Wykonalem testy bledow transportowych i walidacyjnych, sprawdzajac zachowanie komponentow przy odpowiedziach 4xx/5xx. Dopracowalem obsluge `AdminApiError` w stronach panelu. |
| Dzien 5 | Przeprowadzilem code review warstwy API i uproscilem miejsca, gdzie logika byla powielona. Przygotowalem refaktoryzacje pod kolejne modulow CRUD. |

## Tydzien od 02.03.2026 do 06.03.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozpoczalem implementacje strony dashboardu administratora z kartami metryk i szybkim przejsciem do sekcji danych. Oparlem widok o endpoint `/api/admin/dashboard` i gotowe komponenty UI. |
| Dzien 2 | Dodalem tabele ostatnio modyfikowanych sal oraz ostatnio dodanych wpisow harmonogramu. Zweryfikowalem mapowanie dat i formatowanie znacznikow czasowych. |
| Dzien 3 | Zaimplementowalem prezentacje ostrzezen integralnosci danych, np. brak wpisow dla sal i nakladajace sie terminy. Wykorzystalem odznaki statusow do szybkiej identyfikacji problemu. |
| Dzien 4 | Dopracowalem logike ponownego ladowania dashboardu i obsluge bledow z przyciskiem retry. Sprawdzilem zachowanie widoku przy opoznionych odpowiedziach API. |
| Dzien 5 | Przeprowadzilem walidacje ergonomii dashboardu pod katem codziennych zadan administratora. Skorygowalem kolejnosc informacji i etykiety szybkich akcji. |

## Tydzien od 09.03.2026 do 13.03.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozwijalem modulu `AdminRoomsPage` z tabela danych, filtrami i sortowaniem po polach domenowych. Dodalem obsluge paginacji i licznik lacznej liczby rekordow. |
| Dzien 2 | Zaimplementowalem formularze create/edit sal wraz z walidacja kodu sali i relacji lokalizacyjnych. Zapewnilem odswiezanie danych po zapisie bez koniecznosci recznego reloadu strony. |
| Dzien 3 | Dodalem modal szczegolow sali z lista ostatnich powiazanych wpisow harmonogramu. Ulatwilo to szybka kontrole skutkow zmian wykonywanych w panelu. |
| Dzien 4 | Wdrozylem obsluge usuwania sali z wariantem kaskadowym i reakcja na konflikt `409` z API. Dopracowalem komunikaty ostrzegawcze przed operacjami destrukcyjnymi. |
| Dzien 5 | Wykonalem testy manualne calego cyklu CRUD dla sal i zweryfikowalem poprawne dzialanie filtrow zaleznych od budynku/skrzydla. Wnioski z testow przekazalem do dalszych poprawek UX. |

## Tydzien od 16.03.2026 do 20.03.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozwijalem modulu `AdminScheduleEntriesPage` z tabela wpisow, filtrowaniem wielokryterialnym i sortowaniem. Skonfigurowalem zapytania z parametrami dat, sali, prowadzacego i przedmiotu. |
| Dzien 2 | Zaimplementowalem formularz dodawania i edycji wpisow zajeciowych z walidacja czasu rozpoczecia i zakonczenia. Dostosowalem pola do relacyjnego modelu danych backendu. |
| Dzien 3 | Dodalem widok szczegolow wpisu harmonogramu oraz mechanizm usuwania z potwierdzeniem. Ujednolicilem obsluge flash messages po operacjach zapisu i usuniecia. |
| Dzien 4 | Przeprowadzilem testy scenariuszy granicznych, m.in. niepoprawny zakres czasu i brak wymaganych relacji. Zweryfikowalem, ze bledy API sa czytelnie prezentowane w formularzu. |
| Dzien 5 | Usprawnilem uklad formularzy i filtrow pod responsywnosc na mniejszych ekranach. Skorygowalem siatki i rozmieszczenie kontrolek dla wygodniejszej obslugi. |

## Tydzien od 23.03.2026 do 27.03.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | W tym tygodniu skoncentrowalem sie na integracji frontendu z backendem opartym o baze PostgreSQL i nowe endpointy. Przeprowadzilem aktualizacje warstwy danych po zmianach z historii commitow z 23.03. |
| Dzien 2 | Zweryfikowalem migracje od danych mockowych do rzeczywistych odpowiedzi API w widoku sali i panelu admina. Dostosowalem mapowanie struktur odpowiedzi oraz komunikaty bledow. |
| Dzien 3 | Sprawdzilem konfiguracje `docker-compose`, portow i proxy Vite, aby oba frontendy poprawnie laczyly sie z backendem. Potwierdzilem dzialanie scenariusza startowego i seedowania danych. |
| Dzien 4 | Wykonalem przeglad zmian lockfile i zaleznosci po aktualizacjach projektu. Upewnilem sie, ze build frontendu przechodzi stabilnie po synchronizacji pakietow. |
| Dzien 5 | Przeprowadzilem przeglad PR-ow i mergey dotyczacych czytelnosci harmonogramu oraz motywu UI. Na tej podstawie dopracowalem finalne detale wizualne dla ekranu sali. |

## Tydzien od 30.03.2026 do 03.04.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Rozszerzylem panel admina o obsluge slownikow relacyjnych po refaktorze domenowym (`buildings`, `wings`, `floors`, `lecturers`, `subjects` itd.). Przygotowalem fundament pod centralny widok katalogow. |
| Dzien 2 | Zaimplementowalem logike pobierania calego datasetu referencyjnego i jego edycji z poziomu jednego modulu. Ujednolicilem walidacje payloadow zaleznie od wybranego typu encji. |
| Dzien 3 | Dodalem mechanizm sprawdzania zaleznosci przed usunieciem rekordu referencyjnego i bezpieczne blokowanie operacji. Podpialem prezentacje zaleznosci do modala potwierdzenia. |
| Dzien 4 | Dostosowalem routing admina do nowej struktury tras katalogowych (`/locations/:entity`, `/teaching/:entity`). Ulatwilo to poruszanie sie po danych domenowych bez przechodzenia miedzy roznymi stronami. |
| Dzien 5 | Zweryfikowalem kompatybilnosc zmian frontendu z nowymi migracjami Prisma i API backendu po duzym refaktorze z 29.03. Przygotowalem poprawki porzadkujace typy i nazwy pol. |

## Tydzien od 06.04.2026 do 10.04.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Pracowalem nad reorganizacja informacji w panelu admina i nowa architektura nawigacji oparta o grupy domenowe. Wdrozylem konfiguracje nawigacji w `adminNavigation.ts`. |
| Dzien 2 | Rozbudowalem `AdminLayout` o kontekst strony, dynamiczne tytuly i sekcje menu dopasowane do aktualnej trasy. Poprawilem rowniez obsluge menu mobilnego i zamykania overlay. |
| Dzien 3 | Przepisalem widok referencji do nowej strony `AdminCatalogPage`, tak aby obslugiwala rozne encje w jednym komponencie. Ujednolicilem tabele, formularze i komunikaty statusowe. |
| Dzien 4 | Wykonalem porzadki CSS panelu admina i dopracowalem klasy komponentowe dla tabel, formularzy i modali. Zwiekszylem spojnosc wizualna miedzy dashboardem a modulami CRUD. |
| Dzien 5 | Przeprowadzilem manualne testy regresji tras, filtrow i formularzy po przebudowie IA. Potwierdzilem, ze kluczowe funkcje dzialaja poprawnie po refaktorze nawigacji. |

## Tydzien od 15.04.2026 do 21.04.2026

| Dzien | Opis wykonywanych czynnosci |
| --- | --- |
| Dzien 1 | Skoncentrowalem sie na stabilizacji koncowej wersji obu frontendow oraz domknieciu bledow z listy poprawek po wdrozeniu. Priorytetem byla przewidywalnosc zachowania aplikacji w codziennej obsludze. |
| Dzien 2 | Wykonalem finalny przeglad komunikacji z API, obslugi autoryzacji tokenowej i przekierowan tras. Zweryfikowalem, ze flow logowania i odswiezania sesji dziala zgodnie z zalozeniami. |
| Dzien 3 | Przeprowadzilem testy manualne buildow (`vite build`, `tsc`) i scenariuszy uruchomienia w Docker Compose. Potwierdzilem dzialanie endpointow zdrowia oraz dostepnosc frontendow na docelowych portach. |
| Dzien 4 | Uporzadkowalem dokumentacje techniczna uruchamiania, seedowania danych i pracy z modulami admina oraz wyswietlacza sal. Dodatkowo przygotowalem notatki eksploatacyjne dla dalszego utrzymania. |
| Dzien 5 | Podsumowalem caly zakres praktyk, w tym wykonane funkcjonalnosci UI, integracje API, refaktoryzacje i poprawki UX. Zamknalem etap przez przeglad historii zmian Git i opis finalnych rezultatow projektu. |

