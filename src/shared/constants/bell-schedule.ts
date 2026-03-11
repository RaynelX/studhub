export interface BellSlot {
  pairNumber: number;
  startTime: string;
  breakStart: string;
  breakEnd: string;
  endTime: string;
}

export const BELL_SCHEDULE: readonly BellSlot[] = [
  { pairNumber: 1, startTime: '08:30', breakStart: '09:10', breakEnd: '09:15', endTime: '09:55' },
  { pairNumber: 2, startTime: '10:05', breakStart: '10:45', breakEnd: '10:50', endTime: '11:30' },
  { pairNumber: 3, startTime: '11:50', breakStart: '12:30', breakEnd: '12:35', endTime: '13:15' },
  { pairNumber: 4, startTime: '13:25', breakStart: '14:05', breakEnd: '14:10', endTime: '14:50' },
  { pairNumber: 5, startTime: '15:10', breakStart: '15:50', breakEnd: '15:55', endTime: '16:35' },
] as const;

export function getBellSlot(pairNumber: number): BellSlot | undefined {
  return BELL_SCHEDULE.find(s => s.pairNumber === pairNumber);
}

export function formatBellTime(slot: BellSlot): string {
  return `${slot.startTime}–${slot.endTime}`;
}