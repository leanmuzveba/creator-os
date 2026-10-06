import { describe, it, expect } from 'vitest';
import { parseScheduleTime } from './scheduleTime';

const at = (h: number, m = 0) => new Date(2026, 9, 6, h, m).getTime();

describe('parseScheduleTime', () => {
  it('parses 12-hour and 24-hour times', () => {
    expect(parseScheduleTime('2026-10-06', '10:00 AM')).toBe(at(10));
    expect(parseScheduleTime('2026-10-06', '9pm')).toBe(at(21));
    expect(parseScheduleTime('2026-10-06', '12:30 am')).toBe(at(0, 30));
    expect(parseScheduleTime('2026-10-06', '12 PM')).toBe(at(12));
    expect(parseScheduleTime('2026-10-06', '14:30')).toBe(at(14, 30));
  });
  it('rejects nonsense', () => {
    expect(parseScheduleTime('2026-10-06', 'noon')).toBeNull();
    expect(parseScheduleTime('2026-10-06', '13 PM')).toBeNull();
    expect(parseScheduleTime('2026-10-06', '10:75')).toBeNull();
    expect(parseScheduleTime('', '10:00 AM')).toBeNull();
  });
});
