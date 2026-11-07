# 9. Obsługa, diagnostyka i nauka projektu

## Przygotowanie stanowiska

**Profesor pyta: jak przejść od zainstalowanego APK do rzeczywistej pracy?**

Poniższa procedura opisuje czynności administratora. Nie oznacza, że podczas pisania dokumentacji zostały wykonane na podłączonym urządzeniu.

1. Uruchom aplikację i wejdź do administracji PIN-em początkowym `1111`, o ile instalacja nie ma już innego kodu. Zmień PIN i sprawdź jego działanie.
2. Potwierdź rolę Device Owner. Jeśli jej brakuje, przygotuj urządzenie zgodnie z warunkami Androida i instalatorem. Sama rola domyślnego pulpitu nie wystarcza.
3. Zezwól na pływające menu w ustawieniach Androida, korzystając z przycisku w panelu przy wyłączonej ochronie.
4. Przygotuj aplikacje: kreatory pierwszego uruchomienia i ustawienia specjalne przejdź w trybie serwisowym. Dla uprawnień dangerous zapisz jawne zgody lub odmowy w panelu Stanowiska.
5. Wybierz pakiety i tryb każdego z nich. Jeśli potrzebna jest strona, wpisz pełny URL, tytuł i dodatkowe origins logowania; zapisz ustawienia i włącz stronę.
6. Ustal niewygaszanie i widoczność pasków, następnie wybierz „Zapisz konfigurację”.
7. Wybierz „Zastosuj zapisaną politykę”. Sprawdź rewizję zastosowaną, rzeczywisty stan blokady i działanie nakładki nad programami.
8. Przetestuj osobno powrót w wielu aplikacjach, wyjście przez PIN z pojedynczej sesji, odtworzenie po restarcie i świadome wyjście serwisowe.

Źródła odpowiadających przycisków i operacji: [WorkspaceScreen.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceScreen.kt), [PolicyEngine.kt](../app/src/main/java/pl/adriantur/stanowisko/PolicyEngine.kt).

**Profesor pyta: jak później zmienić listę bez nieporozumień?**

Zakończ aktywną pojedynczą sesję po PIN-ie, otwórz administrację, zmień wybór i zapisz. Zapamiętaj, że `revision` może już być większe od `appliedRevision`; stara lista nadal obowiązuje podczas ochrony. Dopiero zastosowanie zapisanej polityki uruchamia zmianę. Jeśli zmieniły się tylko ustawienia WWW, są zapisywane odrębnie i dotyczą kolejnego utworzenia strony.

## Diagnoza po objawie

**Profesor pyta: co sprawdzić, zanim zaczniemy zmieniać kod?**

| Objaw | Pierwsza kontrola | Odpowiedni fragment |
| --- | --- | --- |
| Aplikacja działa, ale „Bez pełnej ochrony” | Owner, `enabled`, stan LOCKED; każdy z osobna | `WorkspaceLauncher`, `PolicyEngine.owner/lockState` |
| Zapisano listę, ale stare kafelki nadal są aktywne | Porównaj rewizję zapisaną i zastosowaną | `save`, wybór `appliedRules` w ekranie |
| Zastosowanie zgłasza pustą listę | Wybierz aplikację albo poprawnie włącz stronę | `PolicyValidator.validate` |
| Czerwona obwódka aplikacji | Sprawdź liczbę nieprzygotowanych uprawnień, zapisz zgody lub odmowy | `AppPermission.prepared`, dialog uprawnień |
| Nie można rozpocząć pojedynczej sesji | Czy działa pełna ochrona i nakładka | `launch`, `launchWeb` |
| PIN nie reaguje od razu | Czy trwa blokada po próbach, czy operacja jest zajęta | `PinStore.verify`, `busy` |
| Dostęp administratora wygasł podczas pracy | Termin dwóch minut i callbacki zatrzymania Activity | `authorized`, `onActivityStopped` |
| Ustawienie uprawnień odrzucone | Zależności lokalizacji i wynik odczytu DPM | `PermissionGrantPlan`, `configure` |
| Strona odrzuca logowanie | Dokładny schemat, host i port origin przekierowania | `WebAddress.origin`, `page.allows` |
| HTTPS nie otwiera się | Certyfikat, nazwa hosta, czas i zaufanie urządzenia | `onReceivedSslError` anuluje połączenie |
| Brak przycisku wyboru pliku lub aparatu WWW | To zaprogramowana odmowa tych funkcji | `WebChromeClient`, download listener |
| Po restarcie brak gotowej sesji | Keyguard, zapis `enabled`, owner, `policy.error`, dziennik | `BootReceiver`, `restore` |
| Nakładka poza spodziewaną pozycją | Obrót, insets, zapisane ułamki i aktualne granice | `FloatingPanelBounds`, `restorePosition` |
| Instalator widzi kilka urządzeń | Pełna lista ADB, także emulatory i połączenia sieciowe | Wybór urządzenia w instalatorach |
| ADB odrzuca aktualizację | Pakiet, versionCode, podpis i flagi instalacji | `install -r -t` i wynik systemu |
| Gradle zgłasza brak Java | Ustaw rzeczywistą ścieżkę JDK, np. sprawdzony JBR | Rozdział 7 |
| Rola właściciela odrzucona po instalacji | Odczytaj przyczynę Androida i stan kont/profili | APK może pozostać poprawnie zainstalowany |

