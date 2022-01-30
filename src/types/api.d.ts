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

export declare type ArchiveItemRequest = {
  path: PocketRequestPath.MODIFY;
  params: {
    actions: Array<{
      action: 'archive';
      item_id: string;
    }>;
  };
};

export declare type ArchiveItemResponse = {
  status: '0' | '1';
};

export declare type ReaddItemRequest = {
  path: PocketRequestPath.MODIFY;
  params: {
    actions: Array<{
      action: 'readd';
      item_id: string;
    }>;
  };
};

export declare type ReaddItemResponse = {
  status: '0' | '1';
};

export declare type RetrieveItemsRequest = {
  path: PocketRequestPath.RETRIEVE;
  params: {
    tag: 'snoozed';
    detailsType: 'simple';
    since: number;
  };
};

export declare type RetrieveItemsResponse = {
  status: '0' | '1';
  list: {
    [item_id: string]: Item;
  };
};
