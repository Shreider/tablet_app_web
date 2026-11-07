# 3. Dane i stan aplikacji

## Cztery miejsca przechowywania

**Profesor pyta: gdzie naprawdę znajduje się stan Stanowiska?**

W czterech rodzajach miejsc: baza Room, prywatne SharedPreferences, pamięć procesu i stan systemu Android. To rozróżnienie tłumaczy wiele pozornych sprzeczności, np. zapis „polityka aktywna” przy błędzie jej odtworzenia.

| Miejsce | Przykład | Co przetrwa utratę procesu |
| --- | --- | --- |
| Room `workspace.db` | Zapisana i zastosowana polityka, dziennik | Dane zapisane w bazie |
| SharedPreferences | `runtime.session`, credential PIN-u, ustawienia WWW | Zatwierdzone wartości preferences |
| Pamięć procesu | `adminUntil`, `busy`, `lockRootActivity`, formularze `remember` | Te wartości same z siebie nie przetrwają |
| Android | Rola Device Owner, lista Lock Task, wybór HOME, przyznane uprawnienia | Zależnie od konkretnej polityki i mechanizmu systemowego; odtwarzanie musi odczytać rzeczywisty stan |

Źródła: [WorkspaceDatabase.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceDatabase.kt), [WorkspaceApp.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceApp.kt), [PolicyEngine.kt](../app/src/main/java/pl/adriantur/stanowisko/PolicyEngine.kt).

## Model polityki w Room

**Profesor pyta: co zawiera PolicyRecord?**

Jeden rekord o domyślnym `id = 1`. DAO odczytuje właśnie ten identyfikator. Baza nie modeluje wielu nazwanych profili konfiguracji.

| Pole | Znaczenie |
| --- | --- |
| `id` | Klucz główny; konwencja aplikacji używa 1 |
| `revision` | Numer ostatniego zapisu konfiguracji; start 0 |
| `rules` | JSON reguł zapisanych przez administratora |
| `appliedRevision` | Numer rewizji, której zastosowanie zakończono sukcesem; start −1 |
| `appliedRules` | Kopia listy z ostatniego udanego zastosowania |
| `enabled` | Czy aplikacja ma odtwarzać ochronę |
| `error` | Zachowany opis ostatniego problemu zastosowania lub odtworzenia |
| `keepScreenOn` | Zapisana decyzja o niewygaszaniu |
| `appliedKeepScreenOn` | Zastosowana decyzja o niewygaszaniu |
| `hideSystemBars` | Zapisana decyzja o paskach |
| `appliedHideSystemBars` | Zastosowana decyzja o paskach |

**Profesor pyta: po co dwie listy i dwa numery rewizji?**

Rozważmy konkretny przebieg:

1. Rewizja 7 pozwala na aparat i zegar. Została zastosowana, więc `revision = appliedRevision = 7`.
2. Administrator usuwa aparat i zapisuje konfigurację. Powstaje rewizja 8, lecz `appliedRevision` nadal wynosi 7.
3. Gdy `enabled = true`, pulpit i `launch()` używają `appliedRules`. Aparat nadal należy do aktywnej konfiguracji.
4. Dopiero udane `apply()` kopiuje nowe reguły do `appliedRules` i ustawia `appliedRevision = 8`.
5. Jeśli zastosowanie zawiedzie, aplikacja próbuje przywrócić poprzednią politykę i zachowuje błąd. Sam zapis rewizji 8 nie staje się dowodem jej aktywacji.

Ta konstrukcja oddziela życzenie administratora od ostatniej potwierdzonej konfiguracji. `appliedRevision` jest zapisem wyniku operacji aplikacji, a nie ciągłym dowodem, że każda polityka Androida nadal ma dokładnie ten stan.

**Profesor pyta: jak wygląda AppRule i skąd bierze się JSON?**

```kotlin
data class AppRule(val packageName: String, val singleSession: Boolean)
```

