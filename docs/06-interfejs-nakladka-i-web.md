# 6. Interfejs użytkownika, nakładka i strona internetowa

## Compose i stan ekranu

**Profesor pyta: co decyduje, czy widzę pulpit, czy panel?**

`WorkspaceScreen` obserwuje politykę, listę aplikacji, uprawnienia, WWW, dziennik, komunikat i `busy`. Oprócz tego odczytuje bieżącą autoryzację i sesję. Jeśli nie ma sesji, PIN istnieje, a administrator nie jest autoryzowany, wyświetla `WorkspaceLauncher` i kończy budowanie reszty ekranu. W innych gałęziach pokazuje stan sesji, konfigurację początkową albo panel administratora.

Raz na sekundę, tylko przy stanie lifecycle RESUMED, zwiększa `tick`. Ponieważ `adminUntil` i runtime nie są wszędzie strumieniami, to wymusza ponowny odczyt autoryzacji i sesji. `generation` jest zwiększane także przy `onResume` i odtworzeniu. Stan administratora na ekranie nie jest zatem jedynie zatrzaśnięty w chwili otwarcia.

Źródła: [WorkspaceScreen.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceScreen.kt), [MainActivity.kt](../app/src/main/java/pl/adriantur/stanowisko/MainActivity.kt).

**Profesor pyta: co dzieje się z niezapisanym formularzem?**

Reguły, niewygaszanie i paski są lokalnym szkicem `remember(policy?.revision)`. Zmiana rewizji odtwarza szkic z zapisu. Formularz WWW używa `remember(savedPage)`. Nie są to pola `rememberSaveable` ani trwały zapis przy każdym dotknięciu. Rekreacja kompozycji i aktywności może spowodować utratę niezapisanych zmian. Informację o wykonanym zapisie daje dopiero ukończona operacja i jej komunikat.

**Profesor pyta: dlaczego komunikaty czasem znikają, a czasem zostają?**

`NoticeKind.INFORMATION` znika po czterech sekundach. `CONFIGURATION` i `ERROR` pozostają do zastąpienia albo wyczyszczenia przez kolejną operację. Wygaszanie używa `compareAndSet`, więc stare zadanie nie usuwa nowego komunikatu. Błędy mają semantykę `LiveRegionMode.Assertive`, pozostałe `Polite`, aby usługa dostępności mogła je ogłaszać.

Źródła: [WorkspaceViewModel.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceViewModel.kt), [WorkspaceNotice.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceNotice.kt), [VisualDesign.kt](../app/src/main/java/pl/adriantur/stanowisko/VisualDesign.kt).

## Układ, ikony i dane systemowe

**Profesor pyta: jak interfejs dostosowuje się do telefonu i tabletu?**

Launcher mierzy dostępną przestrzeń przez `BoxWithConstraints`. Szerokość co najmniej 600 dp oznacza układ szeroki, a wysokość poniżej 500 dp układ kompaktowy. W wąskim widoku są dwie kolumny; w szerokim ich liczba wynika z szerokości i mieści się w zakresie 2–4. Etykieta administratora jest dodawana od 420 dp. Rozmiary kafelków, ikon i odstępów zmieniają się razem z układem.

Panel administratora ma listę leniwą o maksymalnej szerokości 840 dp, uwzględnia bezpieczne obszary i klawiaturę. Motyw Compose jest ciemny, z turkusowym akcentem. Bazowy motyw XML ustawia także wygląd okna, zanim Compose narysuje treść.

**Profesor pyta: czy na pulpicie widzimy prawdziwe ikony aplikacji?**

W panelu listy aplikacji tak: ikonę pobiera PackageManager i konwertuje do bitmapy. Kafelki launchera używają własnych rysunków `WorkspaceGlyph`, dobranych przez fragmenty nazwy pakietu, np. `camera`, `clock`, `contacts`. Dla pozostałych używają ogólnej siatki. Nie ma tu automatycznej klasyfikacji znaczenia każdej zainstalowanej aplikacji.

Zegar odczytuje lokalny czas i strefę urządzenia, formatuje po polsku datę i sekundy. Bateria pochodzi z `ACTION_BATTERY_CHANGED`, w tym ze sticky intent od razu po rejestracji. Odbiornik jest rejestrowany w stanie STARTED i usuwany w `finally` po zakończeniu zbierania. Nie jest potrzebny zewnętrzny serwis zegara ani osobne uprawnienie do procentu baterii.

