import {browser} from 'webextension-polyfill-ts';
import {PocketAuthenticationError, PocketRequestError} from '../errors';
import {showAuthenticationPage} from './page';
import {byId} from './shortcuts';

const TOAST_DURATION = 8000;

const toastDiv = byId('toast');
const toastText = byId('text-toast');
const closeToastButton = byId('button-close-toast');

let activeTimeout: number | undefined;

/**
 * Displays an error message in a toast.
 *
 * If the optional error argument is passed and it is an instance of
 * PocketAuthenticationError, the message is overridden with one informing the
 * user that they have been logged out, and the interface is replaced with the
 * login page.
 *
 * @param message text to display.
 * @param error returned from the backend.
 */
export function displayToast(
  message: string,
  error?: PocketRequestError
): void {
  console.debug('[displayToast] called', {message, error});
  toastDiv.classList.remove('hidden');

  if (error instanceof PocketAuthenticationError) {
    message = browser.i18n.getMessage('toastNotLoggedIn');
    showAuthenticationPage();
  }
  toastText.textContent = message;

  closeToastButton.hidden = true;
  clearTimeout(activeTimeout);
  activeTimeout = setTimeout(() => {
    console.debug('[setTimeout] callback invoked after', TOAST_DURATION, 'ms');
    toastDiv.classList.add('hidden');
  }, TOAST_DURATION);
}

function initialize() {
  closeToastButton.addEventListener('click', () => {
    console.debug('[closeToastButton] clicked');
    toastDiv.classList.add('hidden');
  });
}

initialize();
