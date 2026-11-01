# Obsługa widoku sali i panelu

[Uruchomienie](../README.md) · [Kopie JSON](CACHE.md) · [Referencja kodu](KOD.md)

## Widok sali

Otwórz `/room/KOD`, np. `/room/205`. Kod jest tekstem, może zawierać litery, np. `A12`. Nie wpisuj wewnętrznego ID tabeli rooms. Strona `/` przekierowuje do sali ustalonej przy buildzie przez TABLET_ROOM_ID; bez przypisania pokazuje informację dla administratora. Nie ma listy wszystkich sal w tym interfejsie.

Nagłówek pokazuje kod sali, budynek, piętro, zegar oraz przyciski **API** i **Harmonogram**. Główna karta przedstawia tytuł, godziny, długość, przedmiot/kod, prowadzącego, grupę/kierunek, typ i opis. Pasek postępu jest widoczny dla zajęć trwających. Notatka `note` pozostaje w danych API i panelu, ale bieżąca karta sali jej nie wyświetla. Pole `room.name` jest przekazywane w danych, lecz tytuł nagłówka składa się z „Sala” i roomId.

Domyślnie wybrane są trwające zajęcia, następnie najbliższe, a po zakończeniu dnia ostatnie. Przy nakładających się wpisach wybierany jest pierwszy pasujący. Wybór konkretnej pozycji pozostaje, dopóki ma to samo ID; zmiana sali lub endpointu tworzy widok od nowa. Samo pojawienie się nowych aktualnych zajęć nie musi przerwać ręcznego przeglądania.

### Nawigacja

- **Poprzednie/Następne** przesuwają o jedną pozycję.
- **Harmonogram** otwiera listę; wybór zajęcia zamyka ją i pokazuje kartę.
- **Wróć do teraz**, **Najbliższe zajęcia** lub **Ostatnie zajęcia** przywraca domyślny wybór.
- Strzałki lewo/prawo działają po ustawieniu fokusu na obszarze przeglądania; nie przechwytują klawiszy z formularzy ani z modyfikatorami.
- Pionowe kółko myszy lub gest dotykowy zmienia zajęcia po dojściu do końca dłuższego opisu. Nowy gest zapobiega przypadkowemu przeskoczeniu wielu kart. Otwarty harmonogram blokuje tę nawigację.

Okna są natywnymi `<dialog>`: przycisk zamknięcia, Escape i kliknięcie tła zamykają. Otwarcie blokuje przewijanie strony, zamknięcie przywraca poprzedni styl overflow. Interfejs ma etykiety dostępności, regiony statusu i obsługę preferencji ograniczonego ruchu; repo nie zawiera pełnego audytu WCAG ani automatycznych testów czytników ekranu.

### Odświeżanie i komunikaty

Plan pobierany jest po wejściu, co 60 s w widocznej karcie, po powrocie do karty, zdarzeniu online i imporcie kopii. Timeout przeglądarki to 15 s. Statusy i zegar sali aktualizują się co 15 s na podstawie zegara urządzenia, niezależnie od kolejnego pobrania.

| Komunikat | Znaczenie i działanie |
| --- | --- |
| Przygotowywanie planu | Pierwsze pobranie; ustawienia API nadal dostępne |
| Nie znaleźliśmy tej sali | 404; sprawdź kod i obecność sali w backendzie |
| Plan chwilowo niedostępny | Brak danych i błąd odczytu; **Spróbuj ponownie** |
| Zapisana kopia planu | Cache używa ostatniego zapisu albo odczyt karty nie powiódł się |
| Brak aktualnego planu, data wcześniejsza | Wyświetlany snapshot z innego dnia; nie traktuj go jako potwierdzenia dzisiejszych zajęć |
| Zaimportowana kopia | Dane wczytane z pliku, jeszcze niepotwierdzone przez źródło |
| Brak zajęć | Istniejąca sala ma pusty plan danego dnia |

Stopka pokazuje czas fetchedAt, a bez metadanych cache — generatedAt. **Ponów** odpytuje źródło ponownie; `refresh=1` jest dodawane wyłącznie dla dokładnego domyślnego endpointu. Błędy 401/403/404 usuwają dane z pamięci widoku. Pozostały błąd odświeżenia może pozostawić ostatni plan z ostrzeżeniem. Przeładowanie karty usuwa jej RAM; trwała kopia wymaga działającego lokalnego serwera cache i zachowanego pliku.

