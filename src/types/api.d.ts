/**
 * Types for Pocket API requests and responses. 
 */
import {PocketRequestPath} from '../enums';

declare type Item = {
  item_id: string;
  resolved_url: string;
  resolved_title: string;
  url: string;
  title: string;
  given_url: string;
  given_title: string;
};

declare type AuthenticateRequest = {
  path: PocketRequestPath.REQUEST;
  params: {
    redirect_uri: string;
  }
}

declare type AuthenticateResponse = {
  code: string;
}

declare type AuthorizeRequest = {
  path: PocketRequestPath.AUTHORIZE;
  params: {
    code: string;
  }
}

declare type AuthorizeResponse = {
  access_token: string;
  username: string;
}

declare type AddItemRequest = {
  path: PocketRequestPath.ADD;
  params: {
    url: string;
    tags: 'snoozed';
  }
}

declare type AddItemResponse = {
  status: '0' | '1';
  item: Item;
}

declare type ArchiveItemRequest = {
  path: PocketRequestPath.MODIFY;
  params: {
    actions: Array<{
      action: 'archive';
      item_id: string;
    }>
  }
}

declare type ArchiveItemResponse = {
  status: '0' | '1';
}

declare type ReaddItemRequest = {
  path: PocketRequestPath.MODIFY;
  params: {
    actions: Array<{
      action: 'readd';
      item_id: string;
    }>
  }
}

declare type ReaddItemResponse = {
  status: '0' | '1';
}

declare type RetrieveItemsRequest = {
  path: PocketRequestPath.RETRIEVE;
  params: {
    tag: 'snoozed';
    detailsType: 'simple';
    since: number;
  }
}

declare type RetrieveItemsResponse = {
  status: '0' | '1';
  list: {
    [item_id: string]: Item;
  };
}
