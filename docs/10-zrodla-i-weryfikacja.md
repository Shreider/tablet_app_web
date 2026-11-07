# 10. Źródła, weryfikacja i słownik

## Podstawa opisu

**Profesor pyta: na czym opierają się twierdzenia tego podręcznika?**

Na kodzie i konfiguracji w `/home/atur/Desktop/MYAPP`, gałąź `android`, HEAD `bb7dd3cf5de9124162a05444844600cced8a0a40`. Opisanym wydaniem jest `versionName=1.0.9`, `versionCode=11`. Analiza obejmuje wszystkie 26 własnych plików Kotlin, oba manifesty, zasoby, trzy schematy bazy, konfigurację Gradle i oba instalatory.

Odnośniki do plików w rozdziałach wskazują dowody implementacyjne. Uzasadnienia i propozycje rozwoju są nazwane jako analiza inżynierska. Historia Git pozwala ustalić pochodzenie lokalnej kopii i pięć zmian opisanych w rozdziale 1, ale nie pełną historię powstania pomysłu.

## Wyniki kontroli lokalnych

**Profesor pyta: co faktycznie uruchomiono 6 listopada 2026 roku?**

| Kontrola | Wynik | Co potwierdza |
| --- | --- | --- |
| `:app:assembleDebug` i `:app:lintDebug` | `BUILD SUCCESSFUL`, 47 wykonanych zadań, 1 min 6 s | Aktualny kod daje zbudować debug APK w opisanym środowisku; lint ukończony |
| Raport lint XML | 0 błędów, 28 ostrzeżeń | Zakres statycznej analizy debug, bez usunięcia wskazanych ostrzeżeń |
| Graf `debugRuntimeClasspath` | Odczyt zakończony sukcesem | Faktycznie rozwiązane m.in. Kotlin stdlib 2.2.10, Material3 1.4.0, Compose UI 1.10.0 |
| `bash -n install.sh` | Sukces | Poprawność składni Bash, bez wykonywania instalacji |
| Metadane APK przez `aapt2` | Pakiet `pl.adriantur.stanowisko`, wersja 11/1.0.9, min 34, target 36 | Zawartość zbudowanego artefaktu odpowiada konfiguracji |
| `apksigner verify --print-certs` | Podpis zweryfikowany, certyfikat `CN=Android Debug` | Integralność podpisu lokalnego APK; nie zgodność z podpisem pobranego wydania |
| Próby na skompilowanych klasach | 62 sprawdzenia zakończone sukcesem | Opisane niżej kontrakty czystej logiki |
| Kontrola wektora PBKDF2 niezależnym narzędziem | Wyniki zgodne | Zgodność jednego przykładu wyliczenia SHA-256/PBKDF2 |
| Dokumentacja w przeglądarce Firefox | Sprawdzone wyszukiwanie, brak wyników, reset i przejścia do rozdziałów | Zachowanie nawigacji HTML i 3 osadzone SVG |
| Układ HTML i druk | Podgląd szeroki 1440 px, wąski 500 px, eksport A4 | Brak poziomego przewijania całej strony w tych widokach; pełna treść w PDF |
| Scenariusz Adrian_Tur_1.pptx | 47 kolejnych slajdów; pełna i krótka wypowiedź, przejście oraz pytanie z odpowiedzią do każdego | Pokrycie prezentacji i zgodność numeracji z kolejnością PPTX |
| Kopia PPTX z notatkami | Zmieniono tylko 47 plików notesSlide; pozostałe 170 elementów archiwum są identyczne bajtowo | Zachowane slajdy i pierwotne notatki, oryginalny plik bez zmian; kontrola struktury XML, bez uruchamiania PowerPoint |

Środowisko: Linux, JetBrains Runtime 25.0.4 z lokalnego Android Studio, SDK `/home/atur/Android/Sdk`, platforma 36, Build Tools 36.0.0 i wrapper Gradle 9.1.0. Wynik APK: `app/build/outputs/apk/debug/app-debug.apk`, 28 932 234 bajty. Raporty narzędzia pozostają w ignorowanym przez Git katalogu `app/build/reports/`.

Lint zgłosił 16 sugestii `UseKtx`, 3 ostrzeżenia `ApplySharedPref` i 9 informacji o nowszych wersjach zależności lub narzędzi. Kompilator dodatkowo zgłosił dwa użycia przestarzałego API `PermissionInfo` w `AppPermissions.kt`. Pakowanie pozostawiło bibliotekę `libandroidx.graphics.path.so` bez usunięcia symboli. Ostrzeżenia nie zatrzymały budowania; dokumentacja nie aktualizowała bibliotek ani nie zmieniała logiki aplikacji.

