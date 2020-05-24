/**
 * Messages sending helper.
 */
import type {Browser} from 'webextension-polyfill-ts';
import type {BooleanMessage, Message, VoidMessage} from '../types/messages';

declare const browser: Browser;

export function sendMessage(message: BooleanMessage): Promise<boolean>;
export function sendMessage(message: VoidMessage): Promise<void>;

/**
 * Sends a message to the background script.
 *
 * @param message the message to send.
 */
export async function sendMessage(message: Message) {
  console.debug('[sendMessage] called', {message});
  return browser.runtime.sendMessage(message);
}
