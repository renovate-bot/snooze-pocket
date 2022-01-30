/**
 * Interactions with the Pocket API to snooze/unsnooze/sync snoozing.
 */
import * as dayjs from 'dayjs';
import type {Alarms, Browser} from 'webextension-polyfill';
import {PocketRequestPath} from '../enums';
import {Item} from '../types/api';
import {SnoozedItem} from '../types/storage';
import {pocketRequest} from './request';

declare const browser: Browser;

const SYNC_INTERVAL = 3600; // 1h

/**
 * Converts a Pocket API item into the extension storage equivalent.
 *
 * @param item from Pocket API.
 * @param untilTimestamp until when to snooze this item (seconds).
 * @returns a SnoozedItem object.
 */
function itemToSnoozed(item: Item, untilTimestamp: number): SnoozedItem {
  return {
    itemId: item.item_id,
    url: item.resolved_url ?? item.url ?? item.given_url,
    title: item.resolved_title ?? item.title ?? item.given_title,
    untilTimestamp,
  };
}

/**
 * Syncs the snoozed items with the Pocket API.
 *
 * @param force true to force syncing regardless of how much time has passed
 *   since the last sync. False to bail early if the last sync was within the
 *   last ${SYNC_INTERVAL} seconds.
 */
export async function sync(force: boolean): Promise<void> {
  console.debug('[sync] called', {force});
  const nowTimestamp = dayjs().unix();
  const {lastSynced} = (await browser.storage.sync.get({lastSynced: 0})) as {
    lastSynced: number;
  };
  if (!force && nowTimestamp < lastSynced + SYNC_INTERVAL) {
    return;
  }

  const {list: snoozedItemsInPocket} = await pocketRequest({
    path: PocketRequestPath.RETRIEVE,
    params: {
      tag: 'snoozed',
      detailsType: 'simple',
      since: lastSynced,
    },
  });

  // From all of the fetched items from Pocket, load the ones we know of from
  // storage.
  const snoozedItemsInStorage = Object.fromEntries(
    Object.entries(await browser.storage.sync.get()).filter(
      ([key]) => key in snoozedItemsInPocket
    )
  ) as {[itemId: string]: SnoozedItem};

  // For each of the fetched items from Pocket, update it using the fetched item
  // from Pocket.
  for (const [itemId, {untilTimestamp}] of Object.entries(
    snoozedItemsInStorage
  )) {
    snoozedItemsInStorage[itemId] = itemToSnoozed(
      snoozedItemsInPocket[itemId],
      untilTimestamp
    );
  }

  // Store the updates to the database.
  return browser.storage.sync.set({
    lastSynced: nowTimestamp,
    ...snoozedItemsInStorage,
  });
}

/**
 * Snoozes a webpage.
 *
 * @param url to add to Pocket.
 * @param untilTimestamp until when to snooze this item (seconds).
 */
export async function snooze(
  url: string,
  untilTimestamp: number
): Promise<void> {
  console.debug('[snooze] called', {url, untilTimestamp});
  const {item} = await pocketRequest({
    path: PocketRequestPath.ADD,
    params: {
      url,
      tags: 'snoozed',
    },
  });
  await pocketRequest({
    path: PocketRequestPath.MODIFY,
    params: {
      actions: [
        {
          action: 'archive',
          item_id: item.item_id,
        },
      ],
    },
  });

  const unsnoozeAlarm: Alarms.Alarm | undefined = await browser.alarms.get(
    'unsnooze'
  );
  if (!unsnoozeAlarm || untilTimestamp * 1000 < unsnoozeAlarm.scheduledTime) {
    console.log(
      '[snooze] Setting next unsnoozing action to',
      dayjs.unix(untilTimestamp).format()
    );
    if (unsnoozeAlarm) {
      console.info(
        '[snooze] Previous unsnoozing was set to',
        dayjs(unsnoozeAlarm.scheduledTime).format()
      );
    }
    browser.alarms.create('unsnooze', {when: untilTimestamp * 1000});
  }

  const snoozedItem: SnoozedItem = itemToSnoozed(item, untilTimestamp);
  await browser.storage.sync.set({[item.item_id]: snoozedItem});
  return sync(true);
}

/**
 * Unsnoozes an item.
 *
 * @param itemId the ID of the item to unsnooze from Pocket API.
 */
export async function unsnooze(itemId: number): Promise<void> {
  console.debug('[unsnooze] called', {itemId});
  await pocketRequest({
    path: PocketRequestPath.MODIFY,
    params: {
      actions: [
        {
          action: 'readd',
          item_id: String(itemId),
        },
        {
          action: 'tags_add',
          item_id: String(itemId),
          tags: 'unsnoozed',
        },
        {
          action: 'tags_remove',
          item_id: String(itemId),
          tags: 'snoozed',
        },
      ],
    },
  });
  await browser.storage.sync.remove([String(itemId)]);
}
