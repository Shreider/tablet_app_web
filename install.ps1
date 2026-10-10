#Requires -Version 5.1

$Version = '1.0.9'
$ApkName = "Stanowisko-$Version.apk"
$ApkUrl = "https://github.com/Shreider/tablet_app_web/releases/download/android-v$Version/$ApkName"
$ApkSha256 = '6f15773cc81c6def385109e35ef217b3a04ed62487641d52a285ae23a4837cd2'
$ToolsUrl = 'https://dl.google.com/android/repository/platform-tools_r36.0.2-win.zip'
$ToolsSha256 = 'b024d4f319d6ad3004de1ba7b96a5c7c5f3512e8b14126308d598b4ab93dcead'
$AdminComponent = 'pl.adriantur.stanowisko/.WorkspaceAdminReceiver'
$AdminComponentFull = 'pl.adriantur.stanowisko/pl.adriantur.stanowisko.WorkspaceAdminReceiver'

function Get-Download {
    param([string]$Url, [string]$Destination)

    if (([Uri]$Url).Scheme -ne 'https') {
        throw 'Pobieranie wymaga adresu HTTPS.'
    }
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Destination -TimeoutSec 300 -MaximumRedirection 5
            return
        } catch {
            if ($attempt -eq 3) {
                throw "Nie można pobrać pliku. Sprawdź połączenie z internetem. $($_.Exception.Message)"
            }
            Start-Sleep -Seconds $attempt
        }
    }
}

function Assert-Checksum {
    param([string]$Path, [string]$Expected)

    if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -ne $Expected) {
        throw 'Suma kontrolna pobranego pliku jest niezgodna.'
    }
}

function ConvertTo-NativeArgument {
    param([string]$Value)

    # Cytowanie argumentów Windows zachowuje spacje, cudzysłowy i końcowe ukośniki.
    '"' + ($Value -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
}

function Invoke-Adb {
    param([string[]]$Arguments, [int]$TimeoutSeconds = 30)

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $AdbPath
    $startInfo.Arguments = ($Arguments | ForEach-Object { ConvertTo-NativeArgument $_ }) -join ' '
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    try {
        if (-not $process.Start()) {
            throw 'Nie można uruchomić ADB.'
        }
        $process.StandardInput.Close()
        $outputTask = $process.StandardOutput.ReadToEndAsync()
        $errorTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
            $process.Kill()
            throw 'ADB nie odpowiedziało w wyznaczonym czasie.'
        }
        $outputText = $outputTask.Result.Trim()
        $errorText = $errorTask.Result.Trim()
        if ($process.ExitCode -ne 0) {
            throw "ADB zakończyło operację błędem. $outputText $errorText"
        }
        if ($errorText) {
            Write-Host $errorText
        }
        return $outputText
    } finally {
        $process.Dispose()
    }
}

function Get-DeviceProperty {
    param([string]$Name)
    Invoke-Adb -Arguments @('-s', $DeviceSerial, 'shell', '-n', 'getprop', $Name)
}

function Assert-Connection {
    if ((Invoke-Adb -Arguments @('-s', $DeviceSerial, 'get-state')) -ne 'device') {
        throw 'Połączenie z urządzeniem zostało przerwane.'
    }
    if ((Get-DeviceProperty 'ro.product.model') -ne $DeviceModel -or
        (Get-DeviceProperty 'ro.product.manufacturer') -ne $DeviceManufacturer) {
        throw 'Tożsamość urządzenia uległa zmianie.'
    }
    if ($DeviceSerial.StartsWith('emulator-') -and (Get-DeviceProperty 'ro.kernel.qemu') -ne '1') {
        throw 'Nie potwierdzono emulatora przed zmianą konfiguracji.'
    }
}

function Get-OwnerStatus {
    $owners = Invoke-Adb -Arguments @('-s', $DeviceSerial, 'shell', '-n', 'dpm', 'list-owners')
    if ($owners -eq 'no owners') {
        return 'none'
    }
    foreach ($line in ($owners -split '\r?\n')) {
        if ($line -match '^\s*User\s+0:\s+admin=([^,\s]+),DeviceOwner(,|$)') {
            if ($Matches[1] -ceq $AdminComponent -or $Matches[1] -ceq $AdminComponentFull) {
                return 'stanowisko'
            }
            throw 'Urządzenie jest już zarządzane przez innego administratora. Nie można nadać roli Stanowisku.'
        }
    }
    if ($owners -match 'admin=') {
        throw 'Urządzenie jest już zarządzane przez innego administratora. Nie można nadać roli Stanowisku.'
    }
    throw 'Nie rozpoznano odpowiedzi Androida dotyczącej właściciela urządzenia.'
}

