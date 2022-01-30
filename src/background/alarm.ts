/**
 * Extension alarms (WebExtension's setTimeout/setInterval equialent) handler.
 */
import * as dayjs from 'dayjs';
import type {Alarms, Browser} from 'webextension-polyfill';
import {PocketRequestPath} from '../enums';
import type {ModifyActions} from '../types/api';
import type {SnoozedItem} from '../types/storage';
import {pocketRequest} from './request';

type UnsnoozeCallback = () => Promise<void>;

declare const browser: Browser;

/**
 * Creates an alarm handler that unsnoozes Pocket items that are ready.
 *
 * @param onUnsnoozeCallback callback function to execute after unsnoozing.
 * @return a new alarm handler function.
 */
export function createAlarmHandler(onUnsnoozeCallback: UnsnoozeCallback) {
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

    const localItemIdsToUnsnooze = snoozedItems
      .filter(([, snoozedItem]) => snoozedItem.untilTimestamp <= nowTimestamp)
      .map(([, {itemId}]: [any, SnoozedItem]) => itemId);
    if (!localItemIdsToUnsnooze.length) {
      console.log('[browser.alarms.onAlarm] No items to unsnooze');
      return await callbackAndResetAlarm(
        onUnsnoozeCallback,
        dayjs().add(6, 'hour').unix()
      );
    }

    const remoteItemIdsToUnsnooze = await getRemoteItemsToUnsnooze(
      localItemIdsToUnsnooze
    );
    if (remoteItemIdsToUnsnooze.length) {
      console.log(
        '[browser.alarms.onAlarm] Unsnoozing items',
        remoteItemIdsToUnsnooze,
        'in Pocket'
      );
      await pocketRequest({
        path: PocketRequestPath.MODIFY,
        params: {
          actions: remoteItemIdsToUnsnooze.flatMap(generateUnsnoozingActions),
        },
      });
    } else {
      console.warn(
        '[browser.alarms.onAlarm] No items left to unsnooze in Pocket'
      );
    }

    if (localItemIdsToUnsnooze.length !== remoteItemIdsToUnsnooze.length) {
      console.warn(
        '[browser.alarms.onAlarm] Items',
        localItemIdsToUnsnooze.filter(
          itemId => !remoteItemIdsToUnsnooze.includes(itemId)
        ),
        'have already been unsnoozed remotely and have been silently dropped'
      );
    }

    await browser.storage.sync.remove(localItemIdsToUnsnooze);
    const nextUnsnoozeTimestamp = Math.min(
      dayjs().add(6, 'hour').unix(),
      ...snoozedItems
        .filter(([, snoozedItem]) => snoozedItem.untilTimestamp > nowTimestamp)
        .map(([, {untilTimestamp}]) => untilTimestamp)
    );
    await callbackAndResetAlarm(onUnsnoozeCallback, nextUnsnoozeTimestamp);
  };
}

/**
 * Determines which local items should be unsnoozed remotely.
 *
 * @param localItemIdsToUnsnooze list of local item IDs to unsnooze.
 * @returns subset of the input param that require remote unsnoozing.
 */
async function getRemoteItemsToUnsnooze(
  localItemIdsToUnsnooze: string[]
): Promise<string[]> {
  // Retrieve all currently archived and snoozed items from Pocket so we don't
  // accidentally unsnooze an item that was already unsnoozed before by a
  // different instance of this extension that hasn't been opened and
  // synced in a while.
  const allArchivedSnoozedItemIds = new Set(
    Object.keys(
      (
        await pocketRequest({
          path: PocketRequestPath.RETRIEVE,
          params: {
            state: 'archived',
            tag: 'snoozed',
            detailsType: 'simple',
          },
        })
      ).list
    )
  );
  return localItemIdsToUnsnooze.filter(itemId =>
    allArchivedSnoozedItemIds.has(itemId)
  );
}

/**
 * Generates the read+tags_add+tags_remove trio of modify actions to unsnooze.
 *
 * @param itemId to unsnooze.
 * @returns trio of modify actions.
 */
function generateUnsnoozingActions(itemId: string): ModifyActions[] {
  return [
    {
      action: 'readd',
      item_id: itemId,
    },
    {
      action: 'tags_add',
      item_id: itemId,
      tags: 'unsnoozed',
    },
    {
      action: 'tags_remove',
      item_id: itemId,
      tags: 'snoozed',
    },
  ];
}

/**
 * Calls the unsnoozing callback function and resets the alarm.
 *
 * @param onUnsnoozeCallback callback function to execute after unsnoozing.
 * @param nextUnsnoozeTimestamp when to create the next unsnooze alarm.
 *
 */
async function callbackAndResetAlarm(
  onUnsnoozeCallback: UnsnoozeCallback,
  nextUnsnoozeTimestamp: number
): Promise<void> {
  await onUnsnoozeCallback();

  console.log(
    '[browser.alarms.onAlarm] Setting next unsnoozing action to',
    dayjs.unix(nextUnsnoozeTimestamp).format()
  );
  browser.alarms.create('unsnooze', {when: nextUnsnoozeTimestamp * 1000});
}
