import {byId} from './shortcuts';

const TOAST_DURATION = 8000;

const toastDiv = byId('toast');
const toastText = byId('text-toast');
const closeToastButton = byId('button-close-toast');

let activeTimeout: number | undefined;

/**
 * Displays an error message in a toast.
 *
 * @param message text to display.
 * @param displayDuration how long to display the toast.
 */
export function displayToast(message: string): void {
  console.debug('[displayToast] called', {message});
  toastDiv.classList.remove('hidden');
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
