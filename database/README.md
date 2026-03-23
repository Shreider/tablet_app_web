# Database (PostgreSQL)

Baza danych jest glownym zrodlem prawdy dla aplikacji runtime.

## Konta i uprawnienia

- `admin` - konto administracyjne, uzywane do inicjalizacji DB, migracji i seedu.
- `web_app` - konto runtime backendu API, z uprawnieniami odczytu danych.

## Model danych

- `rooms` - metadane sal,
- `schedule_entries` - harmonogram zajec dla sal.

Pola w `schedule_entries` przechowuja m.in.:
- tytul zajec,
- prowadzacego,
- grupe,
- date i godziny,
- opis, notatke,
- dodatkowe metadane (kierunek/subject code).

## Schema / migracje

Schema jest utrzymywana przez:
- `database/init/001_schema.sql` (inicjalizacja kontenera DB),
- `npm run db:migrate` (idempotentne dopiecie schematu po stronie backendu).

Uruchomienie migracji:

```bash
docker compose exec -T backend npm run db:migrate
```

## Seed danych

Seed jest jedynym miejscem, gdzie trzymane sa dane dane startowe.
Runtime backendu i frontendu nie korzysta z plikow danych startowych jako zrodla danych.

Uruchomienie seedu:

```bash
docker compose exec -T backend npm run db:seed
```

Seed jest powtarzalny i przygotowuje dane dla sal:
- `30`, `31`, `101`, `205`, `A12`.
