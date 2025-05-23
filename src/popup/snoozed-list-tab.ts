/**
 * Snoozed list tab.
 */
import * as dayjs from 'dayjs';
import * as calendar from 'dayjs/plugin/calendar';
import type {Browser} from 'webextension-polyfill';
import type {SnoozedItem} from '../types/storage';
import {byId} from './shortcuts';
import {expandTemplate} from './template';

declare const browser: Browser;

dayjs.extend(calendar);

const noSnoozedItems = byId('no-snoozed-items');
const snoozedItemsList = byId('snoozed-items-list');
const snoozedItemTemplate = byId(
  'snoozed-item-template',
) as HTMLTemplateElement;

/**
 * Get or create the snooze item element.
 *
 * @param itemId the ID of the item from Pocket API.
 * @returns an HTML element.
 */
function getOrCreateSnoozeItemElement(itemId): HTMLLIElement {
  const existing = snoozedItemsList.querySelector(`[data-item-id="${itemId}"]`);
  if (existing) {
    return existing as HTMLLIElement;
  }

  const created = expandTemplate<HTMLLIElement>(snoozedItemTemplate);
  created.setAttribute('data-item-id', itemId);
  return created;
}

/**
 * Sets up the snoozed list tab.
 */
export async function setupSnoozedTab(): Promise<void> {
  console.debug('[setupSnoozedTab] called');

  const snoozedItems = Object.entries(await browser.storage.sync.get())
    .filter(([itemId]) => parseInt(itemId, 10))
    .map(([, snoozedItem]: [any, SnoozedItem]) => snoozedItem)
    .sort((left, right) => left.untilTimestamp - right.untilTimestamp);
  const snoozedItemIds = new Set<string>(
    snoozedItems.map(snoozedItem => snoozedItem.itemId),
  );

  // First, remove all items from the list that are no longer snoozed.
  for (const existingSnoozedItem of snoozedItemsList.children) {
    const existingItemId =
      existingSnoozedItem.getAttribute('data-item-id') ?? '';
    if (!snoozedItemIds.has(existingItemId)) {
      existingSnoozedItem.classList.add('unsnoozed');
      existingSnoozedItem.addEventListener(
        'transitionend',
        existingSnoozedItem.remove,
        {once: true},
      );
    }
  }

  // Display/hide the "no items" notice.
  noSnoozedItems.hidden = snoozedItems.length > 0;

  // Add/update all snoozed items to the list.
  for (const {itemId, url, title, untilTimestamp} of snoozedItems) {
    const snoozedItem = getOrCreateSnoozeItemElement(itemId);
    (snoozedItem.querySelector('.item-link') as HTMLAnchorElement).href = url;
    snoozedItem.querySelector('.title-text')!.textContent = title;
    snoozedItem.querySelector('.snoozed-until-text')!.textContent = dayjs
      .unix(untilTimestamp)
      .calendar();

    snoozedItemsList.appendChild(snoozedItem);
  }
}
