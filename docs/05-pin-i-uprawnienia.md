# 5. PIN administratora i uprawnienia aplikacji

## Inicjalizacja i autoryzacja

**Profesor pyta: jaki PIN ma świeża instalacja?**

`1111`. `WorkspaceApp` uruchamia leniwe zadanie inicjalizacji, a `PinStore.initializeDefault()` zapisuje tę wartość tylko wtedy, gdy preferences nie zawierają `credential`. `MainActivity` czeka na ukończenie inicjalizacji przed pokazaniem właściwego interfejsu. Aktualizacja zachowująca dane nie nadpisuje istniejącego poświadczenia.

W ekranie pozostała ścieżka ręcznego tworzenia PIN-u przy `configured=false`, ale normalny udany start po inicjalizacji ma już domyślny PIN. Błąd inicjalizacji prowadzi do komunikatu błędu uruchomienia. Nie należy więc instruować, że każda świeża instalacja zaczyna od formularza tworzenia PIN-u.

Źródła: [WorkspaceApp.kt](../app/src/main/java/pl/adriantur/stanowisko/WorkspaceApp.kt), [MainActivity.kt](../app/src/main/java/pl/adriantur/stanowisko/MainActivity.kt), [PinStore.kt](../app/src/main/java/pl/adriantur/stanowisko/PinStore.kt).

**Profesor pyta: czy 1111 jest kodem awaryjnym?**

Nie. Jest początkowym poświadczeniem, które po zmianie nie otrzymuje dodatkowej ścieżki weryfikacji. `verify()` sprawdza zapisany materiał kryptograficzny. Kod nie ma porównania „właściwy PIN albo 1111”. Zmiana PIN-u powinna być elementem przygotowania urządzenia, bo znany czterocyfrowy kod początkowy daje dostęp każdemu, kto go zna.

**Profesor pyta: czym jest stan administratora?**

Po poprawnym PIN-ie `AuthActivity` ustawia `adminUntil = elapsedRealtime() + 120_000`. Jest to termin ważności w pamięci procesu, liczony monotonicznie od uruchomienia systemu. `authorized()` porównuje go z bieżącym `elapsedRealtime()`. To maksymalnie dwie minuty od autoryzacji, a nie automatycznie odnawiana dwuminutowa bezczynność.

Globalne callbacki Activity mogą wyzerować termin wcześniej, kiedy zatrzymuje się aktualnie śledzona aktywność i nie chodzi o zmianę konfiguracji. Kod dba, aby zatrzymanie starego pulpitu nie odebrało dostępu nowemu oknu. Ochrona uprawnień nie opiera się wyłącznie na widoczności przycisków: wrażliwe operacje wywołują `requireAdmin()`.

**Profesor pyta: co chroni ekran wpisywania kodu?**

`AuthActivity` ustawia `FLAG_SECURE` oraz `setHideOverlayWindows(true)`. Ekran administracyjny w `WorkspaceScreen` ustawia `FLAG_SECURE` przy aktywnym administratorze lub braku PIN-u. Pole maskuje cyfry, wymusza numeryczny typ klawiatury i przyjmuje najwyżej 12 znaków z zakresu ASCII `0`–`9`. Minimum 4 jest sprawdzane przy zapisie, nie na każdym wpisanym znaku.

Te ustawienia ograniczają przechwytywanie w zwykłych mechanizmach systemowych; nie zastępują testu fizycznego urządzenia ani nie stanowią ochrony przed przejętym systemem. Nie ma wymogu biometrii ani ponownego uwierzytelnienia klucza Keystore przy każdej operacji.

## Przechowywanie PIN-u

**Profesor pyta: czy PIN jest zapisany jako zwykły tekst?**

Nie. Najpierw powstaje pochodna PBKDF2, a następnie materiał do weryfikacji jest szyfrowany kluczem z Android Keystore. Kolejność ma znaczenie:

```text
PIN i losowa sól 32 bajty
        ↓ PBKDF2WithHmacSHA256, 600 000 iteracji, wynik 256 bitów
32 bajty soli || 32 bajty pochodnej
        ↓ AES/GCM/NoPadding, klucz Android Keystore workspace.pin
IV || szyfrogram z tagiem uwierzytelniającym
        ↓ Base64
auth.credential w prywatnych SharedPreferences
```

