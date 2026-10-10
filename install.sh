#!/usr/bin/env bash
set -euo pipefail

readonly VERSION="1.0.9"
readonly APK_NAME="Stanowisko-${VERSION}.apk"
readonly APK_URL="https://github.com/Shreider/tablet_app_web/releases/download/android-v${VERSION}/${APK_NAME}"
readonly APK_SHA256="6f15773cc81c6def385109e35ef217b3a04ed62487641d52a285ae23a4837cd2"
readonly TOOLS_URL="https://dl.google.com/android/repository/platform-tools_r36.0.2-linux.zip"
readonly TOOLS_SHA256="3afdea91441815ab41254193df0343d92c1b1c0d0237165c3a345c8af8891c31"

fail() {
    printf 'Błąd: %s\n' "$*" >&2
    exit 1
}

download() {
    curl --proto '=https' --proto-redir '=https' --tlsv1.2 \
        --fail --silent --show-error --location \
        --connect-timeout 20 --max-time 300 --retry 2 \
        "$1" --output "$2"
}

verify_file() {
    local actual
    actual=$(sha256sum "$1")
    [[ "${actual%% *}" == "$2" ]] || fail "Suma kontrolna pobranego pliku jest niezgodna."
}

unpack_tools() {
    if command -v unzip >/dev/null; then
        unzip -q "$1" -d "$2"
    else
        python3 - "$1" "$2" <<'PY'
import os
from pathlib import Path
import sys
import zipfile

destination = Path(sys.argv[2])
with zipfile.ZipFile(sys.argv[1]) as archive:
    archive.extractall(destination)
os.chmod(destination / 'platform-tools/adb', 0o755)
PY
    fi
}

[[ "$(uname -s)" == "Linux" ]] || fail "Ten instalator jest przeznaczony dla Linuksa."
for tool in curl sha256sum mktemp tr; do
    command -v "$tool" >/dev/null || fail "Brakuje polecenia ${tool}."
done

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT
cache_dir="${STANOWISKO_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/stanowisko}"
sdk_dir="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"

if command -v adb >/dev/null; then
    adb_bin=$(command -v adb)
elif [[ -x "$sdk_dir/platform-tools/adb" ]]; then
    adb_bin="$sdk_dir/platform-tools/adb"
elif [[ -x "$cache_dir/platform-tools-36.0.2/platform-tools/adb" ]]; then
    adb_bin="$cache_dir/platform-tools-36.0.2/platform-tools/adb"
else
    [[ "$(uname -m)" == "x86_64" ]] || fail "Pobieranie ADB wymaga Linuksa x86_64. Zainstaluj ADB dla swojej architektury."
    if ! command -v unzip >/dev/null && ! command -v python3 >/dev/null; then
        fail "Do rozpakowania narzędzi ADB potrzebne jest polecenie unzip lub Python 3."
    fi
    printf 'Brakuje ADB. Można pobrać oficjalne Android Platform-Tools 36.0.2.\n'
    printf 'Warunki licencji: https://developer.android.com/tools/releases/platform-tools\n'
    printf 'Czy akceptujesz warunki i pobranie narzędzi? [t/N] ' >&2
    answer=""
    if ! IFS= read -r answer </dev/tty; then
        fail "Zainstaluj ADB i uruchom polecenie ponownie w terminalu."
    fi
    [[ "$answer" == "t" || "$answer" == "T" ]] || fail "Pobieranie narzędzi anulowane."
    download "$TOOLS_URL" "$work_dir/platform-tools.zip" || fail "Nie można pobrać narzędzi ADB."
    verify_file "$work_dir/platform-tools.zip" "$TOOLS_SHA256"
    mkdir -p "$cache_dir/platform-tools-36.0.2"
    unpack_tools "$work_dir/platform-tools.zip" "$cache_dir/platform-tools-36.0.2"
    adb_bin="$cache_dir/platform-tools-36.0.2/platform-tools/adb"
fi

devices=$("$adb_bin" devices) || fail "Nie można uruchomić ADB."
serial=""
device_state=""
device_count=0
while read -r candidate state remainder; do
    [[ -n "$candidate" && "$candidate" != "List" ]] || continue
    [[ -n "$state" ]] || continue
    device_count=$((device_count + 1))
    serial="$candidate"
    device_state="$state"
done <<< "$devices"

(( device_count == 1 )) || fail "Podłącz dokładnie jedno urządzenie Android przez USB."
[[ "$device_state" == "device" ]] || fail "ADB nie ma dostępu do urządzenia. Odblokuj ekran, włącz debugowanie USB i zatwierdź zgodę dla komputera."

property() {
    "$adb_bin" -s "$serial" shell getprop "$1" | tr -d '\r'
}

api=$(property ro.build.version.sdk) || fail "Nie można odczytać wersji Androida."
[[ "$api" =~ ^[0-9]+$ ]] || fail "Nie można rozpoznać wersji Androida."
(( 10#$api >= 34 )) || fail "Aplikacja wymaga Androida 14 lub nowszego."
model=$(property ro.product.model) || fail "Nie można odczytać modelu urządzenia."
manufacturer=$(property ro.product.manufacturer) || fail "Nie można odczytać producenta urządzenia."
[[ -n "$model" && -n "$manufacturer" ]] || fail "Nie potwierdzono tożsamości urządzenia."
if [[ "$serial" == emulator-* ]]; then
    [[ "$(property ro.kernel.qemu)" == "1" ]] || fail "Nie potwierdzono, że wybrane urządzenie jest emulatorem."
fi

printf 'Urządzenie: %s %s, API %s.\n' "$manufacturer" "$model" "$api"
printf 'Pobieranie Stanowisko %s…\n' "$VERSION"
download "$APK_URL" "$work_dir/$APK_NAME" || fail "Nie można pobrać APK. Sprawdź połączenie i dostępność wydania na GitHubie."
verify_file "$work_dir/$APK_NAME" "$APK_SHA256"

# Pobieranie może potrwać; przed instalacją sprawdzamy to samo połączenie ponownie.
[[ "$("$adb_bin" -s "$serial" get-state)" == "device" ]] || fail "Połączenie z urządzeniem zostało przerwane."
[[ "$(property ro.product.model)" == "$model" && "$(property ro.product.manufacturer)" == "$manufacturer" ]] || fail "Tożsamość urządzenia uległa zmianie."
if [[ "$serial" == emulator-* ]]; then
    [[ "$(property ro.kernel.qemu)" == "1" ]] || fail "Nie potwierdzono emulatora przed instalacją."
fi

printf 'Instalowanie aktualizacji z zachowaniem danych aplikacji…\n'
if ! result=$("$adb_bin" -s "$serial" install -r -t "$work_dir/$APK_NAME" 2>&1); then
    printf '%s\n' "$result" >&2
    fail "Instalacja nie powiodła się. Poprzednia aplikacja nie została odinstalowana."
fi
[[ $'\n'"$result"$'\n' == *$'\nSuccess\n'* ]] || fail "ADB nie potwierdziło instalacji."
printf 'Zainstalowano Stanowisko %s.\n' "$VERSION"
