# Stanowisko — projekt wyjaśniony przez profesora

Stanowisko zamienia urządzenie z Androidem w kontrolowany pulpit do uruchamiania wybranych aplikacji i strony internetowej. Ograniczenia egzekwuje system Android przez Device Owner i Lock Task. PIN pozwala administratorowi zmieniać konfigurację i kończyć sesje jednej aplikacji.

To podręcznik do kodu w `/home/atur/Desktop/MYAPP`, gałąź `android`, commit `bb7dd3c`, wersja aplikacji `1.0.9` (`versionCode = 11`). Stan opisano i sprawdzono 6 listopada 2026 r. Rozmowę prowadzi profesor, który sam zadaje pytania, rozbiera mechanizmy na części i odpowiada także na pytanie „dlaczego tak”.

**Czytaj w przeglądarce:** [pełny przewodnik HTML](PRZEWODNIK.html). Działa lokalnie, bez pobierania bibliotek, ma spis treści, wyszukiwanie rozdziałów i widok do druku. Pliki poniżej są edytowalnym źródłem dokumentacji.

**Do czytania i drukowania:** [pełny przewodnik PDF](PRZEWODNIK.pdf).

## Kolejność wykładów

| Rozdział | Co wyjaśnia |
| --- | --- |
| [1. Cel i pochodzenie](01-cel-i-pochodzenie.md) | Co to za aplikacja, skąd pochodzi kod, dla kogo ma sens i czego nie obejmuje |
| [2. Architektura i pliki](02-architektura-i-pliki.md) | Wszystkie własne pliki Kotlin, zasoby, konfiguracja i zależności między częściami |
| [3. Dane i stan](03-dane-i-stan.md) | Room, migracje, SharedPreferences, Flow, rewizje i spójność |
| [4. Egzekwowanie polityki](04-polityka-i-przebiegi.md) | Zapis, zastosowanie, sesje, przywracanie po restarcie i wyjście serwisowe |
| [5. PIN i uprawnienia](05-pin-i-uprawnienia.md) | Kryptografia, autoryzacja, czas dostępu administratora i decyzje o uprawnieniach aplikacji |
| [6. Pulpit i strona](06-interfejs-nakladka-i-web.md) | Compose, cykl życia, pływające menu, WebView i granice filtrowania adresów |
| [7. Budowanie i instalacja](07-budowanie-i-instalacja.md) | Wersje narzędzi, zależności Gradle, APK, podpisy, Linux i Windows |
| [8. Decyzje i ograniczenia](08-decyzje-i-ograniczenia.md) | Dlaczego takie podejścia, realne alternatywy, ryzyka i kierunki rozwoju |
| [9. Obsługa i nauka](09-obsluga-diagnostyka-i-nauka.md) | Procedury, diagnoza problemów, scenariusze testów, ćwiczenia i pytania na obronę |
| [10. Źródła i weryfikacja](10-zrodla-i-weryfikacja.md) | Pochodzenie twierdzeń, wyniki kontroli, słownik i aktualizowanie podręcznika |
| [11. Scenariusz prezentacji](11-scenariusz-prezentacji.md) | Co mówić do wszystkich 47 slajdów Adrian_Tur_1.pptx, krótkie warianty, przejścia, demonstracja i pytania profesora |

Do wystąpienia korzystaj z [osobnego scenariusza HTML](SCENARIUSZ_PREZENTACJI.html), [scenariusza PDF](SCENARIUSZ_PREZENTACJI.pdf), [krótkiej ściągi PDF](SCIAGA_PREZENTACJI.pdf) lub [kopii prezentacji z notatkami prelegenta](Adrian_Tur_1_z_notatkami.pptx).

## Trzy zasady czytania

**Fakt z implementacji** oznacza zachowanie wynikające z konkretnego kodu. Odnośniki prowadzą do plików w tym repozytorium.

**Uzasadnienie inżynierskie** wyjaśnia sens rozwiązania i jego kompromisy. Jeśli historia nie zapisuje motywacji autora, nie przypisujemy mu takich intencji. Rozdział 8 porównuje implementację z alternatywami właśnie w tym znaczeniu.

**Wynik sprawdzenia** dotyczy tylko wskazanej próby. Udana kompilacja nie dowodzi szczelności kiosku na rzeczywistym tablecie. Stan kontroli i zakres wymagający urządzenia znajdują się w rozdziale 10.

## Ścieżki dla różnych czytelników

- **Chcę zrozumieć pomysł:** rozdziały 1, 4 i 8.
- **Chcę czytać i zmieniać kod:** rozdziały 2–7, potem ćwiczenia w 9.
- **Chcę uruchomić tablet:** rozdziały 7 i 9, z uwzględnieniem granic z 8.
- **Chcę przedstawić projekt na zajęciach:** rozdział 11 dopasowany do prezentacji, następnie rozdział 1, diagramy, przykład rewizji w 3 i pytania na obronę w 9.

Najważniejsza zależność całego projektu brzmi: **instalacja APK → nadanie Device Owner → przygotowanie uprawnień i nakładki → zapis konfiguracji → zastosowanie polityki → chroniona praca**. Każda strzałka oznacza osobny krok, z osobnymi warunkami i możliwymi błędami.
