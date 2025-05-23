import {byId} from './shortcuts';

const toastText = byId('text-toast');

/**
 * Displays an error message in a toast.
 *
 * If the optional error argument is passed and it is an instance of
 * PocketAuthenticationError, the message is overridden with one informing the
 * user that they have been logged out, and the interface is replaced with the
 * login page.
 *
 * @param message text to display.
 */
export function displayToast(message: string): void {
  console.debug('[displayToast] called', {message});
  toastText.textContent = message;
}