**Profesor pyta: jakie polecenia diagnostyczne nie zmieniają polityki?**

Na komputerze z ADB można odczytać:

```bash
adb devices -l
adb -s SERIAL shell -n getprop ro.build.version.sdk
adb -s SERIAL shell -n dpm list-owners
adb -s SERIAL shell -n dumpsys device_policy
adb -s SERIAL shell -n dumpsys activity activities
```

`SERIAL` jest symbolem do zastąpienia rzeczywistym identyfikatorem. Ostatnie odczyty bywają obszerne i zależne od wersji systemu. Wyniki mogą zawierać dane urządzenia i nazwy uruchamianych aplikacji; przy analizie wybieramy pola potrzebne do problemu. Dziennik w panelu pokazuje 80 ostatnich wpisów, choć baza przechowuje do 1000.

**Profesor pyta: czy do naprawy błędu należy od razu usuwać dane?**

Nie wynika to z diagnozy. Najpierw trzeba wiedzieć, czy niespójność dotyczy szkicu, sesji, autoryzacji, nakładki czy DPM. Kasowanie danych utraciłoby PIN, bazę i zapis poprzednich launcherów; nie jest neutralnym sposobem odświeżenia ekranu. Wbudowaną drogą administratora jest zakończenie sesji i wyjście serwisowe, z kontrolą jego faktycznego wyniku.

## Scenariusze testów na urządzeniu

**Profesor pyta: jak odróżnić pokaz działania od wiarygodnego testu?**

Trzeba ustalić stan początkowy, wywołać konkretny bodziec, a następnie odczytać wynik z UI i systemu. Te scenariusze są planem weryfikacji sprzętowej, nie raportem z jej wykonania.

| Scenariusz | Bodziec | Oczekiwany wynik i obserwacja |
| --- | --- | --- |
| Świeża instalacja | Start bez danych | Domyślny PIN powstaje raz; można go zmienić |
| Aktualizacja z danymi | Zgodny podpis i nowsza wersja | Własny PIN, baza i konfiguracja pozostają |
| Szkic przy ochronie | Zapis nowej listy bez zastosowania | Rewizje różne, aktywna pozostaje poprzednia lista |
| Wieloaplikacyjność | Otwarcie A, dom, otwarcie B | Brak PIN-u do zwykłego powrotu; Lock Task nadal LOCKED |
| Pojedyncza aplikacja | Próba powrotu i błędny PIN | Sesja pozostaje; poprawny PIN umożliwia zakończenie |
| Sam powrót z sesji | Użycie przycisku kłódki i poprawny PIN | Pulpit bez otwartego dostępu administratora |
| Restart w sesji | Restart Androida i odblokowanie keyguardu | Odtworzenie zastosowanej listy i celu; kontrola logu |
| Utrata procesu | Kontrolowane przerwanie procesu w środowisku testowym | Brak utrwalenia autoryzacji; sprawdzenie ponownego odtworzenia sesji |
| Nowe uprawnienie programu | Aktualizacja dodająca dangerous permission | Wymagane przygotowanie zamiast swobodnego uruchomienia |
| Odmowa DPM | Niedopuszczalna zmiana w kontrolowanej próbie | Czytelny błąd, kontrola polityki i możliwej kompensacji |
| Brak nakładki | Nieprzyznane zezwolenie przed zastosowaniem | Operacja odrzucona przed zakończeniem aktywacji |
| Awaria nakładki | Kontrolowana awaria usługi podczas pracy | Ocena ścieżki autoryzacji i odtworzenia na danym systemie |
| Nawigacja WWW | Origin dozwolony, obcy, POST, przekierowania | Odrzucanie niepożądanej nawigacji; osobny pomiar faktycznych żądań sieciowych |
| Awaria renderera | Kontrolowane zakończenie renderera w próbie | Panel błędu; odtworzenie WebView bez nieautoryzowanego końca sesji |
| Obrót i mały ekran | Kilka rozdzielczości oraz orientacji | Kontrolki dostępne, panel w granicach, czytelny tekst |
| Serwis | PIN, koniec sesji i `serviceExit` | NONE, brak nakładki, przywrócone launchery; owner i PIN zachowane |
| Menu producenta | Przyciski i gesty OEM na docelowym modelu | Sprawdzenie, czy nie otwierają niezamierzonej drogi poza dozwoloną pracę |