## Pływające menu

**Profesor pyta: dlaczego menu jest usługą, a nie częścią pulpitu?**

Musi być widoczne również nad inną aplikacją. `ExitOverlayService` tworzy przez WindowManager okno `TYPE_APPLICATION_OVERLAY`, a nie zwykły element Compose wewnątrz `MainActivity`. Wymaga systemowego zezwolenia `SYSTEM_ALERT_WINDOW`. Usługa foreground ma kanał powiadomienia i manifestowy typ `specialUse` z opisem celu.

Przyciski są zwykłymi Android Views. Nakładka ma `FLAG_NOT_FOCUSABLE`, więc nie przejmuje zwykłego fokusu klawiatury. Przycisk domu w chwili kliknięcia ponownie sprawdza `engine.session`: otwiera pulpit albo PIN z żądaniem zakończenia sesji. Zachowanie nie polega na zaufaniu do aktualnie narysowanej ikony.

Źródło: [ExitOverlayService.kt](../app/src/main/java/pl/adriantur/stanowisko/ExitOverlayService.kt).

**Profesor pyta: skąd silnik wie, że menu rzeczywiście powstało?**

Przed wywołaniem usługi tworzy nowe `CompletableDeferred<Unit>` w `ExitOverlayService.ready`. Usługa kończy je sukcesem po dodaniu lub aktualizacji okna, a wyjątkiem przy błędzie. Silnik czeka maksymalnie pięć sekund. Samo wywołanie `startForegroundService` nie jest więc uznane za wystarczające potwierdzenie.

Usługa zwraca `START_STICKY`, co pozwala systemowi próbować odtworzyć ją po zakończeniu. Nie jest to gwarancja nieprzerwanej obecności okna. Kod przewiduje także ponowne wywołania usługi przez silnik.

**Profesor pyta: jak zachowuje pozycję po obrocie?**

Współrzędne zapisuje jako ułamki 0–1 dostępnego zakresu ruchu. `FloatingPanelBounds` przelicza je na aktualne piksele, uwzględniając rozmiar panelu, paski, wycięcia i margines. `clamp()` utrzymuje panel w granicach; wartości niefinitywne są zastępowane bezpiecznym ułamkiem. Uchwyt rozpoznaje przeciągnięcie dopiero po przekroczeniu systemowego progu ruchu.

Domyślna pozycja to prawa strona (`x=1`) i 15% zakresu pionowego. `onConfigurationChanged` przelicza szerokość i pozycję. Źródło obliczeń: [FloatingPanelPosition.kt](../app/src/main/java/pl/adriantur/stanowisko/FloatingPanelPosition.kt).

**Profesor pyta: dlaczego nakładka znika nad panelem?**

`WorkspaceApp` publikuje `workspaceUiVisible`. Własne Activity poza WebActivity traktuje jako okno pulpitu lub administracji. Usługa zbiera ten strumień i chowa panel, gdy nie jest potrzebny. Strona jest wyjątkiem, bo nadal musi mieć sterowanie. To koordynacja widoczności wewnątrz procesu, a nie wykrywanie wszystkich aktywności systemu.

## Konfiguracja adresów WWW

**Profesor pyta: co znaczy dozwolona domena w tej implementacji?**

Precyzyjnie: dozwolony **origin**, czyli schemat, host i efektywny port. `WebAddress.origin()` usuwa ścieżkę, query i fragment, zmniejsza litery schematu i hosta oraz normalizuje domyślne porty 80 i 443. Odrzuca inne schematy niż HTTP/HTTPS, brak hosta, login w URL, port poza 1–65535, białe znaki na końcach i adres dłuższy niż 2048 znaków.

| Skonfigurowano `https://example.org/panel` | Czy ma ten sam origin |
| --- | --- |
| `https://example.org/inne?x=1` | Tak |
| `https://EXAMPLE.org:443/a` | Tak |
| `http://example.org/panel` | Nie, inny schemat |
| `https://example.org:8443/panel` | Nie, inny port |
| `https://login.example.org/` | Nie, inny host |
| `https://example.org.evil.invalid/` | Nie, inny host |
| `mailto:user@example.org` | Nie, niedozwolony schemat |

Nie ma porównania prefiksu tekstowego ani wildcardu subdomen. Każdy dodatkowy origin trzeba dodać osobnym adresem. Wpisanie jednej ścieżki nie ogranicza dostępu tylko do tej ścieżki.

