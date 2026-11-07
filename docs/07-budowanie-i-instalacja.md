# 7. Budowanie, zależności i instalacja

## Łańcuch narzędzi

**Profesor pyta: co robi każde narzędzie i jakie wersje ma ten projekt?**

| Element | Wersja lub ustawienie | Zadanie |
| --- | --- | --- |
| Gradle Wrapper | 9.1.0 | Uruchamia zadania budowania w przewidywalnej wersji |
| Android Gradle Plugin | 9.0.1 | Zna warianty Androida, manifest, zasoby, DEX i APK |
| Kotlin w AGP | Wbudowana obsługa; runtime rozwiązuje stdlib 2.2.10 | Kompilacja kodu Kotlin i biblioteka standardowa |
| Compose compiler plugin | 2.2.10 | Obsługa kompilacji funkcji `@Composable` |
| KSP | 2.3.4 | Uruchamia procesor symboli generujący kod Room |
| `compileSdk` | 36 | API dostępne podczas kompilowania |
| `targetSdk` | 36 | Docelowy zestaw zachowań platformy |
| `minSdk` | 34 | Najstarszy dopuszczony system instalacji |
| Java source/target i Kotlin jvmTarget | 17 | Docelowy poziom kodu JVM przed konwersją do DEX |
| JDK użyty do kontroli | JetBrains Runtime 25.0.4 | JVM uruchamiająca Gradle w tym środowisku |

Źródła wersji: [główny build.gradle.kts](../build.gradle.kts), [moduł aplikacji](../app/build.gradle.kts), [wrapper](../gradle/wrapper/gradle-wrapper.properties).

**Profesor pyta: dlaczego nie ma pluginu org.jetbrains.kotlin.android?**

