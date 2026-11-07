# 8. Decyzje techniczne, alternatywy i ograniczenia

## Jak rozumieć uzasadnienie projektu

**Profesor pyta: czy każde rozwiązanie w istniejącym kodzie jest najlepszym możliwym?**

Nie. Projekt jest zbiorem kompromisów dostosowanych do lokalnie zarządzanego stanowiska. Poniżej oddzielamy obserwowaną konstrukcję od jej inżynierskiego uzasadnienia. Dostępna historia nie dokumentuje szczegółowej dyskusji autora o większości tych decyzji; nie traktujemy analizy korzyści jako dowodu jego intencji.

Najważniejsza oś oceny brzmi: czy rozwiązanie daje wymaganą kontrolę nad konkretnym urządzeniem, czy można odtworzyć jego stan po awarii i czy administrator potrafi zdiagnozować niezgodność między zapisem a systemem.

## Platforma i architektura

**Profesor pyta: dlaczego natywny Android zamiast samej strony lub PWA?**

Sterowanie `DevicePolicyManager`, rolą HOME, uprawnieniami innych aplikacji, foreground service i nakładką wymaga integracji z Androidem. Strona WWW może być treścią kiosku, ale nie realizuje sama tych systemowych ról. Natywna warstwa ma więc bezpośredni związek z celem. Kosztem jest związanie z platformą i konieczność osobnej obsługi jej wersji oraz zachowań producentów.

Aplikacja wieloplatformowa również mogłaby mieć moduł natywny realizujący te operacje. Wtedy dodatkowa warstwa miałaby sens przy rzeczywistym współdzieleniu produktu z innymi platformami; nie usuwa potrzeby kodu Androida.

**Profesor pyta: dlaczego Device Owner i Lock Task zamiast samego przypięcia ekranu?**

Kod potrzebuje zarządzanej listy wielu aplikacji, trwałego HOME i kontroli polityk. Systemowy mechanizm zarządzania odpowiada temu zakresowi. Zwykłe przypięcie jest słabszym, inaczej opuszczanym trybem; projekt jawnie je rozróżnia. Ceną jest trudniejsze przygotowanie urządzenia i większa odpowiedzialność administratora. Szczegóły platformowe wyjaśnia [przewodnik Lock Task](https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode).

**Profesor pyta: dlaczego Kotlin i Compose zamiast Java i układów XML?**

Kotlin pasuje do korutyn, Flow i krótkich modeli danych. Compose pozwala opisać UI jako funkcję stanu, co widać przy przełączaniu między pulpitem i administracją. XML Views byłyby równie możliwe, ale wymagałyby innego mechanizmu wiązania stanu i aktualizowania elementów.

Kod sam pokazuje, że nie zastosowano jednej technologii za wszelką cenę: WebView i okno nakładki korzystają z tradycyjnych Views. To naturalne miejsca integracji z istniejącymi API Androida. Kosztem mieszania jest utrzymywanie dwóch sposobów budowania interfejsu.

**Profesor pyta: dlaczego jeden moduł i ręczne składanie usług?**

Przy 26 plikach i jednym produkcie daje to prosty start i łatwe śledzenie wywołań. Nie wymaga konfiguracji kontenera DI i licznych modułów. Z czasem duże `PolicyEngine` i `WorkspaceScreen` zaczynają łączyć zbyt wiele odpowiedzialności. Wydzielenie adaptera DPM, repozytorium konfiguracji i sterownika sesji byłoby uzasadnione, gdy pojawią się trudności w testowaniu lub nowe warianty polityk.

Sama duża liczba warstw nie poprawia niezawodności. Warto zacząć od granic, które pozwalają testować ważne skutki: „co system zaakceptował”, „co zapisano” i „co należy ponowić”.

## Dane i współbieżność

**Profesor pyta: dlaczego Room, a nie wszystko w preferences?**

Polityka ma schemat, wersje i powiązane pola, a dziennik wymaga sortowania i retencji. Room daje DAO, walidację zapytań i jawne migracje. Preferences są prostsze dla pojedynczego zestawu ustawień, ale dziennik z operacją „ostatnie 80, przechowuj 1000” naturalnie odpowiada bazie.

Surowe SQLite dałoby pełną kontrolę przy większej ilości ręcznego kodu. Obecne Room wymaga KSP i utrzymywania migracji. Eksporty JSON nie zastępują testu aktualizacji bazy z każdej obsługiwanej wersji.