Tytuł ma 1–60 znaków po normalizacji, a pole dodatkowych adresów najwyżej 16 384 znaki. Główny URL musi być poprawny przy włączonej stronie. Dodatkowe niepuste adresy są walidowane także przy stronie wyłączonej. Źródło: [WebPageConfig.kt](../app/src/main/java/pl/adriantur/stanowisko/WebPageConfig.kt).

## WebView i granice izolacji

**Profesor pyta: co blokuje WebActivity?**

Odrzuca nawigację poza dozwolone origins, nie otwiera linków w aplikacjach zewnętrznych, anuluje błędy certyfikatu TLS. Wyłącza dostęp do `file:` i `content:`, mieszane treści HTTPS/HTTP, wiele okien, automatyczne okna JavaScript, wybieranie i pobieranie plików. Odmawia żądań uprawnień strony oraz geolokalizacji. Nie udostępnia mostka `addJavascriptInterface`.

DOM storage jest włączony, a JavaScript domyślnie również. HTTP jest celowo dozwolone w manifeście dla stron, więc administrator może skonfigurować połączenie nieszyfrowane. Błąd certyfikatu HTTPS nie jest obchodzony przyciskiem „kontynuuj”. Wszystkie te zachowania wynikają z [WebActivity.kt](../app/src/main/java/pl/adriantur/stanowisko/WebActivity.kt).

**Profesor pyta: dlaczego adres jest sprawdzany w kilku callbackach?**

`shouldOverrideUrlLoading` kontroluje przejścia, `shouldInterceptRequest` obsługuje także główne żądania POST, a `onPageStarted` zatrzymuje rozpoczęte ładowanie niedozwolonej strony. Intercept zwraca wtedy lokalną odpowiedź HTTP 403. Aktualizacja komunikatu z callbacku żądania przechodzi przez `view.post`, bo to nie musi być wątek UI.

Platforma nie wywołuje `shouldOverrideUrlLoading` dla wszystkich nawigacji, w tym POST. Intercept przy przekierowaniu jest wywoływany dla początkowego URL, nie każdego kolejnego. Są to ograniczenia opisane w [WebViewClient](https://developer.android.com/reference/android/webkit/WebViewClient), które trzeba uwzględnić w testach przekierowań.

**Profesor pyta: czy to zapora całego internetu?**

Nie. W `shouldInterceptRequest` warunek odrzucenia dotyczy tylko `request.isForMainFrame`. Podzasoby, żądania skryptów, obrazy, połączenia aplikacji natywnych i cała polityka sieci urządzenia nie są objęte jednym globalnym filtrem tej listy. `onPageStarted.stopLoading()` też nie dowodzi, że przed zatrzymaniem nie nastąpiła żadna komunikacja. Z tego kodu wynika kontrola nawigacji WebView, nie gwarancja szczelnego filtra ruchu lub ochrony przed wyciekiem danych.

**Profesor pyta: co stanie się po awarii strony?**

Błąd głównego żądania pokazuje panel z ponowieniem i administratorem. Przy awarii procesu renderera `onRenderProcessGone` usuwa i niszczy WebView, zachowując Activity z komunikatem; ponowienie może wykonać `recreate()`. Wstecz przechodzi po historii; dopiero brak historii w trybie wielu aplikacji pozwala wrócić na pulpit. W pojedynczej sesji nie kończy jej bez PIN-u.

`onResume` ponownie sprawdza zgodność znacznika sesji, włączenie strony, właściciela i aktywny Lock Task. Jeśli warunki się nie zgadzają, kończy Activity. `onDestroy` usuwa i niszczy widok, ale nie ma tu procedury czyszczenia cookies, DOM storage i zalogowanej sesji WWW po zakończeniu pracy użytkownika.

## Ograniczenia urządzeń producenta

**Profesor pyta: co robi obsługa Lenovo?**

`LenovoSystemMenu` rozpoznaje producenta Lenovo i dokładnie model oraz device `TB311FU`. Czyta ustawienie `enable_temp_zuifreeformbar`. W obecnym kodzie ekran wykorzystuje `supported` do pokazania informacji; `requiresPreparation` nie steruje blokadą zastosowania polityki. Klasa niczego nie zapisuje w ustawieniach producenta i nie wyłącza jego menu. To wykrycie znanego warunku wymagającego sprawdzenia na urządzeniu, a nie ogólna obsługa wszystkich tabletów Lenovo.
