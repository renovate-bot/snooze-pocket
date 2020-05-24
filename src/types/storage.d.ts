/**
 * Types for values that are stored in the extension's storage.
 */
export type SnoozedItem = {
  itemId: string;
  url: string;
  title: string;
  untilTimestamp: number;
}

declare type Settings = {
  morningHour: number;
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weekendDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};
