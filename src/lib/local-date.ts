function localParts(
  isoUtc: string,
  timeZone: string,
): { year: string; month: string; day: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(isoUtc));
  const get = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function localDateKey(isoUtc: string, timeZone: string): string {
  const { year, month, day } = localParts(isoUtc, timeZone);
  return `${year}-${month}-${day}`;
}

export function localMonthKey(isoUtc: string, timeZone: string): string {
  const { year, month } = localParts(isoUtc, timeZone);
  return `${year}-${month}`;
}