`key()` pobiera istniejący klucz AES albo tworzy go przez dostawcę `AndroidKeyStore`. Kod nie wymusza StrongBox i nie sprawdza poziomu sprzętowego zabezpieczenia. Keystore zarządza kluczem bez jego zwykłego eksportu do pliku aplikacji; dostępność ochrony sprzętowej zależy od urządzenia. Źródło platformowe: [Android Keystore](https://developer.android.com/privacy-and-security/keystore).

**Profesor pyta: dlaczego sól, PBKDF2 i AES-GCM jednocześnie?**

To różne zadania. Sól sprawia, że identyczny PIN nie daje identycznej pochodnej dla każdej instalacji. PBKDF2 zwiększa koszt obliczenia kandydata. AES-GCM chroni poufność i integralność zapisanych soli oraz pochodnej pod kluczem Keystore. Base64 wyłącznie koduje bajty jako tekst; nie jest szyfrowaniem.

Jest to uzasadnienie wynikające z właściwości użytych mechanizmów. Samo „600 tysięcy iteracji” nie dodaje entropii do czterech cyfr. PIN czterocyfrowy ma tylko 10 000 możliwych wartości, dlatego znaczenie mają ograniczanie prób i zmiana kodu początkowego.

**Profesor pyta: co robi verify krok po kroku?**

Pod własnym mutexem, na `Dispatchers.IO`, sprawdza czas blokady i obecność poświadczenia. Dekoduje Base64, traktuje pierwsze 12 bajtów jako IV GCM, odszyfrowuje pozostałą część, wydziela 32-bajtową sól i ponownie wylicza PBKDF2 dla kandydata. Porównuje pochodne przez `MessageDigest.isEqual`. Następnie zeruje część buforów i zatwierdza liczniki prób.

`PinCrypto` czyści `PBEKeySpec` oraz otrzymaną tablicę znaków. Nie oznacza to wyczyszczenia każdej kopii PIN-u w zarządzanej pamięci: interfejs i metody operują również na niemodyfikowalnych `String`. Utrata lub unieważnienie klucza Keystore nie uruchamia zaprojektowanego tu resetu poświadczenia; błąd odszyfrowania jest błędem operacji.

Źródła: [PinCrypto.kt](../app/src/main/java/pl/adriantur/stanowisko/PinCrypto.kt), [PinStore.kt](../app/src/main/java/pl/adriantur/stanowisko/PinStore.kt).

## Ograniczanie prób

**Profesor pyta: kiedy pojawia się blokada i ile trwa?**

| Liczba kolejnych niepowodzeń | Opóźnienie po tej próbie |
| --- | --- |
| 1–4 | 0 s |
| 5 | 30 s |
| 6 | 60 s |
| 7 | 120 s |
| 8 | 240 s |
| 9 | 480 s |
| 10 i więcej | 900 s, czyli 15 min |

Wzór to `30_000 × 2^min(failures−5, 5)` ograniczony do `900_000` ms. Poprawna weryfikacja zeruje licznik i termin blokady. Próba podczas blokady kończy się wyjątkiem z czasem oczekiwania, zanim zostanie obliczona pochodna.

Termin blokady jest utrwalany jako `System.currentTimeMillis()`, więc przetrwa restart procesu. Ten zegar zależy jednak od czasu kalendarzowego. Dwie minuty dostępu administratora korzystają z innego zegara, monotonicznego, i nie przetrwają utraty procesu. Zmiana zegara kalendarzowego jest jednym z powodów, dla których ograniczenia bezpieczeństwa trzeba oceniać razem z konfiguracją systemu.

## Przygotowanie uprawnień programów

**Profesor pyta: co oznacza „uprawnienia przygotowane”?**

`AppPermissionManager.list()` czyta uprawnienia zadeklarowane w pakiecie i wybiera tylko te z bazowym poziomem `PROTECTION_DANGEROUS`. Nie ma tu wszystkich ustawień Androida, dostępu Accessibility, uprawnienia nakładki, wyjątków optymalizacji baterii ani dowolnych ustawień producenta.

Model ma `name`, polską etykietę systemową, efektywny stan `granted` i stan polityki DPM. Właściwość `prepared` oznacza:

```kotlin
granted || policyState == PERMISSION_GRANT_STATE_DENIED
```

A zatem przygotowanie oznacza przyznane uprawnienie **albo jawną odmowę administracyjną**. Nie oznacza przyznania wszystkiego. Zwykłe nieprzyznane uprawnienie w stanie DEFAULT pozostaje nieprzygotowane, bo aplikacja mogłaby próbować otworzyć dialog systemowy podczas chronionej pracy.

Źródło: [AppPermissions.kt](../app/src/main/java/pl/adriantur/stanowisko/AppPermissions.kt).

**Profesor pyta: dlaczego decyzje zapadają przed uruchomieniem ochrony?**

Program, który po pierwszym otwarciu żąda dostępu lub pokazuje kreator, może wymagać dodatkowych ekranów systemowych. Projekt rozdziela przygotowanie od właściwej sesji. `apply()` sprawdza przygotowanie całej listy; `launch()` sprawdza konkretny cel. Jeśli po aktualizacji w czasie ochrony pojawią się nowe nieprzygotowane uprawnienia, pulpit może skierować administratora do autoryzacji i dialogu ustawień.

`prepareApp()` uruchamia program poza ochroną, ale wymaga administratora, braku sesji, `LOCK_TASK_MODE_NONE` i wyłączonej polityki. Pozwala przejść pierwsze uruchomienie i ustawienia specjalne. Nie jest obejściem ochrony dostępne zwykłemu użytkownikowi.

## Kolejność i kontrola zmian

**Profesor pyta: po co osobna PermissionGrantPlan?**

Lokalizacja ma zależności. Plan odrzuca zgodę na dokładną lokalizację przy jednoczesnej odmowie przybliżonej, jeśli ta występuje w mapie, oraz zgodę na lokalizację w tle bez zgody na lokalizację podczas działania. Walidacja otrzymuje aktualne efektywne zgody połączone ze zmianami, więc bierze pod uwagę oba źródła.

Zmiany odmów są wykonywane przed zgodami. W obrębie zgód kolejność to przybliżona lokalizacja, dokładna, pozostałe, a następnie lokalizacja w tle. Przy odmowach ranga jest odwrócona, aby najpierw odebrać uprawnienie zależne. Nazwa uprawnienia stabilizuje pozostałą kolejność.

**Profesor pyta: czy Android musi wykonać każdą decyzję?**

Nie. `configure()` wymaga administratora, Device Owner, braku aktywnej sesji oraz kluczy należących do zadeklarowanych uprawnień. Sprawdza wynik `setPermissionGrantState`, a potem odczytuje ponownie zarówno stan polityki, jak i efektywną zgodę. Platforma ogranicza możliwość zmiany niektórych uprawnień w zależności od ich rodzaju, roli zarządzania i konfiguracji. Nie należy traktować samego poziomu dangerous jako gwarancji swobodnego nadania. Źródło: [DevicePolicyManager](https://developer.android.com/reference/android/app/admin/DevicePolicyManager#setPermissionGrantState(android.content.ComponentName,%20java.lang.String,%20java.lang.String,%20int)).

Przy niepowodzeniu menedżer próbuje odwrócić już wykonane zmiany. Odtwarza najpierw poprzednią efektywną zgodę, a następnie poprzedni stan polityki. Ta ścieżka także może zawieść; nie ma wokół każdej czynności wycofania osobnego przechwycenia błędu. Powodzenie zapisuje jako `APP_PERMISSIONS_CHANGED`, a obsłużony błąd jako `APP_PERMISSION_ERROR`.

**Profesor pyta: czy uprawnienia wracają do dawnego stanu po wyjściu serwisowym?**

Nie. Zakończenie sesji i serwis zarządzają ograniczeniami pracy urządzenia, a nie przywracaniem wszystkich zgód aplikacji. Długotrwałe decyzje GRANTED i DENIED pozostają polityką, dopóki administrator lub inny uprawniony mechanizm ich nie zmieni. To trzeba uwzględnić, planując przekazanie urządzenia do innego zastosowania.
