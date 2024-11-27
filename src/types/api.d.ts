/**
 * Types for Pocket API requests and responses.
 */
import {PocketRequestPath} from '../enums';

export declare type Item = {
  item_id: string;
  resolved_url: string;
  resolved_title: string;
  url: string;
  title: string;
  given_url: string;
  given_title: string;
};

export declare type AuthenticateRequest = {
  path: PocketRequestPath.REQUEST;
  params: {
    redirect_uri: string;
  };
};

export declare type AuthenticateResponse = {
  code: string;
};

export declare type AuthorizeRequest = {
  path: PocketRequestPath.AUTHORIZE;
  params: {
    code: string;
  };
};

export declare type AuthorizeResponse = {
  access_token: string;
  username: string;
};

export declare type AddItemRequest = {
  path: PocketRequestPath.ADD;
  params: {
    url: string;
    tags: 'snoozed';
  };
};

export declare type AddItemResponse = {
  status: '0' | '1';
  item: Item;
};

declare type AbstractAction = {
  action: string;
  item_id: string;
};

declare type ModifyArchiveAction = AbstractAction & {
  action: 'archive';
};

declare type ModifyReaddAction = AbstractAction & {
  action: 'readd';
};

declare type AddRemoveTagsAction = AbstractAction & {
  action: 'tags_add' | 'tags_remove';
  tags: string;
};

export type ModifyActions =
  | ModifyArchiveAction
  | ModifyReaddAction
  | AddRemoveTagsAction;

export declare type ModifyRequest = {
  path: PocketRequestPath.MODIFY;
  params: {
    actions: ModifyActions[];
  };
};

export declare type ModifyResponse = {
  status: '0' | '1';
};

export declare type RetrieveItemsRequest = {
  path: PocketRequestPath.RETRIEVE;
  params: {
    state?: 'unread' | 'archive' | 'all';
    tag: 'snoozed';
    detailsType: 'simple';
    since?: number;
  };
};

export declare type RetrieveItemsResponse = {
  status: '0' | '1';
  list: {
    [item_id: string]: Item;
  };
};
