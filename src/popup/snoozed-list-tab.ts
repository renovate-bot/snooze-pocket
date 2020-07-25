/**
 * Snoozed list tab.
 */
import * as dayjs from 'dayjs';
import * as calendar from 'dayjs/plugin/calendar'; // tslint:disable-line: no-submodule-imports
import type {Browser} from 'webextension-polyfill-ts';
import {Actions} from '../enums';
import type {SnoozedItem} from '../types/storage';
import {sendMessage} from './message';
import {byId} from './shortcuts';
import {animationDelayedEnableSyncButton, disableSyncButton} from './tabs';
import {displayToast} from './toast';

declare const browser: Browser;

dayjs.extend(calendar);

const noSnoozedItems = byId('no-snoozed-items');
const snoozedItemsList = byId('snoozed-items-list');
const snoozedItemTemplate = byId(
  'snoozed-item-template'
) as HTMLTemplateElement;

/**
 * Sets up the snoozed list tab.
 *
 * @param maybeSyncAfter true to call sync() after setting up.
 */
export async function setupSnoozedTab(maybeSyncAfter: boolean): Promise<void> {
  console.debug('[setupSnoozedTab] called', {maybeSyncAfter});

  const snoozedItems = Object.entries(await browser.storage.sync.get())
    .filter(([itemId]) => parseInt(itemId, 10))
    .map(([, snoozedItem]: [any, SnoozedItem]) => snoozedItem)
    .sort((left, right) => left.untilTimestamp - right.untilTimestamp);
  const snoozedItemIds = new Set<string>(
    snoozedItems.map(snoozedItem => snoozedItem.itemId)
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
        {once: true}
      );
    }
  }

  // Display/hide the "no items" notice.
  noSnoozedItems.hidden = snoozedItems.length > 0;

  // Add/update all snoozed items to the list.
  for (const {itemId, url, title, untilTimestamp} of snoozedItems) {
    const snoozedItem =
      snoozedItemsList.querySelector(`[data-item-id="${itemId}"]`) ??
      (snoozedItemTemplate.content
        .querySelector('li')!
        .cloneNode(true) as HTMLLIElement);
    snoozedItem.setAttribute('data-item-id', itemId);

    (snoozedItem.querySelector('.item-link') as HTMLAnchorElement).href = url;
    snoozedItem.querySelector('.title-text')!.textContent = title;
    snoozedItem.querySelector('.snoozed-until-text')!.textContent = dayjs
      .unix(untilTimestamp)
      .calendar();

    const unsnoozeButton = snoozedItem.querySelector(
      '.unsnooze-button'
    ) as HTMLButtonElement;
    unsnoozeButton.addEventListener('click', async () => {
      console.debug('[unsnoozeButton] clicked');
      unsnoozeButton.disabled = true;
      snoozedItem.classList.add('unsnoozing');
      try {
        await sendMessage({action: Actions.UNSNOOZE, itemId: Number(itemId)});
        snoozedItem.classList.add('unsnoozed');
        snoozedItem.addEventListener(
          'transitionend',
          () => {
            snoozedItem.remove();
            noSnoozedItems.hidden = snoozedItemsList.children.length > 0;
          },
          {
            once: true,
          }
        );
      } catch (error) {
        displayToast(browser.i18n.getMessage('toastCannotUnsnooze'), error);
        unsnoozeButton.disabled = false;
      } finally {
        snoozedItem.classList.remove('unsnoozing');
      }
    });

    snoozedItemsList.appendChild(snoozedItem);
  }

  if (maybeSyncAfter) {
    return sync(false);
  }
}

/**
 * Syncs the snoozed items with the Pocket API.
 *
 * @param userInvoked true to force syncing regardless of how much time has
 *   passed since the last sync.
 */
export async function sync(userInvoked: boolean): Promise<void> {
  console.debug('[sync] called', {force: userInvoked});
  disableSyncButton();
  try {
    await sendMessage({action: Actions.SYNC, force: userInvoked});
  } catch (error) {
    console.error('[sync]', error);
    if (userInvoked) {
      displayToast(browser.i18n.getMessage('toastCannotSync'), error);
    }
  } finally {
    animationDelayedEnableSyncButton();
  }
}