**Profesor pyta: co obejmowały 62 sprawdzenia?**

Próby wykonały metody rzeczywiście skompilowanych klas z debug `classes.jar`, z Kotlin stdlib i wygenerowanymi identyfikatorami zasobów. Obejmowały format PIN-u, progi opóźnień, długość pochodnej i czyszczenie tablicy znaków, normalizację origin i błędne URL, zgodę na ścieżki w tym samym origin, odrzucenie obcego schematu/portu/hosta, walidację konfiguracji WWW, pozycjonowanie panelu, walidację listy polityki i kolejność zależności uprawnień lokalizacji.

Przykład kontrolny: PIN `1234`, 32 bajty zerowej soli, 600 000 iteracji, 32 bajty wyniku dały hex `9492d8382d29215db911d4e94fcabff0da4bcda30553deba4512d24f7f2508b6`. Niezależne obliczenie przez Python `hashlib.pbkdf2_hmac` dało tę samą wartość. To **wektor testowy**, nie dane poświadczenia urządzenia. Tymczasowy program sprawdzający został usunięty po wykonaniu; nie dodano do produktu nowego frameworka testowego.

## Granice weryfikacji

**Profesor pyta: czego te wyniki nie dowodzą?**

Nie przeprowadzono w tym zadaniu instalacji ani zmian DPM na fizycznym urządzeniu. Nie potwierdzono na tablecie nadania właściciela od zera, zachowania OEM, odtwarzania po restarcie, szczelności pojedynczej sesji, ruchu WebView ani pracy nakładki. Wymagane próby sprzętowe są rozpisane w rozdziale 9.

W repozytorium nie ma katalogów `app/src/test` i `app/src/androidTest` ani deklaracji zależności testowych. Zadania lint zawierające nazwy AndroidTest/UnitTest nie oznaczają, że takie testy wykonano. README deklaruje wcześniejsze 46 testów instalatora w PowerShell 7 na Linuksie; ich źródła i powtarzalny zestaw nie znajdują się w analizowanym drzewie, więc ten wynik pozostaje informacją historyczną z README. Nie został odtworzony w tej analizie. Nie uruchomiono instalatora na Windows.

Nie pobierano publikowanego APK w celu dowiedzenia jego identyczności z lokalnym buildem. Instalatory wskazują konkretne wydanie i sumę, natomiast to nie dowodzi samo w sobie, że binarium zostało zbudowane z dokładnie tego commitu w kontrolowanym procesie. Nie ma tu konfiguracji CI ani udokumentowanego odtwarzalnego wydania bit po bicie. Nie znaleziono też pliku licencji, więc sam dostęp do repozytorium nie jest kompletną informacją o warunkach ponownego wykorzystania kodu.

## Źródła platformowe

**Profesor pyta: gdzie sprawdzać kontrakty Androida zamiast polegać na skrótach?**