UI nie ma kalendarza wyboru dnia. Jawne `?date=` obsługuje endpoint danych; dopisanie query do adresu strony `/room/205` samo nie ustawia filtra pobierania. Można wskazać endpoint z datą w oknie API, ale plan z przeszłości będzie oznaczony jako starszy i część tekstów pustego widoku nadal odnosi się do „dziś”.

### Ustawienia API i kopie

**API → hasło → Odblokuj ustawienia → Endpoint danych sali → Zapisz**. Poprawne hasło odsłania formularz edycji i kopie; błędne pozostawia okno zablokowane. Zamknięcie okna usuwa odblokowanie. Hasło pochodzi z API_SETTINGS_PASSWORD, a domyślnie z CACHE_ADMIN_TOKEN. Sprawdza je lokalny cache, również bez głównego backendu. Domyślnie `/api/room/{roomId}`, z trwałym lokalnym cache. Własny endpoint jest bezpośrednim żądaniem przeglądarki i wymaga zgodnego JSON oraz CORS/HTTPS. **Przywróć domyślne** usuwa nadpisanie localStorage. Ustawienie dotyczy tej przeglądarki/originu, a nie wszystkich tabletów; zmiany synchronizują się między kartami.

W tej samej sekcji **Kopia zapisanych planów** wpisz CACHE_ADMIN_TOKEN. **Pobierz kopię** zapisuje JSON do folderu pobierania przeglądarki. **Wczytaj kopię** wymaga wyboru zgodnego pliku do 8 MiB; zastępuje plany tych samych sal/dat w cache, pozostawia pozostałe w granicach limitu. Nie importuje nic do głównej bazy. Szczegóły [CACHE.md](CACHE.md).

## Panel administratora

Adres `/admin/` przekierowuje na logowanie. Podaj ADMIN_TOKEN ustawiony w backendzie. Jest to jeden wspólny sekret, nie login i hasło osobnego użytkownika. CACHE_ADMIN_TOKEN może być inny. Token panelu przechowywany jest w sessionStorage danej karty pod `room_tablet_admin_token`; przy wznowieniu sprawdzany przez API. Wylogowanie usuwa ten zapis. Błąd weryfikacji sesji, także sieciowy, powoduje wylogowanie. Nie ma automatycznej pracy na niezweryfikowanej sesji offline.

Menu jest stałe na szerokim ekranie, a poniżej 1180 px dostępne jako okno przez przycisk **Menu**. **Widok sali** otwiera publiczny origin w nowej karcie; przy pustej domyślnej sali może prowadzić do strony braku przypisania. Zegar panelu używa lokalnej strefy przeglądarki.

| Ekran | Trasa pod `/admin` | Działanie |
| --- | --- | --- |
| Logowanie | `/login` | Token i powrót do żądanej chronionej trasy |
| Panel główny | `/dashboard` | Statystyki, ostrzeżenia, konflikty, skróty i ostatnio dodane zajęcia |
| Sale | `/rooms` | Lista, filtry, szczegóły, dodanie, edycja i usuwanie |
| Harmonogram | `/schedule-entries` | Lista zajęć, filtry i CRUD wpisów |
| Konflikty | `/conflicts` | Nakładające się pary i edycja wpisu |
| Piętra | `/locations/floors` | Słownik lokalizacji |
| Wykładowcy | `/teaching/lecturers` | Dane prowadzących |
| Grupy | `/teaching/student-groups` | Grupy studentów |
| Typy zajęć | `/teaching/class-types` | Np. wykład/laboratorium |
| Kierunki | `/teaching/fields-of-study` | Kierunki studiów |
| Przedmioty | `/teaching/subjects` | Kod, nazwa i kierunek |

Panel nie ma automatycznego odświeżania co 60 s jak ekran sali. Ładuje dane na wejściu, po zmianach filtrów i po własnych zapisach. Dashboard/konflikty mają ponowienie odczytu. Przy zmianach z innej karty odśwież widok. Nie ma zapisu formularza do trwałej kolejki offline. Zmiana w panelu nie unieważnia natychmiast cache — nowy plan pojawi się przy kolejnym skutecznym odświeżeniu; na ekranie sali można użyć Ponów.

### Pierwsze uruchomienie bez demo

