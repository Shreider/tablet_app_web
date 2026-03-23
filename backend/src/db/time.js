const currentPartsFormatterCache = new Map();

const getCurrentPartsFormatter = (timeZone) => {
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

  return currentPartsFormatterCache.get(timeZone);
};

export const getDateAndMinutesInTimezone = (timeZone) => {
  const formatter = getCurrentPartsFormatter(timeZone);
  const parts = formatter.formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  const dateIso = `${values.year}-${values.month}-${values.day}`;
  const minutes = Number(values.hour) * 60 + Number(values.minute);

  return {
    dateIso,
    minutes
  };
};
