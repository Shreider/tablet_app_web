# Database (PostgreSQL + Prisma)

Baza danych jest głównym źródłem prawdy dla aplikacji.

## Prisma

Schemat i migracje są utrzymywane przez Prisma:
- schema: `backend/prisma/schema.prisma`
- migracje: `backend/prisma/migrations/*`

Migracje uruchamiane są poleceniem:

```bash
docker compose exec -T backend npm run db:migrate
```

## Konta i uprawnienia

- `admin` - konto administracyjne (migracje Prisma, seed, operacje zapisu panelu admin),
- `web_app` - konto runtime publicznego API (odczyt).

Role są przygotowywane przez pliki init w `database/init`.

## Encje

- `Room` (`rooms`) - metadane sal,
- `ScheduleEntry` (`schedule_entries`) - harmonogram zajęć,
- relacja: `rooms (1) -> (N) schedule_entries`.

## Seed

Seed danych testowych zgodny z Prisma:

```bash
docker compose exec -T backend npm run db:seed
```

Seed czyści i odtwarza dane testowe.
