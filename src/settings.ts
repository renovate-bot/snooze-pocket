/**
 * Settings shim.
 */
import type {Browser} from 'webextension-polyfill-ts';
import type {Settings} from './types/storage';

declare const browser: Browser;

/**
 * Returns user settings, or the defaults.
 */
export async function getSettings(): Promise<Settings> {
  return (browser.storage.sync.get({
    morningHour: 9,
    morningMinute: 0,
    eveningHour: 17,
    eveningMinute: 0,
    firstDayOfWeek: 1,
    weekendDay: 6,
  }) as unknown) as Settings;
}
