/**
 * Extension alarms (WebExtension's setTimeout/setInterval equialent) handler.
 */
import * as dayjs from 'dayjs';
import type {Alarms, Browser} from 'webextension-polyfill-ts';
import {PocketRequestPath} from '../enums';
import type {SnoozedItem} from '../types/storage';
import {pocketRequest} from './request';

declare const browser: Browser;

/**
 * Creates an alarm handler that unsnoozes Pocket items that are ready.
 *
 * @param onUnsnoozeCallback callback function to execute after unsnoozing.
 */
export function createAlarmHandler(onUnsnoozeCallback: () => Promise<void>) {
  return async (alarm: Alarms.Alarm) => {
    console.debug('[browser.alarms.onAlarm] listener invoked', {alarm});
    if (alarm.name !== 'unsnooze') {
      console.error('[browser.alarms.onAlarm] Unexpected alarm:', alarm.name);
      return;
    }

    const nowTimestamp = dayjs().unix();
    const snoozedItems: [string, SnoozedItem][] = Object.entries(
      await browser.storage.sync.get()
    ).filter(([itemId]: [string, SnoozedItem]) => parseInt(itemId, 10));

    const itemIdsToUnsnooze = snoozedItems
      .filter(([, snoozedItem]) => snoozedItem.untilTimestamp <= nowTimestamp)
      .map(([, {itemId}]: [any, SnoozedItem]) => itemId);
    const actions = itemIdsToUnsnooze.map(itemId => ({
      action: 'readd',
      item_id: itemId,
    })) as {action: 'readd'; item_id: string}[];

    console.info(
      '[browser.alarms.onAlarm] Unsnoozing items',
      itemIdsToUnsnooze
    );
    if (itemIdsToUnsnooze.length) {
      await pocketRequest({
        path: PocketRequestPath.MODIFY,
        params: {
          actions,
        },
      });
      await browser.storage.sync.remove(itemIdsToUnsnooze);
      await onUnsnoozeCallback();
    }

    const nextUnsnoozeTimestamp = Math.min(
      ...snoozedItems
        .filter(([, snoozedItem]) => snoozedItem.untilTimestamp > nowTimestamp)
        .map(([, {untilTimestamp}]) => untilTimestamp)
    );
    if (isNaN(nextUnsnoozeTimestamp) || nextUnsnoozeTimestamp === Infinity) {
      console.info('[browser.alarms.onAlarm] No items to unsnooze next.');
      return;
    }

    console.log(
      '[browser.alarms.onAlarm] Setting next unsnoozing action to',
      dayjs.unix(nextUnsnoozeTimestamp).format()
    );
    browser.alarms.create('unsnooze', {when: nextUnsnoozeTimestamp * 1000});
  };
}
