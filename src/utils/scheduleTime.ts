/**
 * Turn the schedule modal's date ("YYYY-MM-DD") and free-text time
 * ("10:00 AM", "9pm", "14:30") into an epoch-ms timestamp in the browser's
 * local timezone. Returns null when the time can't be understood.
 */
export function parseScheduleTime(date: string, time: string): number | null {
  const m = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?$/i);
  const d = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m || !d) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  const meridiem = m[3]?.[0].toLowerCase();
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (meridiem === 'p' && hour !== 12) hour += 12;
  if (meridiem === 'a' && hour === 12) hour = 0;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hour, minute).getTime();
}
