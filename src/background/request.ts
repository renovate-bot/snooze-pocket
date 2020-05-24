/**
 * Network requests adapter with Pocket API.
 */
import type {Browser} from 'webextension-polyfill-ts';
import type {
  AddItemRequest,
  AddItemResponse,
  ArchiveItemRequest,
  ArchiveItemResponse,
  AuthenticateRequest,
  AuthenticateResponse,
  AuthorizeRequest,
  AuthorizeResponse,
  ReaddItemRequest,
  ReaddItemResponse,
  RetrieveItemsRequest,
  RetrieveItemsResponse,
} from '../types/api';

declare const browser: Browser;

const CONSUMER_KEY = '92317-a9b11a7abf027884986ecd0d';

export function pocketRequest(
  request: AuthenticateRequest
): Promise<AuthenticateResponse>;
export function pocketRequest(
  request: AuthorizeRequest
): Promise<AuthorizeResponse>;
export function pocketRequest(
  request: AddItemRequest
): Promise<AddItemResponse>;
export function pocketRequest(
  request: ArchiveItemRequest
): Promise<ArchiveItemResponse>;
export function pocketRequest(
  request: ReaddItemRequest
): Promise<ReaddItemResponse>;
export function pocketRequest(
  request: RetrieveItemsRequest
): Promise<RetrieveItemsResponse>;

/**
 * Sends a request to the Pocket API.
 *
 * @param request a request object as defined by the Pocket API documentation.
 */
export async function pocketRequest(
  request:
    | AuthenticateRequest
    | AuthorizeRequest
    | AddItemRequest
    | ArchiveItemRequest
    | ReaddItemRequest
    | RetrieveItemsRequest
) {
  console.debug('[pocketRequest] called', {request});
  const {accessToken} = await browser.storage.sync.get({accessToken: null});
  const maybeAccessTokenParam = accessToken ? {access_token: accessToken} : {};
  const params = {
    consumer_key: CONSUMER_KEY,
    ...maybeAccessTokenParam,
    ...request.params,
  };

  const response = await fetch(`https://getpocket.com/v3${request.path}`, {
    body: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Accept': 'application/json',
    },
    method: 'POST',
  });
  console.debug('[pocketRequest] response:', response);
  if (!response.ok) {
    let error: Error;
    const xError = response.headers.get('X-Error') ?? '<unknown>';
    if (accessToken && response.status === 401) {
      error = new Error(
        `User is not authorized with Pocket: ${response.status} ${response.statusText} [${xError}]`
      );
      await browser.storage.sync.remove('accessToken');
    } else {
      error = new Error(
        `Pocket API error: ${response.status} ${response.statusText} [${xError}]`
      );
    }
    console.error('[pocketRequest]', error.message);
    throw error;
  }

  const json = await response.json();
  console.debug('[pocketRequest] response.json():', json);
  return json;
}
