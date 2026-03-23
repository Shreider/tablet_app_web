export const env = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://web_app:web_app_password@localhost:5432/tablet_schedule',
  databaseAdminUrl:
    process.env.DATABASE_ADMIN_URL ??
    'postgresql://admin:admin_password@localhost:5432/tablet_schedule',
  timezone: process.env.APP_TIMEZONE ?? 'Europe/Warsaw',
  corsOrigin: process.env.CORS_ORIGIN ?? '*'
};

export const corsOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
