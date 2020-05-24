/**
 * Verifies that the application was authorized by hijacking a nonexistent page
 * under https://getpocket.com/auth/verify/ (a URL that in itself does not
 * exist).
 */
import type {Browser} from 'webextension-polyfill-ts';
import {Actions} from './enums';

declare const browser: Browser;

const [, code] = /\/([\w-]+)$/.exec(window.location.pathname)!;

browser.runtime.sendMessage({action: Actions.FINISH_AUTHENTICATION, code});