**Profesor pyta: dlaczego lista reguł jest jednym JSON-em?**

Silnik zawsze stosuje całą listę jako konfigurację. Jeden dokument pozwala łatwo przechować parę „zapisana lista / zastosowana lista” w pojedynczym rekordzie. Oddzielna tabela reguł byłaby lepsza przy wielu profilach, zapytaniach po pakiecie, relacjach i rozbudowanych regułach. Obecny format jest mniej wygodny do SQL-owej analizy i nie ma własnego pola wersji serializacji.

**Profesor pyta: dlaczego SharedPreferences zamiast DataStore?**

W obecnym kodzie preferences są prostym magazynem małych wartości, a wynik `commit()` można bezpośrednio sprawdzić. DataStore dałby bardziej jednolity asynchroniczny interfejs i model aktualizacji. Przeniesienie nie zapewni jednak transakcji z DPM i Room. Korzyść pojawi się przy uporządkowaniu przepływów danych, a nie samym zastąpieniu nazw API.

**Profesor pyta: dlaczego korutyny i Mutex?**

Oczekiwanie na Lock Task lub gotowość nakładki nie musi zajmować wątku, a operacje kryptograficzne i odczyty PackageManager mogą przechodzić na IO. Mutex silnika porządkuje działania administratora. Alternatywą byłby jawny sterownik poleceń lub automat stanów, który łatwiej odtwarza niedokończone operacje. Sam Mutex nie rozwiązuje awarii procesu ani współbieżności wszystkich menedżerów.

**Profesor pyta: dlaczego commit, choć lint zaleca apply?**

`commit()` daje synchroniczną odpowiedź o zapisie. Dla znacznika sesji lub credential jest to inna potrzeba niż wygodna, asynchroniczna aktualizacja położenia panelu. Zastąpienie wszystkich wywołań przez `apply()` wyłącznie po to, by zniknęło ostrzeżenie, zmieniłoby tę własność. Jednocześnie wywołania dyskowe na głównym wątku mogą kosztować płynność; warto świadomie przenosić je lub zmienić model zapisu. Ostrzeżenie jest sygnałem do oceny kontekstu.

## Granice bezpieczeństwa i niezawodności

**Profesor pyta: jakie zagrożenia rzeczywiście obejmuje projekt?**

Celuje w kontrolę zwykłego korzystania z zarządzanego urządzenia: wybór aplikacji, dostęp do administracji i zakończenie sesji. Z kodu nie wynika pełny model ochrony przed przejętym systemem, rootem, odblokowanym bootloaderem, atakami fizycznymi czy błędami producenta. Nie jest też centralnym MDM z odwoływaniem uprawnień i zewnętrznym audytem.

Poniższe punkty opisują konsekwencje istniejącego kodu lub obszary wymagające testów. Nie są raportem z potwierdzonego ataku na tablet.

| Obszar | Dowód w implementacji | Konsekwencja |
| --- | --- | --- |
| Początkowy PIN | `DEFAULT_PIN = "1111"` | Przygotowanie urządzenia musi obejmować zmianę znanego poświadczenia |
| Przejścia sesji | `launch`, `launchWeb`, `endSession` nie mają pełnej kompensacji analogicznej do `apply` | Błąd po zapisie znacznika lub zmianie DPM może pozostawić stan częściowy |
| Serwis | `enabled=false` zapisywane przed zwolnieniem ograniczeń | Awaria zwalniania może pozostawić ograniczenia bez automatycznego odtwarzania polityki |
| Przywracanie | Wywoływane z `onResume`, zależy od owner, bazy i keyguardu | Wymaga prób bootu, aktualizacji i utraty procesu na docelowym systemie |
| Nakładka | Osobna zgoda, foreground service, WindowManager | Dostęp administratora zależy także od dostępności okna i polityki systemu |
| Lista pakietów | Polityka działa na pakietach | Zaufanie obejmuje także zachowanie i własne ekrany dozwolonych programów |
| Filtr WWW | Origin i główne żądania | Nie ogranicza globalnie ruchu i wszystkich podzasobów |
| HTTP | `usesCleartextTraffic=true` | Możliwe połączenie bez szyfrowania, jeśli administrator wybierze taki URL |
| Dane WWW | Brak czyszczenia cookies i storage przy końcu sesji | Kolejny użytkownik może odziedziczyć stan logowania strony |
| Uprawnienia | Jawne GRANTED/DENIED bez ogólnej procedury cofnięcia | Decyzje pozostają po serwisie i końcu sesji |
| Czas blokady PIN | `blockedUntil` używa zegara kalendarzowego | Zmiany czasu wpływają na długość blokady |
| Rejestr zdarzeń | Lokalna baza, limit 1000, brak podpisu i eksportu | Dziennik służy diagnostyce lokalnej; nie zapewnia niezależnego dowodu zdarzeń |
| Dystrybucja | README opisuje wydanie debug/testOnly, brak signingConfig release | Docelowe utrzymanie wymaga własnej polityki kluczy i aktualizacji |
| Instalatory | Parser konkretnego wyjścia `dpm list-owners` | Zmiana formatu lub nietypowy system może przerwać instalację |

