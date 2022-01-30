/**
 * Extension's popup page script.
 */
import type {Browser} from 'webextension-polyfill';
import {Actions} from '../enums';
import {localize} from '../localize';
import {setupActionTab} from './actions-tab';
import {sendMessage} from './message';
import {showAuthenticationPage, showInterface} from './page';
import {byId} from './shortcuts';
import {setupSnoozedTab} from './snoozed-list-tab';
import {setupTabs} from './tabs';

declare const browser: Browser;

const loginButton = byId('button-login') as HTMLButtonElement;

/**
 * Initializes the popup page.
 */
async function initialize(): Promise<void> {
  console.debug('[initialize] called');

  setupTabs();

  await localize();
  if (await sendMessage({action: Actions.IS_AUTHENTICATED})) {
    showInterface();
    await Promise.all([setupActionTab(), setupSnoozedTab(true)]);
  } else {
    showAuthenticationPage();
  }
}

loginButton.addEventListener('click', () => {
  console.debug('[loginButton] clicked');
  sendMessage({action: Actions.START_AUTHENTICATION});
  window.close();
});

browser.storage.onChanged.addListener((changes: {[key: string]: any}) => {
  console.debug('[browser.storage.onChange] listener invoked', {changes});
  if ('lastSynced' in changes) {
    setupSnoozedTab(false);
  }
});

initialize();