`RuleCodec` używa wbudowanego `org.json`. Przykład formatu:

```json
[
  {"package": "com.example.camera", "single": true},
  {"package": "com.example.clock", "single": false}
]
```

To przykładowe identyfikatory, nie gwarantowane nazwy aplikacji na tablecie. Pakiet identyfikuje aplikację, a `single` określa sposób jej uruchomienia. W JSON nie ma przyznanych uprawnień, ikony ani nazwy widocznej dla człowieka; te dane pochodzą z PackageManager i systemu polityk.

Walidator zabrania pustej listy bez włączonej strony, duplikatów, ręcznego dodawania Stanowiska i wskazania pakietu spoza aktualnie dostępnej listy. `decode()` oczekuje prawidłowego JSON z wymaganymi polami; nie naprawia dowolnie uszkodzonego zapisu.

Źródło: [AppPolicy.kt](../app/src/main/java/pl/adriantur/stanowisko/AppPolicy.kt).

## Schemat i migracje

**Profesor pyta: jak aktualizacja zachowuje starą konfigurację?**

Room otwiera bazę wersji 3. `WorkspaceApp` rejestruje migracje `MIGRATION_1_2` i `MIGRATION_2_3`. Pierwsza dodaje dwie kolumny niewygaszania, druga dwie kolumny pasków. Każda nowa kolumna ma SQL-owe `NOT NULL DEFAULT 0`.

```text
wersja 1: polityka i audyt
    ↓ dodanie keepScreenOn i appliedKeepScreenOn
wersja 2
    ↓ dodanie hideSystemBars i appliedHideSystemBars
wersja 3
```

