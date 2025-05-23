/**
 * Extension's popup page script.
 */
import type {Browser} from 'webextension-polyfill';
import {localize} from '../localize';
import {setupSnoozedTab} from './snoozed-list-tab';
import {displayToast} from './toast';

declare const browser: Browser;

/**
 * Initializes the popup page.
 */
async function initialize(): Promise<void> {
  console.debug('[initialize] called');

  displayToast(browser.i18n.getMessage('toastPocketIsGoingAway'));

  await localize();
  await setupSnoozedTab();
}

browser.storage.onChanged.addListener((changes: {[key: string]: any}) => {
  console.debug('[browser.storage.onChange] listener invoked', {changes});
  if ('lastSynced' in changes) {
    setupSnoozedTab();
  }
});

initialize();
