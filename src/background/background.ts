/**
 * Extension's background script.
 */
import * as dayjs from 'dayjs';
import * as calendar from 'dayjs/plugin/calendar';
import type {Browser, Runtime} from 'webextension-polyfill';
import {Actions} from '../enums';
import {PocketRequestError} from '../errors';
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
): Promise<boolean>;
function messageHandler(
  message: VoidMessage,
  sender: Runtime.MessageSender
): Promise<void>;
function messageHandler(
  message: Message,
  sender: Runtime.MessageSender
): Promise<PocketRequestError>;

/**
 * Message handler for browser.runtime.sendMessage messages from the popup page.
 *
 * @param message the message to handle.
 * @param sender the popup sender.
 */
async function messageHandler(message: Message, sender: Runtime.MessageSender) {
  console.debug('[messageHandler] called', {message, sender});

  // Actions that do not require being logged in.
  switch (message.action) {
    case Actions.START_AUTHENTICATION:
      return startAuthentication();

    case Actions.FINISH_AUTHENTICATION:
      browser.tabs.remove(sender.tab!.id!);
      return finishAuthentication(message.code);

    case Actions.IS_AUTHENTICATED:
      return isAuthenticated();
  }

  // Actions that require being logged in.
  try {
    switch (message.action) {
      case Actions.SYNC:
        return await sync(message.force);

      case Actions.SNOOZE:
        return await snooze(message.url, message.untilTimestamp);

      case Actions.UNSNOOZE:
        return await unsnooze(message.itemId);
    }
  } catch (error) {
    // Manually destruct this because Error objects are not passed properly.
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        xError:
          error instanceof PocketRequestError ? error.xError : '<unknown>',
      };
    }
    return {
      name: '<unknown>',
      message: '<unknown>',
      xError: '<unknown>',
    };
  }
}

browser.runtime.onMessage.addListener(messageHandler);

browser.alarms.onAlarm.addListener(
  createAlarmHandler(() => {
    return sync(true);
  })
);

// Unsnooze any items that should have been unsnoozed while we were offline.
// Delay by five minutes to allow Firefox Sync to retrieve any changes. This is
// to avoid immediately unsnoozing items that have been snoozed on a different
// device, but were then re-snoozed by the user.
browser.alarms.create('unsnooze', {when: dayjs().add(5, 'minute').valueOf()});
