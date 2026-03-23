DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_app') THEN
    CREATE ROLE web_app LOGIN PASSWORD 'web_app_password';
  ELSE
    ALTER ROLE web_app WITH LOGIN PASSWORD 'web_app_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE tablet_schedule TO web_app;
GRANT USAGE ON SCHEMA public TO web_app;
GRANT SELECT ON TABLE rooms TO web_app;
GRANT SELECT ON TABLE schedule_entries TO web_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO web_app;
