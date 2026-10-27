/**
 * The times a customer can still book: not in the past, and each time once.
 * A business with several stylists has one slot per stylist at the same
 * hour; the customer picks a time, and the first free slot at that time is
 * the one that is held and booked.
 */
export function openTimes<T extends { slot_datetime: string }>(slots: T[], now: number = Date.now()): T[] {
  const seen = new Set<string>();
  return [...slots]
    .filter((s) => new Date(s.slot_datetime).getTime() > now)
    .sort((a, b) => new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime())
    .filter((s) => {
      const key = new Date(s.slot_datetime).toISOString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
