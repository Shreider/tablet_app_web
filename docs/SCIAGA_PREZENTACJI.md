# Ściąga do prezentacji Stanowiska

Jedna wypowiedź do każdego slajdu pliku `Adrian_Tur_1.pptx`, w jego oryginalnej kolejności. To wariant skrócony; pełne wypowiedzi i pytania profesora są w [module 11](11-scenariusz-prezentacji.md) i [scenariuszu HTML](SCENARIUSZ_PREZENTACJI.html).

| Slajd | Temat | Powiedz |
| --- | --- | --- |
| 01 | STANOWISKO | Przedstawiam Stanowisko — aplikację Android do udostępniania wybranych programów i strony WWW pod kontrolą administratora. |
| 02 | Trzy etapy projektu | Omówię założenia, implementację i weryfikację, a na końcu kierunki rozwoju. |
| 03 | Urządzenie do konkretnego zadania | Urządzenie zadaniowe powinno udostępniać potrzebne funkcje i utrzymywać konfigurację ustaloną przez administratora. |
| 04 | Administrator ustala granice | Administrator wybiera zakres, Android egzekwuje politykę, a PIN chroni administrację. Zapis konfiguracji i jej zastosowanie są osobnymi krokami. |
| 05 | Cel pracy i pięć tez | Tezy obejmują kontrolę środowiska, bezpieczeństwo, elastyczność, oficjalne API i wygodę administracji. Ich skuteczność wymaga weryfikacji. |
| 06 | Lokalny obieg konfiguracji | Interfejs przekazuje akcje do logiki polityk, która współpracuje z Androidem i lokalnymi danymi. Sieci potrzebuje wybrana strona WWW. |
| 07 | Źródła i bibliografia | Podstawą są publikacje o Androidzie i Kotlinie oraz dokumentacja Android Developers dotycząca polityk urządzenia. |
| 08 | Jedna aplikacja, różne stanowiska | Zmieniając konfigurację, mogę przygotować kiosk WWW, zestaw aplikacji służbowych albo demonstrację jednej aplikacji. |
| 09 | Pilotaż w środowisku testowym | Pilotaż planuję w środowisku testowym, po określeniu modelu urządzenia i zasad jego użycia. |
| 10 | Zakres informatyczny | Zakres to aplikacja Android, lokalna konfiguracja i polityki urządzenia. Centralne zarządzanie flotą pozostaje poza bieżącą implementacją. |
| 11 | Dziełem jest aplikacja mobilna | Rezultatem jest aplikacja mobilna z pulpitem, politykami, PIN-em, danymi lokalnymi i instrukcją przygotowania urządzenia. |
| 12 | Użytkownicy i odpowiedzialność | Operator pracuje na pulpicie, administrator ustala konfigurację, a organizacja i IT odpowiadają za zasady oraz przygotowanie sprzętu. |
| 13 | Wykonalność projektu | Stos pozwala zrealizować projekt na Androidzie 14+. „0 zł” nie obejmuje sprzętu ani nakładu pracy i prób. |
| 14 | Sześć etapów realizacji | Najpierw analiza i dane, potem pulpit oraz polityki, a następnie próby i przygotowanie dystrybucji. |
| 15 | Ryzyka wymagają prób na sprzęcie | Główne ryzyka to przygotowanie urządzenia, różnice OEM i skuteczność ograniczeń. Ich ocenę trzeba uzupełnić próbami sprzętowymi. |
| 16 | Granice rozwiązania | Rozwiązanie jest lokalne, wymaga przygotowanego Androida, a działanie WebView zależy od dostępności treści. |
| 17 | Dziesięć wymagań funkcjonalnych | Wymagania obejmują funkcje użytkownika, kontrolę administratora i utrzymanie środowiska po zmianach oraz restartach. |
| 18 | Jakość środowiska pracy | Istotne są zgodność, lokalna praca, odtwarzanie i czytelny stan konfiguracji. Jakość działania trzeba ocenić testami. |
| 19 | Stos technologiczny | Kotlin i Compose tworzą aplikację, Room przechowuje stan, a DevicePolicyManager realizuje kontrolę urządzenia. Gradle buduje, ADB instaluje. |
| 20 | PolicyEngine łączy interfejs z systemem | PolicyEngine przekłada działania administratora na lokalny zapis i operacje systemowe Androida. |
| 21 | Podział odpowiedzialności | Oddzielono prezentację, stan, logikę i dane, dzięki czemu każda część ma określone zadanie. |
| 22 | Cztery operacje polityki | Zapis, zastosowanie, start programu i serwis to osobne operacje, z osobnymi warunkami wejścia. |
| 23 | Dwie encje i ustawienia lokalne | PolicyRecord przechowuje politykę, AuditEvent dziennik. Pozostałe ustawienia są w preferences, a klucz poświadczenia w Keystore. |
| 24 | Konfiguracja jest danymi | Reguła wskazuje pakiet i tryb sesji. Konfiguracja jest walidowana, zapisywana i dopiero później stosowana. |
| 25 | Zmiana polityki krok po kroku | Ścieżka administratora to PIN, wybór, zapis i zastosowanie. Zapisana zmiana może jeszcze czekać na aktywację. |
| 26 | Zapis nie uruchamia ochrony | Najpierw zmiana i kontrola stanu Androida, potem zapis sukcesu. Samo utrwalenie listy nie aktywuje ochrony. |
| 27 | Uruchomienie dozwolonego komponentu | Chronione uruchomienie wymaga dozwolonej reguły i przygotowanych uprawnień. Pojedyncza sesja zawęża środowisko i chroni powrót PIN-em. |
| 28 | Stanowisko 1.0.9 | Dostępna jest implementacja 1.0.9. Status kodu i status prób sprzętowych pozostają odrębne. |
| 29 | Struktura projektu | Najważniejsze obszary kodu to ekran, ViewModel, silnik polityk oraz osobne części danych, PIN-u i WWW. |
| 30 | Budowanie i instalacja | Gradle tworzy debug APK, a ADB instaluje go na urządzeniu. Budowanie i przygotowanie produkcyjnej dystrybucji to osobne zadania. |
| 31 | Room przechowuje politykę i audyt | Room rozdziela zapisane i zastosowane reguły, przechowuje audyt oraz ma migracje ustawień ekranu i pasków. |
| 32 | Device Owner jest warunkiem ochrony | Device Owner umożliwia zarządzanie, a Lock Task ogranicza zadania według ustawionej listy. Sam APK tego nie uruchamia. |
| 33 | Dwa tryby pracy | Wiele aplikacji pozwala przełączać się przez pulpit. Pojedyncza sesja wymaga PIN-u przed powrotem. |
| 34 | WebView ogranicza nawigację | Lista originów kontroluje nawigację strony według schematu, hosta i portu. Nie jest globalnym filtrem całej sieci. |
| 35 | PIN chroni dostęp administratora | PIN ma sól, pochodną PBKDF2, szyfrowany zapis i ograniczanie prób. Domyślny kod trzeba zmienić przed udostępnieniem stanowiska. |
| 36 | Błędna konfiguracja jest odrzucana | Sprawdzane są pakiety, duplikaty, sens listy i poprawność URL. Własny pakiet dodaje silnik, a nie administrator. |
| 37 | Konfiguracja zapisana i zastosowana | Odtwarzana jest ostatnia zastosowana konfiguracja, a nie nowy, niezastosowany zapis. Stan po restarcie wymaga sprawdzenia na urządzeniu. |
| 38 | Zakres obecny w aplikacji | Implementacja obejmuje pracę użytkownika i administrację, od pulpitu po polityki, PIN oraz lokalny audyt. |
| 39 | Demonstracja krok po kroku | Pokaz obejmuje przygotowanie, zastosowanie polityki, kontrolę uruchamiania, PIN, WebView i odtworzenie po restarcie. |
| 40 | Mapa modułów | Każdemu zachowaniu z pokazu odpowiada konkretna część kodu: interfejs, silnik, dane albo obsługa systemu. |
| 41 | Wymagania mają pokrycie w kodzie | Tabela pokazuje śledzenie wymagań do kodu. Obecność implementacji to pierwszy etap, a wyniki prób są osobnym dowodem. |
| 42 | Trzy pomiary do wykonania | Do zbadania pozostają start, zastosowanie polityki i restart, według jawnie określonych warunków pomiaru. |
| 43 | Kod i dokumentacja to pierwszy etap | Stan „w kodzie” oznacza implementację, a „do prób” potrzebę potwierdzenia jej zachowania na sprzęcie. |
| 44 | Jak zweryfikować pięć tez | Każda teza ma własną metodę weryfikacji: próby ograniczeń, różne konfiguracje, odczyty systemu i porównanie czasu administracji. |
| 45 | Instalacja i przygotowanie urządzenia | Instalacja APK, nadanie Device Owner i zastosowanie polityki to trzy różne etapy przygotowania urządzenia. |
| 46 | Kolejne etapy rozwoju | Priorytetem są próby i przygotowanie dystrybucji. Import, QR oraz panel centralny to kolejne etapy rozwoju. |
| 47 | Kontrolowane środowisko i lokalna konfiguracja | Powstała implementacja lokalnego stanowiska Android. Kolejny krok to pilotaż i pomiary potwierdzające jego działanie. Dziękuję za uwagę. |

## Pięć zdań do zapamiętania

1. Instalacja APK, nadanie Device Owner i zastosowanie polityki to osobne kroki.
2. Zapisana konfiguracja i ostatnia zastosowana konfiguracja mogą mieć różne rewizje.
3. Pojedynczą sesję kończy PIN; wyjście serwisowe pozostawia Device Owner.
4. Origin to schemat, host i port; kontrola nawigacji nie jest zaporą całej sieci.
5. Obecność kodu, budowanie i próby logiki nie zastępują testu ochrony na fizycznym urządzeniu.

Przy slajdzie 39 rozróżnij omówienie procedury od rzeczywiście wykonanej demonstracji. Przy 42–44 podaj tylko zebrane wyniki. Na końcu zatrzymaj slajd 47 i poczekaj na pytania.
