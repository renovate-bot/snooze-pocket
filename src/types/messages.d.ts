/**
 * Types for messages being passed between background and popup script.
 */
import type {Actions} from '../enums';

declare type StartAuthenticationMessage = {
  action: Actions.START_AUTHENTICATION;
};

declare type FinishAuthenticationMessage = {
  action: Actions.FINISH_AUTHENTICATION;
  code: string;
};

declare type IsAuthenticatedMessage = {
  action: Actions.IS_AUTHENTICATED;
};

declare type SyncMessage = {
  action: Actions.SYNC;
  force: boolean;
};

declare type SnoozeMessage = {
  action: Actions.SNOOZE;
  url: string;
  untilTimestamp: number;
};

declare type UnsnoozeMessage = {
  action: Actions.UNSNOOZE;
  itemId: number;
};

declare type ArchiveMessage = {
  action: Actions.ARCHIVE;
  itemId: number;
};

export declare type BooleanMessage = IsAuthenticatedMessage;
export declare type VoidMessage =
  | StartAuthenticationMessage
  | FinishAuthenticationMessage
  | SnoozeMessage
  | SyncMessage
  | UnsnoozeMessage
  | ArchiveMessage;
export declare type Message = BooleanMessage | VoidMessage;