function Find-Adb {
    $command = Get-Command adb.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }
    $sdkDirectory = $env:ANDROID_HOME
    if (-not $sdkDirectory) { $sdkDirectory = $env:ANDROID_SDK_ROOT }
    if (-not $sdkDirectory) { $sdkDirectory = Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
    foreach ($candidate in @(
        (Join-Path $sdkDirectory 'platform-tools/adb.exe'),
        (Join-Path $CacheDirectory 'platform-tools-36.0.2/platform-tools/adb.exe')
    )) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return (Get-Item -LiteralPath $candidate).FullName
        }
    }

    Write-Host 'Brakuje ADB. Można pobrać oficjalne Android Platform-Tools 36.0.2 dla Windows.'
    Write-Host 'Warunki licencji: https://developer.android.com/tools/releases/platform-tools'
    if ((Read-Host 'Czy akceptujesz warunki i pobranie narzędzi? [t/N]') -ne 't') {
        throw 'Pobieranie narzędzi anulowane.'
    }
    $archivePath = Join-Path $InstallDirectory 'platform-tools.zip'
    Get-Download $ToolsUrl $archivePath
    Assert-Checksum $archivePath $ToolsSha256
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $extractedDirectory = Join-Path $InstallDirectory 'tools'
    [IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $extractedDirectory)
    $sourceDirectory = (Get-Item -LiteralPath (Join-Path $extractedDirectory 'platform-tools')).FullName
    $toolsDirectory = Join-Path $CacheDirectory 'platform-tools-36.0.2'
    foreach ($name in @('adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll')) {
        if (-not (Test-Path -LiteralPath (Join-Path $sourceDirectory $name) -PathType Leaf)) {
            throw 'Archiwum nie zawiera kompletnych narzędzi ADB dla Windows.'
        }
    }
    foreach ($toolFile in (Get-ChildItem -LiteralPath $sourceDirectory -Recurse -File)) {
        $relativePath = $toolFile.FullName.Substring($sourceDirectory.Length + 1)
        $destinationPath = [IO.Path]::Combine($toolsDirectory, 'platform-tools', $relativePath)
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destinationPath)) | Out-Null
        [IO.File]::Copy($toolFile.FullName, $destinationPath, $true)
    }
    return (Get-Item -LiteralPath (Join-Path $toolsDirectory 'platform-tools/adb.exe')).FullName
}