**Profesor pyta: jakie testy automatyczne mają największą wartość przy rozwoju?**

Testy migracji 1→3 i 2→3 z rzeczywistymi bazami; testy odmów DPM na poszczególnych etapach; odtwarzanie po utracie procesu pomiędzy zapisem runtime a zmianą polityki; testy poprawnego rozróżnienia PIN-owego powrotu i otwarcia panelu; testy WebView z kontrolowanym serwerem przekierowań i POST. Jednostkowe testy czystych walidatorów są przydatne, ale nie pokrywają tych granic systemowych.

## Ćwiczenia z czytania i rozwijania kodu

**Profesor pyta: jak samodzielnie prześledzić jedną operację?**

Weź przycisk „Zastosuj zapisaną politykę” w `WorkspaceScreen`. Zaznacz kolejno `vm.run`, `engine.apply`, `setPolicy`, `startProtection`, `overlay` i `dao.put`. Dla każdego kroku dopisz: warunki wejścia, odczyty, skutki uboczne i reakcję na błąd. W ten sposób otrzymasz rzeczywisty przebieg, a nie tylko listę klas.

**Profesor pyta: jak dodać nowe ustawienie do polityki?**

Załóżmy dodatkową opcję o roboczej nazwie `newOption`. Najpierw ustal API Androida i warunki jego użycia. Następnie zdecyduj, czy ustawienie ma obowiązywać dopiero po zastosowaniu. Jeśli tak, potrzebuje pary zapisanej i zastosowanej, migracji bazy, kontrolki szkicu, przekazania przez `save`, obsługi `apply`, `restore` i serwisu oraz zdefiniowanego zachowania kompensacji. Dodaj kontrolę efektu tam, gdzie system pozwala go odczytać.

To ćwiczenie nie implementuje tej opcji. Pokazuje, dlaczego zmiana w projekcie przebiega przez kilka odpowiedzialności i dlaczego zgubiona kopia `applied...` może spowodować użycie szkicu po restarcie.

**Profesor pyta: jak ocenić propozycję nowej biblioteki?**

Nazwij problem, który rozwiązuje, porównaj go z obecnym kodem i dopiero potem koszt zależności. Biblioteka HTTP nie jest potrzebna tylko dlatego, że produkt otwiera URL: obecny ruch strony realizuje WebView. Biblioteka DI ma sens, gdy poprawia składanie i testowanie, a nie dlatego, że sama jej obecność miałaby dowodzić dobrej architektury.

## Pytania na obronę projektu

**Profesor pyta: dlaczego nie utożsamiamy enabled z pełną ochroną?**

Bo to trwały zamiar aplikacji; skuteczne działanie wymaga także roli owner i potwierdzonego stanu Androida. Te wartości mogą rozjechać się po błędzie.

**Profesor pyta: czy Mutex zabezpiecza przed restartem?**

Nie. Porządkuje operacje w żyjącym procesie. Restart wymaga trwałego zapisu i logiki odtwarzania.

**Profesor pyta: czy jawna odmowa uprawnienia jest błędem przygotowania?**

Nie. Własność `prepared` traktuje administracyjne DENIED jako rozstrzygnięcie. Program może mieć mniej funkcji, ale nie musi pytać użytkownika o tę zgodę.

**Profesor pyta: dlaczego systemowy HOME może być wyłączony nawet w trybie wielu aplikacji?**

Bo maska dodaje HOME tylko przy `single=false` i `hideBars=false`. Dla ukrytych pasków powrót zapewnia nakładka.

**Profesor pyta: czy serwis usuwa zarządzanie urządzeniem?**

Nie. Zdejmuje określone ograniczenia, pozostawiając Device Owner, zapisane dane i decyzje uprawnień.

**Profesor pyta: czy release i debug różnią się tylko nazwą pliku?**

Nie. Wariant debug scala dodatkowy manifest `testOnly`; podpisywanie i przeznaczenie dystrybucji też mają znaczenie. W tym repozytorium brak gotowej konfiguracji własnego podpisu release.

**Profesor pyta: jaka jest najważniejsza rzecz do wykazania przy prezentacji?**

Pokazać pełny przebieg: przygotowanie, zapis, zastosowanie, uruchomienie, kontrolowany powrót i odtworzenie. Sam ładny pulpit nie dowodzi działania egzekwowania polityki, a sam numer rewizji nie dowodzi stanu systemu.
