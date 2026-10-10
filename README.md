# Stanowisko

Aplikacja Android do zarządzania pulpitem, dozwolonymi aplikacjami i ochroną urządzenia. Obsługuje Androida 14 i nowszego oraz interfejsy telefonów i tabletów. Cały interfejs jest po polsku.

Administrator wybiera aplikacje, ich uprawnienia i tryb działania: **Tryb wielu aplikacji** albo **Sesja jednej aplikacji**. Wbudowana strona internetowa obsługuje HTTP i HTTPS oraz te same tryby. Pływające menu zapewnia dostęp do pulpitu i panelu administratora. Ustawienia obejmują niewygaszanie ekranu i ukrywanie pasków systemowych; pulpit pokazuje datę, godzinę i baterię.

Świeża instalacja ma PIN administratora **1111**. Po zmianie PIN-u aktualizacje go zachowują. Pełna ochrona wymaga przygotowania urządzenia jako Device Owner i zastosowania polityki; samo zainstalowanie APK nie włącza pełnej ochrony. W sesji jednej aplikacji powrót do pulpitu wymaga PIN-u administratora. Wyłączenie ochrony jest osobną czynnością w panelu.

## Instalacja z terminala Linuksa

Podłącz jedno urządzenie przez USB. Włącz debugowanie USB i zatwierdź zgodę dla tego komputera. Uruchom:

```bash
curl -fsSL https://raw.githubusercontent.com/Shreider/tablet_app_web/android/install.sh | bash
```

Instalator pobiera gotowy APK z wydania `android-v1.0.9`, sprawdza SHA-256 i wykonuje aktualizację z zachowaniem danych. Następnie sprawdza rolę właściciela urządzenia (Device Owner). Jeśli Stanowisko już ją ma, zachowuje konfigurację. Jeśli urządzenie nie ma właściciela, pyta w terminalu o zgodę na nadanie tej roli. Po odpowiedzi `t` wykonuje konfigurację przez ADB i potwierdza jej wynik. Nadanie roli nie włącza samo ochrony: w panelu administratora trzeba wybrać aplikacje, zapisać i zastosować politykę.

Wymagany jest Android 14+ oraz jedno dostępne urządzenie. Instalator korzysta z istniejącego ADB; jeśli go brakuje, może pobrać oficjalne [Android Platform-Tools](https://developer.android.com/tools/releases/platform-tools) dla Linuksa x86_64 po akceptacji licencji. Potrzebne są Bash, curl i standardowe narzędzia systemowe; do rozpakowania ADB także unzip lub Python 3.

Skrypt nie resetuje urządzenia, nie odinstalowuje poprzedniej aplikacji ani nie usuwa kont lub profili. Przy innym administratorze zatrzymuje się przed instalacją. Błąd autoryzacji USB, wiele urządzeń, niezgodna suma lub błąd instalacji również zatrzymują procedurę. Jeśli Android odrzuci nadanie roli właściciela, instalator pokazuje przyczynę i kończy się błędem; zainstalowany APK pozostaje na urządzeniu. Przygotuj nowy tablet bez kont Google i dodatkowych profili. Android decyduje, czy można nadać tę rolę przez ADB — [warunki konfiguracji](https://developer.android.com/work/dpc/dedicated-devices/cookbook#development-setup).

Odpowiedź `n` pomija nadanie roli. Bez interaktywnego terminala instalator nie nadaje jej i zgłasza, że konfiguracja jest niepełna. Zwykłe włączenie administratora w ustawieniach Androida nie zastępuje roli właściciela. Konfiguracja przez kod QR w kreatorze pierwszego uruchomienia nie jest jeszcze obsługiwana.

Możesz też pobrać [APK i sumę kontrolną](https://github.com/Shreider/tablet_app_web/releases/tag/android-v1.0.9) i zainstalować aplikację ręcznie.

## Budowanie

Otwórz katalog projektu w Android Studio. Wskaż lokalny SDK w `local.properties` i wybierz JDK 25 dla Gradle. Projekt używa Gradle 9.1.0, Android Gradle Plugin 9.0.1 oraz SDK 36; minimalny API aplikacji to 34.

Z katalogu projektu, przy ustawionym `JAVA_HOME`:

```bash
./gradlew :app:assembleDebug
```

APK powstaje w `app/build/outputs/apk/debug/app-debug.apk`. Wariant release budujesz przez `./gradlew :app:assembleRelease`; do instalacji wymaga podpisania własnym kluczem.

APK w wydaniu 1.0.9 ma dotychczasowy podpis debug i oznaczenie `testOnly`, zgodne z istniejącą instalacją rozwojową. Instalator używa `install -r -t`. Klucze podpisu, lokalne ustawienia SDK i dane urządzeń nie są częścią repozytorium.

Gałąź `android` zawiera aplikację, konfigurację budowania i instalator. Aplikacja webowa znajduje się w gałęzi `main`.