$previousErrorPreference = $ErrorActionPreference
$previousProgressPreference = $ProgressPreference
$previousTls = [Net.ServicePointManager]::SecurityProtocol
$InstallDirectory = $null
try {
    $ErrorActionPreference = 'Stop'
    $ProgressPreference = 'SilentlyContinue'
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
        throw 'Ten instalator jest przeznaczony dla Windows.'
    }
    [Net.ServicePointManager]::SecurityProtocol = $previousTls -bor [Net.SecurityProtocolType]::Tls12
    $InstallDirectory = Join-Path ([IO.Path]::GetTempPath()) ('stanowisko-' + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $InstallDirectory | Out-Null
    $CacheDirectory = $env:STANOWISKO_CACHE_DIR
    if (-not $CacheDirectory) { $CacheDirectory = Join-Path $env:LOCALAPPDATA 'Stanowisko' }
    $AdbPath = Find-Adb

    $devices = @(foreach ($line in ((Invoke-Adb -Arguments @('devices')) -split '\r?\n')) {
        if ($line.Trim() -and $line -notmatch '^List of devices attached') {
            $parts = $line.Trim() -split '\s+'
            if ($parts.Count -lt 2) { throw 'Nie rozpoznano listy urządzeń ADB.' }
            [PSCustomObject]@{ Serial = $parts[0]; State = $parts[1] }
        }
    })
    if ($devices.Count -ne 1) {
        throw 'Podłącz dokładnie jedno urządzenie Android przez USB. Jeśli ADB go nie widzi, sprawdź kabel i sterownik USB producenta.'
    }
    if ($devices[0].State -ne 'device') {
        throw 'ADB nie ma dostępu do urządzenia. Odblokuj ekran, włącz debugowanie USB i zatwierdź zgodę dla komputera.'
    }
    $DeviceSerial = $devices[0].Serial
    $apiText = Get-DeviceProperty 'ro.build.version.sdk'
    $api = 0
    if ($apiText -notmatch '^\d+$' -or -not [int]::TryParse($apiText, [ref]$api)) {
        throw 'Nie można rozpoznać wersji Androida.'
    }
    if ($api -lt 34) { throw 'Aplikacja wymaga Androida 14 lub nowszego.' }
    $DeviceModel = Get-DeviceProperty 'ro.product.model'
    $DeviceManufacturer = Get-DeviceProperty 'ro.product.manufacturer'
    if (-not $DeviceModel -or -not $DeviceManufacturer) { throw 'Nie potwierdzono tożsamości urządzenia.' }
    if ($DeviceSerial.StartsWith('emulator-') -and (Get-DeviceProperty 'ro.kernel.qemu') -ne '1') {
        throw 'Nie potwierdzono, że wybrane urządzenie jest emulatorem.'
    }
    $owner = Get-OwnerStatus

    Write-Host "Urządzenie: $DeviceManufacturer $DeviceModel, API $api."
    Write-Host "Pobieranie Stanowisko $Version..."
    $apkPath = Join-Path $InstallDirectory $ApkName
    Get-Download $ApkUrl $apkPath
    Assert-Checksum $apkPath $ApkSha256
    Assert-Connection
    $owner = Get-OwnerStatus
    Write-Host 'Instalowanie aktualizacji z zachowaniem danych aplikacji...'
    $result = Invoke-Adb -Arguments @('-s', $DeviceSerial, 'install', '-r', '-t', $apkPath) -TimeoutSeconds 180
    if ($result -cnotmatch '(?m)^Success\r?$') { throw 'ADB nie potwierdziło instalacji.' }
    Write-Host "Zainstalowano Stanowisko $Version."

    $owner = Get-OwnerStatus
    if ($owner -eq 'stanowisko') {
        Write-Host 'Stanowisko ma już rolę właściciela urządzenia. Zachowano dotychczasową konfigurację.'
    } else {
        Write-Host 'Do pełnej ochrony potrzebna jest rola właściciela urządzenia (Device Owner).'
        Write-Host 'Ta rola pozwala Stanowisku zarządzać urządzeniem i egzekwować ochronę.'
        $answer = Read-Host "Czy nadać Stanowisku rolę właściciela na $DeviceManufacturer $DeviceModel? [t/N]"
        if ($answer -ne 't') {
            Write-Host 'Pominięto nadanie roli właściciela. Aplikacja jest zainstalowana, ale pełna ochrona wymaga tej roli.'
            return
        }
        Assert-Connection
        $owner = Get-OwnerStatus
        if ($owner -eq 'none') {
            try {
                $result = Invoke-Adb -Arguments @('-s', $DeviceSerial, 'shell', '-n', 'dpm', 'set-device-owner', '--user', '0', $AdminComponent)
            } catch {
                throw "Android odmówił nadania roli właściciela. APK pozostaje zainstalowany. Sprawdź konta, profile i komunikat systemu. $($_.Exception.Message)"
            }
            $owner = Get-OwnerStatus
            if ($owner -ne 'stanowisko') {
                throw "Nie potwierdzono roli właściciela po konfiguracji. Pełna ochrona nie jest gotowa. $result"
            }
        }
        Write-Host 'Potwierdzono rolę właściciela urządzenia dla Stanowiska.'
    }
    Write-Host 'Pełna ochrona wymaga także zapisania i zastosowania polityki w panelu administratora.'
} catch {
    throw "Błąd: $($_.Exception.Message)"
} finally {
    if ($InstallDirectory -and (Test-Path -LiteralPath $InstallDirectory)) {
        Remove-Item -LiteralPath $InstallDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
    [Net.ServicePointManager]::SecurityProtocol = $previousTls
    $ProgressPreference = $previousProgressPreference
    $ErrorActionPreference = $previousErrorPreference
}
