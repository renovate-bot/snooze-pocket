/**
 * Messages sending helper.
 */
import type {Browser} from 'webextension-polyfill';
import {ERROR_BY_NAME, PocketRequestError} from '../errors';
import type {BooleanMessage, Message, VoidMessage} from '../types/messages';

declare const browser: Browser;

export function sendMessage(message: BooleanMessage): Promise<boolean>;
export function sendMessage(message: VoidMessage): Promise<void>;
export function sendMessage(message: Message): Promise<PocketRequestError>;

/**
 * Sends a message to the background script.
 *
 * @param message the message to send.
 */
export async function sendMessage(message: Message) {
  console.debug('[sendMessage] called', {message});
  const response = await browser.runtime.sendMessage(message);
  if (response?.name in ERROR_BY_NAME) {
    const ErrorType = ERROR_BY_NAME[response.name];
    console.error(
      '[sendMessage] background page returned an error:',
      ErrorType,
      response,
    );
    throw new ErrorType(response.message, response.xError);
  }
  return response;
}
