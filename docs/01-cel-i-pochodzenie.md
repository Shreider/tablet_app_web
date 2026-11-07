# 1. Cel i pochodzenie projektu

## Problem rozwiązywany przez Stanowisko

**Profesor pyta: co właściwie otrzymaliśmy w katalogu MYAPP?**

Otrzymaliśmy natywną aplikację Android o nazwie **Stanowisko**, napisaną w Kotlinie. Jej identyfikatorem instalacyjnym jest `pl.adriantur.stanowisko`. Nazwa katalogu `MYAPP` jest lokalną nazwą folderu; nie wyznacza nazwy pakietu, produktu ani modułu Gradle. Projekt ma jeden moduł aplikacji, `:app`.

Aplikacja łączy trzy odpowiedzialności: własny pulpit urządzenia, lokalny panel administratora i sterownik polityk urządzenia. Pokazuje dozwolone aplikacje oraz opcjonalny kafelek strony internetowej. Kiedy zostaje odpowiednio przygotowana i uruchomi ochronę, korzysta z Androida do ograniczenia dostępnych zadań.

Źródła: [konfiguracja aplikacji](../app/build.gradle.kts), [manifest](../app/src/main/AndroidManifest.xml), [PolicyEngine.kt](../app/src/main/java/pl/adriantur/stanowisko/PolicyEngine.kt).

**Profesor pyta: jaki praktyczny problem uzasadnia taką konstrukcję?**

Zwykły tablet daje użytkownikowi dostęp do wielu aplikacji, ustawień i systemowego pulpitu. Stanowisko pozwala przygotować urządzenie do konkretnego zadania: prezentacji strony, pracy z wybranym programem albo przełączania się między kilkoma dozwolonymi narzędziami. Przykłady zastosowań to kiosk informacyjny, stanowisko laboratoryjne czy tablet pokazujący panel organizacji. Są to przykłady wynikające z możliwości aplikacji, a nie zaszyte w kodzie branżowe przeznaczenie.

Administrator wybiera pakiety i tryby pracy, a użytkownik końcowy korzysta z przygotowanego pulpitu. Administrator i użytkownik nie są tu kontami w bazie. Rozróżnia ich chwilowa autoryzacja PIN-em wewnątrz tej samej aplikacji i tego samego użytkownika Androida.

**Profesor pyta: czy wystarczy narysować pulpit i schować przycisk Wstecz?**

Nie. Sam interfejs może utrudnić wyjście, ale uprawnienia do uruchamiania zadań nadal należą do systemu. Stanowisko ustawia listę pakietów przez `DevicePolicyManager`, a następnie sprawdza, czy urządzenie weszło w `LOCK_TASK_MODE_LOCKED`. Android odróżnia ten stan od `LOCK_TASK_MODE_PINNED`, czyli przypięcia ekranu. Te mechanizmy mają inne warunki opuszczenia. Opis platformy: [Lock task mode](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode).

## Zakres funkcji

**Profesor pyta: co administrator naprawdę może skonfigurować?**

| Obszar | Zachowanie obecnej implementacji |
| --- | --- |
| Lista aplikacji | Wybór spośród pakietów posiadających aktywność LAUNCHER; Stanowisko dodaje własny pakiet automatycznie do polityki |
| Tryb aplikacji | Osobno dla każdego pakietu: wiele aplikacji albo sesja jednej aplikacji |
| Uprawnienia | Przyznanie lub jawna odmowa zadeklarowanych uprawnień typu dangerous, w granicach dopuszczonych przez Androida |
| Strona | Tytuł, URL, dodatkowe dozwolone origins, JavaScript, tryb jednej lub wielu aplikacji |
| Ekran | Niewygaszanie i ukrywanie pasków systemowych podczas ochrony |
| Administracja | PIN, wyjście serwisowe, restart urządzenia i podgląd lokalnego dziennika |
| Sterowanie nad aplikacjami | Przesuwane menu powrotu do pulpitu i autoryzacji administratora |

Źródła: [WorkspaceScreen.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceScreen.kt), [WebsiteSettings.kt](../app/src/main/java/pl/adriantur/stanowisko/WebsiteSettings.kt), [AppPermissions.kt](../app/src/main/java/pl/adriantur/stanowisko/AppPermissions.kt).

**Profesor pyta: czym różnią się dwa tryby pracy?**

W trybie wielu aplikacji użytkownik może wracać do pulpitu Stanowiska i otwierać inne dozwolone aplikacje. Stan chronionej pracy pozostaje aktywny. Gdy paski są ukryte, służy do tego ikona domu w nakładce.

Sesja jednej aplikacji dodatkowo zawęża politykę do własnego pakietu Stanowiska oraz wybranej aplikacji. Dla strony internetowej pozostaje tylko własny pakiet, bo `WebActivity` jest jego częścią. W preferences powstaje znacznik sesji. Zwykły powrót do pulpitu wymaga wtedy PIN-u; samo otwarcie `MainActivity` prowadzi do próby odtworzenia aktywnej sesji.