AGP 9.0 włącza obsługę Kotlin bezpośrednio. Brak tego pluginu nie jest tu pominięciem języka. Nie należy automatycznie dodawać go według starszego szablonu, bo może kolidować z nowym mechanizmem. Źródło: [migracja do Kotlin wbudowanego w AGP](https://developer.android.com/build/migrate-to-built-in-kotlin).

**Profesor pyta: czy Java 17 i JDK 25 nie są sprzeczne?**

Nie. Jedno to poziom kompilowanego kodu, drugie to JVM uruchamiająca narzędzia. Projekt ustawia target 17, a lokalne README zaleca JDK 25 dla Gradle. AGP 9.0 podaje JDK 17 jako minimum, Gradle 9.1.0 i Build Tools 36.0.0 jako zgodny zestaw. Gradle 9.1 dodał obsługę Java 25. W tej kontroli rzeczywiście użyto JBR 25.0.4. Źródła: [zgodność AGP 9.0](https://developer.android.com/build/releases/agp-9-0-0-release-notes), [Gradle 9.1](https://docs.gradle.org/9.1.0/release-notes.html).

## Biblioteki aplikacji

**Profesor pyta: za co odpowiada każda bezpośrednia zależność?**

| Deklaracja | Wersja | Rola w tym kodzie |
| --- | --- | --- |
| `androidx.compose:compose-bom` | 2025.12.00 | Zestaw zgodnych ograniczeń wersji bibliotek Compose |
| `androidx.compose.material3:material3` | Z BOM; rozwiązane 1.4.0 | Formularze, przyciski, dialogi, kolory i motyw |
| `androidx.activity:activity-compose` | 1.12.2 | `setContent`, integracja Activity i Compose, obsługa Wstecz |
| `lifecycle-viewmodel-compose` | 2.10.0 | Zależności ViewModel dla integracji z Compose |
| `lifecycle-runtime-compose` | 2.10.0 | Lifecycle w Compose, zbieranie stanu zgodne z cyklem życia |
| `room-runtime` | 2.8.4 | Baza, encje i DAO |
| `room-ktx` | 2.8.4 | API Room dla korutyn i strumieni |
| `room-compiler` przez `ksp` | 2.8.4 | Generowanie implementacji bazy i DAO podczas budowania |
| `kotlinx-coroutines-android` | 1.10.2 | Zadania, Flow, mutexy i Android Main dispatcher |

BOM nie jest silnikiem wykonującym UI. Zarządza wersjami, a biblioteki faktycznie trafiają do grafu przez zależności. Przykładowo rozwiązany graf debug obejmuje Compose UI 1.10.0 i Kotlin stdlib 2.2.10. `room-compiler` jest procesorem budowania, a nie biblioteką potrzebną do generowania DAO na tablecie.

Repozytoria pluginów to Google, Maven Central i Gradle Plugin Portal; biblioteki modułów pochodzą z Google i Maven Central. `FAIL_ON_PROJECT_REPOS` zabrania dopisywania dowolnego repozytorium wewnątrz modułu. Nie ma katalogu wersji `libs.versions.toml`, dependency lockfile ani konfiguracji weryfikacji wszystkich artefaktów. Wrapper i instalatory mają własne sumy SHA-256, ale nie oznacza to kontroli sum każdej biblioteki Maven.

## Przebieg budowania

**Profesor pyta: co powstaje między plikiem kt a APK?**

```text
Gradle i pluginy
    ↓ konfiguracja wariantu debug
manifest + zasoby XML → scalanie i przetwarzanie zasobów
Kotlin + encje Room → KSP → wygenerowana implementacja bazy i DAO
    ↓ kompilacja Kotlin z pluginem Compose
klasy JVM + biblioteki
    ↓ D8 / przetwarzanie DEX
kod Androida + zasoby + manifest
    ↓ pakowanie i podpis debug
app/build/outputs/apk/debug/app-debug.apk
```

Zależności między zadaniami ustala Gradle. To diagram logiczny, nie obietnica, że wszystkie zadania wykonają się dokładnie sekwencyjnie. Kod wygenerowany przez Room znajduje się w `app/build/generated/ksp/...`; poprawiamy encje i DAO, a nie wygenerowane implementacje.

**Profesor pyta: jak zbudować projekt na tym komputerze?**

W katalogu `/home/atur/Desktop/MYAPP` istnieje lokalny SDK `/home/atur/Android/Sdk`, z platformą 36 i Build Tools 36.0.0. `java` nie jest domyślnie dostępna w PATH tej powłoki, ale Android Studio dostarcza JBR. Sprawdzona komenda:

```bash
cd /home/atur/Desktop/MYAPP
JAVA_HOME=/home/atur/.local/share/android-studio/jbr \
  ./gradlew :app:assembleDebug :app:lintDebug --console=plain
```

Na innym komputerze ścieżka JDK i SDK będzie inna. `local.properties` ma zawierać właściwe `sdk.dir=...`; nie należy publikować lokalnych ścieżek jako wspólnej konfiguracji repozytorium. Pierwsze budowanie może potrzebować sieci do pobrania Gradle i bibliotek.

Do analizy grafu:

```bash
./gradlew :app:dependencies --configuration debugRuntimeClasspath
```

Do release:

```bash
./gradlew :app:assembleRelease
```

W kodzie nie ma własnej konfiguracji podpisu release. Samo zbudowanie tego wariantu nie tworzy kompletnej procedury produkcyjnej dystrybucji. W tej dokumentacji potwierdzono budowanie debug; nie przeprowadzono publikacji ani instalacji release.

## Instalator Linux

**Profesor pyta: czy install.sh kompiluje lokalny projekt?**

Nie. [install.sh](../install.sh) pobiera gotowy `Stanowisko-1.0.9.apk` z wydania `android-v1.0.9`. Zmiana lokalnego Kotlinu i uruchomienie tego skryptu nie zainstaluje lokalnej zmiany. Do tego potrzebne są lokalne budowanie i świadome wybranie powstałego APK.

Instalator używa `set -euo pipefail`, tymczasowego katalogu i sprzątania przez `trap`. Pobiera wyłącznie po HTTPS, z limitami czasu i prób. Sprawdza wbudowaną sumę APK oraz, jeśli pobiera ADB, sumę archiwum Platform-Tools 36.0.2 dla Linuksa x86_64.

ADB szuka kolejno w PATH, wskazanym SDK i cache. Pobranie narzędzi wymaga akceptacji warunków. Cache można wskazać `STANOWISKO_CACHE_DIR`. Sam skrypt nie instaluje Android Studio.

**Profesor pyta: jak chroni się przed pomyleniem tabletów?**

Wymaga dokładnie jednego wpisu urządzenia w `adb devices`, stanu `device`, API co najmniej 34, producenta i modelu. Dla serialu `emulator-*` dodatkowo sprawdza `ro.kernel.qemu`. Zachowuje serial, a po pobraniu ponownie kontroluje połączenie, model, producenta i właściciela.

To kontrola operacyjna urządzenia wskazanego przez ADB, nie kryptograficzna atestacja jego tożsamości. Skrypt nie wymusza, aby serial oznaczał fizyczne USB; wymaganie USB w README jest instrukcją organizacyjną, podczas gdy logika bazuje na liście ADB.

**Profesor pyta: kiedy następuje instalacja i nadanie właściciela?**

Najpierw sprawdzenie aktualnego właściciela, pobranie APK, suma i powtórne kontrole. Potem `adb -s SERIAL install -r -t APK` i wymóg potwierdzenia `Success`. `-r` oznacza aktualizację z zachowaniem danych, jeśli system akceptuje zgodność pakietu i podpisu; `-t` dopuszcza pakiet testowy.

Jeśli Stanowisko jest już właścicielem, konfiguracja pozostaje. Inny właściciel albo nierozpoznany stan zatrzymuje procedurę. Brak właściciela prowadzi do pytania `t/N`; po zgodzie wykonywane jest `dpm set-device-owner --user 0 ...`, a wynik zostaje ponownie odczytany. Odmowa pozostawia zainstalowaną aplikację bez pełnej ochrony.

Wejście z `/dev/tty`, `shell -n` i przekierowanie standardowego wejścia dla ADB zapobiegają konfliktowi z uruchamianiem skryptu przez potok. Brak interaktywnego terminala na etapie nadania roli kończy się informacją o niepełnej konfiguracji, a nie domyślną zgodą.

## Instalator Windows

**Profesor pyta: co jest inne w PowerShell?**

[install.ps1](../install.ps1) implementuje ten sam przebieg, lecz używa .NET i mechanizmów Windows. Wymaga PowerShell 5.1 lub nowszego i platformy Win32NT. Szuka `adb.exe`, korzysta z SDK albo `%LOCALAPPDATA%\Stanowisko`, ewentualnie pobiera oficjalne archiwum Windows 36.0.2. Sprawdza obecność `adb.exe`, `AdbWinApi.dll` i `AdbWinUsbApi.dll`.

`Invoke-Adb` uruchamia proces bez powłoki, zamyka stdin, czyta stdout i stderr asynchronicznie i nakłada timeout: standardowo 30 sekund, dla instalacji 180. Osobna funkcja cytuje argumenty Windows. Blok `finally` usuwa katalog roboczy i przywraca poprzednie ustawienia TLS oraz preferencje PowerShell.

Komenda z README usuwa początkowy BOM przez `.TrimStart([char]0xfeff)` przed zbudowaniem scriptblocku. To zmiana odpowiadająca ostatniemu commitowi. Nie jest to zmiana kodowania APK ani reset systemowych zasad wykonywania skryptów.

## Podpis i przygotowanie właściciela

**Profesor pyta: dlaczego aktualizacja może zostać odrzucona mimo tej samej nazwy?**

Android weryfikuje pakiet i podpis. Lokalny debug może użyć innego klucza niż opublikowane wydanie rozwojowe. SHA-256 pliku APK sprawdza integralność pobranego pliku, ale nie zastępuje zgodności certyfikatu aktualizacji. Nie należy usuwać istniejącej aplikacji tylko po to, by ominąć ten błąd: usunięcie może oznaczać utratę danych i nie jest częścią instalatora.

Manifest debug ma `testOnly=true`. README deklaruje taki charakter publikowanego APK 1.0.9 i dotychczasowy podpis debug. Własny trwały klucz release i kontrolowana dystrybucja wymagają odrębnego przygotowania. Klucze i ustawienia podpisu są wykluczone z Git.

**Profesor pyta: czy Device Owner można nadać na każdym używanym tablecie?**

Nie. Android stawia warunki przygotowania urządzenia; konta, profile i istniejące zarządzanie mogą uniemożliwić tę operację. Instalator nie resetuje urządzenia, nie usuwa kont i nie rozwiązuje za użytkownika konfliktów zarządzania. Rola nie jest nadawana samym włączeniem klasycznego administratora w ustawieniach. Projekt nie implementuje provisioningu przez QR. Źródło platformowe: [przygotowanie urządzeń dedykowanych](https://developer.android.com/work/dpc/dedicated-devices/cookbook#development-setup).
