import type {Browser} from 'webextension-polyfill';
import {PocketRequestPath} from '../enums';
import {pocketRequest} from './request';

const REDIRECT_URI = 'https://getpocket.com/auth/verify';

declare const browser: Browser;

/**
 * Requests a token to start authentication with Pocket.
 */
async function requestToken(): Promise<string> {
  console.debug('[requestToken] called');
  const {code} = await pocketRequest({
    path: PocketRequestPath.REQUEST,
    params: {
      redirect_uri: REDIRECT_URI,
    },
  });
  return code;
}

/**
 * (Naively) checks whether the user is already authenticated with Pocket.
 */
export async function isAuthenticated(): Promise<boolean> {
  console.debug('[isAuthenticated] called');
  const {accessToken} = await browser.storage.sync.get({accessToken: null});
  return Boolean(accessToken);
}

/**
 * Starts the authentication process with Pocket.
 */
export async function startAuthentication(): Promise<void> {
  console.debug('[startAuthentication] called');

  const code = await requestToken();
  console.debug('[startAuthentication] Received authentication code', code);

  await browser.tabs.create({
    active: true,
    url: `https://getpocket.com/auth/authorize?request_token=${code}&redirect_uri=${REDIRECT_URI}/${code}`,
  });

  console.debug(
    '[startAuthentication] Waiting for user to accept/reject the authentication request'
  );
}

/**
 * Verifies that the authentication request was approved by the user and gets a
 * permanent access token.
 *
 * @param code authentication code from Pocket.
 */
export async function finishAuthentication(code: string): Promise<void> {
  console.debug('[finishAuthentication] called', {
    code,
  });
  const {access_token: accessToken, username} = await pocketRequest({
    path: PocketRequestPath.AUTHORIZE,
    params: {code},
  });

  console.debug(
    '[startAuthentication] User is now authenticated with Pocket as',
    username
  );
  await browser.storage.sync.set({accessToken, username});
}
