# Database (PostgreSQL)

Ten katalog dokumentuje rolę serwisu bazy danych w tej wersji projektu.

Aktualny stan:
- PostgreSQL działa jako osobny kontener (`database`) w `docker-compose.yml`.
- Aplikacja nie wykorzystuje jeszcze aktywnie bazy w logice backendu.
- Konfiguracja jest gotowa pod kolejne etapy: tabele, migracje i seedy.

Kolejne kroki rozwoju:
- dodanie migracji (np. Prisma/Knex/Flyway),
- przygotowanie schematu zajęć, sal i prowadzących,
- podpięcie backendu do rzeczywistych zapytań SQL.

ELO