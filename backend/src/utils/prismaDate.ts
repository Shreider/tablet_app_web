const pad2 = (value: number): string => String(value).padStart(2, '0');

export const toDateOnly = (dateIso: string): Date => new Date(`${dateIso}T00:00:00.000Z`);

export const formatDateOnly = (value: Date | string): string => {
  if (!(value instanceof Date)) {
    return String(value).slice(0, 10);
  }

  return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
};

export const toTimeValue = (timeText: string): Date => new Date(`1970-01-01T${timeText}:00.000Z`);

export const formatTimeValue = (value: Date | string): string => {
  if (value instanceof Date) {
    return `${pad2(value.getUTCHours())}:${pad2(value.getUTCMinutes())}`;
  }

  return String(value).slice(0, 5);
};