Źródła powyższych zależności: [PolicyEngine.kt](../app/src/main/java/pl/adriantur/stanowisko/PolicyEngine.kt), [WebActivity.kt](../app/src/main/java/pl/adriantur/stanowisko/WebActivity.kt), [PinStore.kt](../app/src/main/java/pl/adriantur/stanowisko/PinStore.kt), [install.sh](../install.sh), [install.ps1](../install.ps1).

**Profesor pyta: czy udane apply oznacza sprawdzenie absolutnie wszystkiego?**

Nie. `setPolicy()` porównuje pakiety, maskę Lock Task i HOME; kolejne kroki potwierdzają LOCKED i gotowość nakładki. Kod nie wykonuje kompletnego audytu wszystkich możliwych ekranów Androida, ustawień OEM ani każdej restrykcji. Podobnie brak wyjątków w systemowym API nie dowodzi oczekiwanego zachowania każdej aplikacji zewnętrznej.

**Profesor pyta: co z obsługą błędów i audytem?**

`WorkspaceException` daje zamierzony tekst użytkownika, inne wyjątki prowadzą do komunikatu ogólnego. To ogranicza pokazywanie wewnętrznych szczegółów. Równocześnie część operacji audytu jest wykonywana w tej samej ścieżce co działanie właściwe. Błąd bazy przy zapisie logu może utrudnić zgłoszenie pierwotnego błędu albo sprawić, że zakończone działanie wygląda dla użytkownika na nieudane. W przyszłości warto odróżnić wynik operacji od wyniku jej diagnostycznego zapisu.

Silnik i niektóre ekrany łapią szerokie `Exception`, podczas gdy ViewModel osobno ponawia `CancellationException`. Ujednolicenie semantyki anulowania powinno uwzględnić, czy rozpoczęta zmiana systemowa ma zostać dokończona, skompensowana czy zapisana do odtworzenia. Samo mechaniczne dodanie `throw` w każdym miejscu może zmienić bezpieczeństwo przejść.

## Kolejność możliwych ulepszeń

**Profesor pyta: od czego rozpoczęłabym rozwój, gdyby projekt miał trafić na więcej urządzeń?**

1. **Spójność przejść.** Wprowadzić jawne stany operacji: żądana, wykonywana, potwierdzona, wymagająca naprawy. Zapisywać wystarczające dane do wznowienia lub kompensacji po utracie procesu. Szczególnie objąć początek i koniec sesji oraz serwis.
2. **Weryfikacja na urządzeniu.** Zautomatyzować scenariusze restartu, utraty procesu, niegotowych uprawnień, awarii nakładki i aplikacji. Osobno mierzyć wynik systemowy i stan bazy.
3. **Granica API systemu.** Wydzielić adapter DevicePolicyManager i interfejs przechowywania stanu. Ułatwi to testowanie odmów i połowicznie wykonanych operacji.
4. **Poświadczenia i dystrybucja.** Zaplanować wymuszoną zmianę PIN-u początkowego, utrzymanie klucza release, odzyskiwanie dostępu zgodne z celem produktu i kontrolę aktualizacji.
5. **Polityka WWW.** Jawnie ustalić, czy celem jest wyłącznie nawigacja, czy także ograniczenie ruchu i izolacja użytkowników. Od tego zależą filtrowanie zasobów, obsługa SSO oraz czyszczenie danych strony.
6. **Obsługa floty.** Dopiero przy takim wymaganiu rozważyć provisioning QR, centralne profile, zdalną diagnostykę, eksport audytu i mechanizm aktualizacji.

To propozycje rozwoju, nie funkcje już zrealizowane w obecnym drzewie. Dokumentacja zadania nie zmieniała kodu ochrony ani polityk żadnego urządzenia.
