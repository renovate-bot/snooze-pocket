/**
 * Shared enums.
 */
export enum Actions {
  START_AUTHENTICATION = 'start_authentication',
  FINISH_AUTHENTICATION = 'finish_authentication',
  IS_AUTHENTICATED = 'is_authenticated',

  SYNC = 'sync',
  SNOOZE = 'snooze',
  UNSNOOZE = 'unsnooze',
}

export enum PocketRequestPath {
  REQUEST = '/oauth/request',
  AUTHORIZE = '/oauth/authorize',

  ADD = '/add',
  MODIFY = '/send',
  RETRIEVE = '/get',
}
