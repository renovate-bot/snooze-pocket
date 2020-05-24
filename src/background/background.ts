/**
 * Extension's background script.
 */
import * as dayjs from 'dayjs';
import * as calendar from 'dayjs/plugin/calendar'; // tslint:disable-line: no-submodule-imports
import type {Browser, Runtime} from 'webextension-polyfill-ts';
import {Actions} from '../enums';
import type {BooleanMessage, Message, VoidMessage} from '../types/messages';
import {createAlarmHandler} from './alarm';
import {snooze, sync, unsnooze} from './api-actions';
import {
  finishAuthentication,
  isAuthenticated,
  startAuthentication,
} from './authentication';

declare const browser: Browser;

dayjs.extend(calendar);

function messageHandler(
  message: BooleanMessage,
  sender: Runtime.MessageSender
): Promise<void>;
function messageHandler(
  message: VoidMessage,
  sender: Runtime.MessageSender
): Promise<boolean>;

/**
 * Message handler for browser.runtime.sendMessage messages from the popup page.
 */
async function messageHandler(message: Message, sender: Runtime.MessageSender) {
  console.debug('[messageHandler] called', {message, sender});
  const tabId = sender.tab?.id!;

  switch (message.action) {
    case Actions.START_AUTHENTICATION:
      return startAuthentication();

    case Actions.FINISH_AUTHENTICATION:
      browser.tabs.remove(tabId);
      return finishAuthentication(message.code);

    case Actions.IS_AUTHENTICATED:
      return isAuthenticated();

    case Actions.SYNC:
      return sync(message.force);

    case Actions.SNOOZE:
      return snooze(message.url, message.untilTimestamp);

    case Actions.UNSNOOZE:
      return unsnooze(message.itemId);
  }
}

browser.runtime.onMessage.addListener(messageHandler);

browser.alarms.onAlarm.addListener(
  createAlarmHandler(() => {
    return sync(true);
  })
);

// Unsnooze any items that should have been unsnoozed while we were offline.
browser.alarms.create('unsnooze', {when: dayjs().valueOf()});