Migracja nie tworzy słowników ani budynku. Administrator bazy musi przygotować aktywny budynek, ponieważ panel nie ma ekranu budynków. Polecenie jest w [instrukcji bazy](../../backend/database/README.md#pierwsze-dane-bez-seeda).

Zalecana kolejność danych: piętro i budynek → sala; kierunek → przedmiot; prowadzący, grupa i typ → zajęcia. Wszystkie potrzebne pozycje muszą być aktywne. Brak opcji w formularzu zwykle oznacza brak danych, dezaktywację albo nieudany odczyt API.

### Sale

Wyszukiwanie stosuje się po Enter lub opuszczeniu pola. Filtr piętra i sortowanie zmieniają listę; zmiana filtrów wraca na pierwszą stronę. Strona ma 10 pozycji. Formularz wymaga kodu, nazwy i piętra. Budynek nowej sali dobiera backend jako pierwszy aktywny alfabetycznie; istniejąca sala zachowuje budynek.

Szczegóły pokazują metadane i do 12 ostatnich wpisów. Usuwanie sali z zajęciami wymaga zgody na usunięcie zależnych wpisów. Jeśli API zwróci 409, UI informuje o zależnościach i ustawia opcję kaskadową; ponowne potwierdzenie wykonuje faktyczne usunięcie. Tę operację wykonuj świadomie — nie trafia do kosza ani historii odtwarzania.

### Harmonogram

Lista ma po 12 wpisów. Dostępne filtry: tekst, sala, prowadzący, grupa, typ, przedmiot i zakres dat; dostępne sortowanie jest opisane w [API](../../backend/docs/API.md#wpisy-harmonogramu). Wyszukiwanie tekstowe stosuje Enter/opuszczenie pola, pozostałe kontrolki odczytują dane po zmianie.

Formularz: sala, data, prowadzący, grupa, typ, przedmiot, start/koniec, opis, opcjonalna notatka. Nazwa tytułu pochodzi z przedmiotu. Start musi być wcześniejszy od końca tego samego dnia. Kontrolki daty/czasu próbują otworzyć natywny picker po kliknięciu w pole; dostępność pickera zależy od przeglądarki. Szczegóły i usuwanie mają osobne potwierdzenia. Nie ma powtarzania tygodniowego, masowego importu harmonogramu ani automatycznego zapobiegania konfliktom.

### Słowniki i aktywność

Każda sekcja pozwala dodać, edytować i usunąć pozycję. Piętro ma etykietę i kolejność, wykładowca imię/nazwisko, grupa/typ/kierunek nazwę, przedmiot kod, nazwę i kierunek. Dostępne jest pole aktywności. Kod przedmiotu normalizowany jest do wielkich liter. Dane listy obejmują także nieaktywne pozycje.

Nieaktywny rekord pozostaje w istniejących planach i bazie, ale nie pojawia się w opcjach nowych zapisów. Edycja starszego wpisu powiązanego z nieaktywnym słownikiem może wymagać ponownego aktywowania lub wyboru aktywnego rekordu. Przed usunięciem UI odczytuje zależności; używany rekord jest blokowany także po stronie API. Zamiast usuwać używany słownik można go dezaktywować.

### Konflikty i dashboard

Konflikt oznacza dwie pozycje w tej samej sali i dacie, których godziny nakładają się ściśle. Styk końca i początku nie jest konfliktem. Nie jest sprawdzane równoczesne zajęcie prowadzącego/grupy w różnych salach. Lista obejmuje wszystkie daty. Z kart pary można edytować jeden wpis; po zapisie lista pobiera się ponownie. Udany zapis nie jest dowodem usunięcia konfliktu — sprawdź aktualną listę.

Dashboard pokazuje liczbę sal, wszystkich wpisów, dzisiejszych zajęć, sal bez jakichkolwiek wpisów i konfliktowych par. „Sale bez zajęć” nie oznacza wyłącznie sal pustych dzisiaj. Jedne zajęcia w kilku konfliktach zwiększą liczbę par więcej niż raz.

## Czas i granice trybu offline

Główny backend i cache korzystają z APP_TIMEZONE. W widoku sali `src/lib/schedule.ts` ma stałą Europe/Warsaw dla zegara, etykiet i postępu; statusy planu korzystają ze strefy zwróconej przez cache. Panel używa strefy urządzenia. Dla obecnego wdrożenia ustaw Europe/Warsaw i poprawny zegar urządzeń; pełna zmiana strefy wymaga również dostosowania komponentów.

Lokalny JSON pozwala uruchomić widok po restarcie serwera WWW bez głównego API. Nie zapewnia działania przeglądarki od zera bez serwera WWW, nie zawiera plików całej aplikacji i nie umożliwia edycji bazy offline. Macierz awarii: [główny README](../../README.md#awarie-i-trwałość).
