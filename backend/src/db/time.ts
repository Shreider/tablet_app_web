const currentPartsFormatterCache = new Map<string, Intl.DateTimeFormat>();

const getCurrentPartsFormatter = (timeZone: string): Intl.DateTimeFormat => {
  if (!currentPartsFormatterCache.has(timeZone)) {
    currentPartsFormatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      })
    );
  }

  const formatter = currentPartsFormatterCache.get(timeZone);

  if (!formatter) {
    throw new Error(`Unable to resolve formatter for timezone: ${timeZone}`);
  }

  return formatter;
};

export const getDateAndMinutesInTimezone = (
  timeZone: string
): { dateIso: string; minutes: number } => {
  const formatter = getCurrentPartsFormatter(timeZone);
  const parts = formatter.formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;

  const dateIso = `${values.year}-${values.month}-${values.day}`;
  const minutes = Number(values.hour) * 60 + Number(values.minute);

  return {
    dateIso,
    minutes
  };
};