To rozróżnienie działa **dla poszczególnych aplikacji**, a nie jako jeden globalny przełącznik wszystkich kafelków. Na jednym pulpicie mogą leżeć aplikacja wielozadaniowa i aplikacja uruchamiająca sesję pojedynczą.

## Pochodzenie i historia

**Profesor pyta: skąd pochodzi projekt i czy jest aplikacją webową?**

Lokalne metadane Git wskazują `origin` na `https://github.com/Shreider/tablet_app_web.git`, a bieżącą gałęzią jest `android`. README rozróżnia gałąź `android` z aplikacją natywną i `main` z aplikacją webową. W tym katalogu analizujemy wyłącznie zawartość gałęzi Android; nie ma tutaj źródeł backendu ani frontendu tamtej aplikacji.

WebView może wyświetlić usługę dostępną pod skonfigurowanym adresem, ale samo Stanowisko nie definiuje jej API, modelu danych ani logowania. Nie znaleziono w tym drzewie klienta Retrofit, serwera HTTP, kont użytkowników, synchronizacji z centralą ani połączenia z bazą w chmurze. Uwierzytelnienie strony pozostaje sprawą strony i jej serwera.

Źródło deklaracji podziału: [README projektu](../README.md). Pochodzenie lokalnej kopii można odtworzyć poleceniami `git remote -v` i `git branch --show-current`.

**Profesor pyta: co historia pozwala powiedzieć o rozwoju?**

Lokalna historia zawiera pięć commitów, wszystkie z 10 października 2026 r.:

| Commit | Treść zmiany wynikająca z historii |
| --- | --- |
| `47cc5b3` | Początkowy import Stanowiska 1.0.9, konfiguracji i instalatora Linux |
| `966e240` | Zachowanie wejścia skryptu podczas odczytów ADB |
| `ee599d1` | Przygotowanie roli właściciela urządzenia w instalatorze |
| `54a0e02` | Instalator Windows z konfiguracją właściciela |
| `bb7dd3c` | Obsługa znacznika UTF-8 BOM w komendzie instalacji Windows |

Pierwszy commit już zawiera rozwiniętą aplikację i schematy Room 1, 2 oraz 3. To ważne: dostępna historia nie pokazuje całej drogi od pierwszego prototypu. Numerów starszych wersji produktu, autorstwa poszczególnych pomysłów ani powodów wyboru wszystkich bibliotek nie da się uczciwie odtworzyć z samego numeru `1.0.9`.

**Profesor pyta: skąd wiadomo, dlaczego zastosowano konkretne podejście?**

Część przyczyn jest zapisana w komentarzach. Przykładowo silnik zapisuje poprzedni stan launcherów przed ich ukryciem, aby móc je przywrócić również po restarcie. `serviceExit()` najpierw utrwala wyłączenie polityki, żeby ponowne uruchomienie nie przywróciło ograniczeń. `PinStore` ustawia PIN domyślny tylko przy braku poświadczenia.

Dla innych wyborów przedstawiamy **uzasadnienie inżynierskie**: jakie właściwości daje Compose, dlaczego Room pomaga przy migracjach, jaki koszt ma brak rozdzielonych modułów. Taka analiza tłumaczy sens rozwiązania, ale nie udaje relacji z rozmowy z autorem. Porównania znajdują się w [rozdziale 8](08-decyzje-i-ograniczenia.md).

## Wymagania i granice produktu

**Profesor pyta: czego potrzebuje uruchomienie?**

Aplikacja ma `minSdk = 34`, czyli Android 14, i celuje w API 36. Pełna ochrona wymaga roli Device Owner, zezwolenia na wyświetlanie nad innymi aplikacjami, zapisanej polityki i przygotowanych uprawnień wybranych programów. Strona wymaga ponadto działającego systemowego WebView i dostępu do swojego serwera. Sam lokalny pulpit i jego baza nie potrzebują serwera Stanowiska.

**Profesor pyta: co oznacza „lokalna aplikacja”, skoro używa internetu?**

Logika konfiguracji, PIN i dziennik są lokalne. Internet jest potrzebny do pobrania zależności podczas pierwszego budowania, pobrania APK przez instalator i otwierania skonfigurowanej strony. Dostępność konkretnej strony bez sieci zależy od niej i zachowania WebView; projekt nie implementuje własnego mechanizmu offline dla treści WWW.

**Profesor pyta: jakie zdanie najlepiej przedstawia projekt na obronie?**

„Stanowisko to lokalnie zarządzany launcher i kontroler polityk Androida, który udostępnia wybrane aplikacje oraz stronę WWW, rozdziela zapis konfiguracji od jej zastosowania i używa systemowego Lock Task do ograniczania pracy urządzenia”.

To zdanie nazywa odpowiedzialności i mechanizm. Pozostałe rozdziały pokazują dokładnie, gdzie i pod jakimi warunkami każda jego część jest prawdziwa.