W `app/schemas/.../1.json`, `2.json`, `3.json` znajdują się eksporty schematu, które pozwalają porównać strukturę. Nie ma `fallbackToDestructiveMigration()`, czyli świadomie skonfigurowanego kasowania bazy w zastępstwie brakującej migracji. Ogólny mechanizm i znaczenie testów migracji opisuje [dokumentacja Room](https://developer.android.com/training/data-storage/room/migrating-db-versions).

**Profesor pyta: dlaczego hideSystemBars ma w Kotlinie true, a w SQL default 0?**

To dwa różne momenty ustalania wartości. Nowy `PolicyRecord()` utworzony przez kod ma `hideSystemBars = true`. Rekord istniejący przed migracją 2→3 otrzymuje dodaną kolumnę z wartością `0`, czyli false. `@ColumnInfo(defaultValue = "0")` opisuje domyślną wartość schematu, a argument konstruktora opisuje tworzenie obiektu w Kotlinie. Zrównanie ich w opisie ukryłoby rzeczywistą różnicę zachowania nowych i aktualizowanych instalacji.

## SharedPreferences

**Profesor pyta: co nie trafiło do Room?**

| Nazwa preferences | Klucze | Przeznaczenie |
| --- | --- | --- |
| `auth` | `credential`, `failures`, `blockedUntil` | Szyfrogram poświadczenia i ochrona przed kolejnymi próbami PIN-u |
| `runtime` | `session`, `keepScreenOn`, `hideSystemBars`, `hiddenLaunchers` | Odtwarzanie bieżącej sesji, zastosowane flagi i poprzedni stan obcych pulpitów |
| `web-page` | `enabled`, `title`, `url`, `additionalUrls`, `javaScript`, `singleSession` | Konfiguracja wbudowanej strony |
| `overlay-position` | `x`, `y` | Ułamkowa pozycja pływającego panelu |

Większość istotnych zapisów używa `commit()` i sprawdza jego wynik. Pozycja nakładki używa `apply()`. W `apply()` silnika część zapisów podczas wycofywania jest wykonywana bez sprawdzenia zwróconej wartości; nie należy więc opisywać wszystkich zapisów jako jednakowo kontrolowanych.

Źródła: [PinStore.kt](../app/src/main/java/pl/adriantur/stanowisko/PinStore.kt), [WebPageConfig.kt](../app/src/main/java/pl/adriantur/stanowisko/WebPageConfig.kt), [ExitOverlayService.kt](../app/src/main/java/pl/adriantur/stanowisko/ExitOverlayService.kt).

**Profesor pyta: czy strona też ma rewizję zapisaną i zastosowaną?**

Nie. To ważny wyjątek od modelu polityki aplikacji. `saveWeb()` zapisuje konfigurację bezpośrednio w `web-page`, a `WebPageStore` publikuje nowy `StateFlow`. Przełącznik włączenia w formularzu zapisuje od razu. Pozostałe pola zapisuje przycisk. Otwarte `WebActivity` pobiera kopię konfiguracji w `onCreate`; pełna nowa konfiguracja obowiązuje przy następnym utworzeniu strony. Zmiany strony nie podnoszą `PolicyRecord.revision`.

## Dziennik i reaktywne odczyty

**Profesor pyta: ile zdarzeń przechowujemy i co widzimy?**

`AuditEvent` ma automatyczny `id`, czas w milisekundach od epoki, `kind` i `detail`. `audit()` wykonuje insert, a następnie trim. Baza jest przycinana do 1000 najnowszych identyfikatorów, natomiast strumień widoczny dla UI zwraca 80 ostatnich rekordów. To trzy różne pojęcia: zapis, retencja i zakres prezentacji.

`UiText` tłumaczy kod zdarzenia na polską etykietę. Tylko wybrane detale pokazuje użytkownikowi, np. pakiet i tryb uruchomienia. Szczegóły wyjątków bywają przechowywane jako nazwy klas, a nie stosy wywołań. Dziennik jest lokalny i nie jest kryptograficznie chronionym, zewnętrznym rejestrem audytowym.

**Profesor pyta: jak zmiana w bazie dociera do ekranu?**

```text
DAO.observe() / DAO.events()
       ↓ Flow
ViewModel.stateIn(viewModelScope, WhileSubscribed(5000), wartość początkowa)
       ↓ StateFlow
collectAsStateWithLifecycle()
       ↓ stan Compose
ponowne obliczenie odpowiednich części interfejsu
```

Polityka startuje od `null`, logi od pustej listy. `WhileSubscribed(5000)` oznacza opóźnienie zatrzymania zbierania upstream po utracie subskrybentów; nie odświeżanie co pięć sekund. Lista programów jest odświeżana osobno przez PackageManager. `refresh()` anuluje poprzednie zadanie, a brak możliwości odczytu uprawnień konkretnego pakietu zapisuje jako `null`, żeby odróżnić błąd od liczby zero.

## Współbieżność i spójność

**Profesor pyta: czy Mutex oznacza transakcję całego urządzenia?**

Nie. Silnik ma własny `Mutex`, `PinStore` własny, a UI dodatkowo flagę `busy`. Mutex porządkuje operacje wykonywane przez dany obiekt w procesie. Nie łączy wywołań Androida, preferences i Room w jedną atomową transakcję i nie przetrwa restartu.

`AppPermissionManager.configure()` nie używa mutexu silnika, choć sprawdza administratora, właściciela i brak sesji. Stan Androida może też zmienić się niezależnie od procesu. Stąd odczyt kontrolny po zmianie, kopie zastosowanej polityki i logika odtwarzania.

**Profesor pyta: jaki jest najtrudniejszy przypadek awarii?**

Utrata procesu pomiędzy zapisem stanu lokalnego a dokończeniem zmian w Androidzie. Przykładowo sesja jest zapisywana przed zmianą polityki uruchamiania, a serwis utrwala `enabled=false` przed zniesieniem ograniczeń. To świadome uporządkowanie kroków pod określony cel, lecz nie usuwa wszystkich stanów częściowych. Ich konsekwencje i proponowane ulepszenia analizuje [rozdział 8](08-decyzje-i-ograniczenia.md).