| Źródło pierwotne | Do czego służy w tym opisie |
| --- | --- |
| [Android Lock task mode](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode) | Lista pakietów, LOCKED kontra przypięcie, start i zatrzymanie trybu |
| [Dedicated devices cookbook](https://developer.android.com/work/dpc/dedicated-devices/cookbook#development-setup) | Przygotowanie DPC i roli właściciela |
| [AGP 9.0 i 9.0.1](https://developer.android.com/build/releases/agp-9-0-0-release-notes) | Minimalne narzędzia, wbudowany Kotlin i zgodność |
| [Wbudowany Kotlin](https://developer.android.com/build/migrate-to-built-in-kotlin) | Brak potrzeby osobnego kotlin-android w AGP 9 |
| [Gradle 9.1 release notes](https://docs.gradle.org/9.1.0/release-notes.html) | Obsługa Java 25 przez tę wersję Gradle |
| [Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions) | Migracje i zachowanie danych |
| [Android Keystore](https://developer.android.com/privacy-and-security/keystore) | Charakter zarządzania kluczami i zależność od sprzętu |
| [WebViewClient](https://developer.android.com/reference/android/webkit/WebViewClient) | Semantyka callbacków, POST i ograniczenia przekierowań |
| [DevicePolicyManager](https://developer.android.com/reference/android/app/admin/DevicePolicyManager) | Warunki i ograniczenia operacji zarządzania, w tym uprawnień |

Źródła sprawdzono przy opracowaniu 6 listopada 2026 r. Ustalenia o tym, **co wywołuje aplikacja**, wynikają z lokalnego kodu; strona platformowa opisuje kontrakt API i nie jest dowodem wykonania go na danym tablecie.

## Słownik

**Profesor pyta: które pojęcia muszą być precyzyjne?**

| Pojęcie | Znaczenie w projekcie |
| --- | --- |
| APK | Pakiet instalacyjny aplikacji Android |
| ADB | Narzędzie komunikacji komputera z urządzeniem lub emulatorem |
| Device Owner | Systemowa rola właściciela zarządzanego urządzenia; nie PIN użytkownika |
| DPC | Device Policy Controller, aplikacja sterująca politykami |
| DPM | DevicePolicyManager, API Androida do tych polityk |
| Lock Task | Systemowe ograniczenie dostępnych zadań do listy pakietów |
| Launcher i HOME | Interfejs uruchamiania aplikacji i rola pulpitu Androida |
| Activity | Ekran lub komponent interakcji Androida |
| Task | Stos aktywności; nie to samo co proces i nie to samo co pakiet |
| Foreground service | Usługa zgłoszona systemowi z widocznym powiadomieniem |
| Overlay | Okno nad innymi aplikacjami, wymagające osobnej zgody |
| Origin | Schemat, host i efektywny port URL, bez ścieżki |
| Room i DAO | Warstwa nad SQLite i interfejs operacji na bazie |
| Flow i StateFlow | Strumień wartości i strumień bieżącego stanu |
| Coroutine | Zadanie asynchroniczne, które może zawieszać wykonanie |
| Mutex | Ochrona przed równoczesnym wykonywaniem chronionego fragmentu |
| PBKDF2 | Wyprowadzanie pochodnej z hasła/PIN-u, soli i liczby iteracji |
| AES-GCM | Szyfrowanie uwierzytelnione zapewniające poufność i kontrolę integralności |
| Keystore | Systemowy magazyn i mechanizm wykonywania operacji kluczem |
| BOM | Zestaw ograniczeń wersji bibliotek; nie własna biblioteka UI |
| KSP | Przetwarzanie symboli w czasie budowania, tutaj dla Room |
| Rewizja | Kolejny zapis konfiguracji, odrębny od numeru wydania aplikacji |

## Utrzymywanie dokumentacji

**Profesor pyta: co trzeba zmienić w podręczniku po zmianie kodu?**

Zaktualizuj commit i datę, a następnie rozdział odpowiadający zachowaniu. Nowa kolumna wymaga sprawdzenia modelu danych, migracji i wszystkich ścieżek zastosowania. Nowa zależność wymaga aktualizacji tabeli bezpośrednich bibliotek i odczytu rozwiązanej wersji. Zmiana polityki WWW wymaga poprawienia przykładów origin i scenariuszy nawigacji. Zmiana instalatora wymaga ponownego sprawdzenia jego warunków oraz zgodności Linux/Windows.

Wersja HTML jest pochodną Markdown. [generuj_przewodnik.py](generuj_przewodnik.py) łączy indeks i numerowane rozdziały, osadza SVG i dodaje wyszukiwanie oraz style. Tworzy też osobny scenariusz prezentacji i krótką ściągę z wariantów wypowiedzi w rozdziale 11. Używa wyłącznie biblioteki standardowej Pythona i lokalnego programu `markdown` (Discount). Nie jest zależnością aplikacji Android. Regeneracja z katalogu projektu:

```bash
python3 docs/generuj_przewodnik.py
```

Kopię prezentacji z wypowiedziami w notatkach prelegenta można odtworzyć z oryginalnego PPTX. Polecenie zapisuje osobny plik w `docs`, zachowując źródłową prezentację:

```bash
python3 docs/generuj_przewodnik.py --pptx /home/atur/Downloads/Adrian_Tur_1.pptx
```

Na tym komputerze Discount 3.0.0d jest dostępny jako `/usr/bin/markdown`. Sam plik wynikowy nie wymaga Pythona, Discount, serwera ani sieci. PDF jest eksportem odpowiedniego HTML; po zmianach odśwież `PRZEWODNIK.pdf`, `SCENARIUSZ_PREZENTACJI.pdf` i `SCIAGA_PREZENTACJI.pdf`, używając „Drukuj / PDF” w przeglądarce. Plik `SCIAGA_PREZENTACJI.md` również powstaje z generatora; poprawki wypowiedzi wprowadzaj w rozdziale 11. Diagramy SVG znajdują się w `docs/diagramy`; ich edycja nie wymaga zewnętrznej usługi. Przed przekazaniem kolejnej wersji sprawdź odnośniki, kompletność mapy plików i faktyczny wynik narzędzi, zamiast przenosić wcześniejszy raport jako aktualny.
