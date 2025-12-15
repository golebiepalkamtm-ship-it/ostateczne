import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddMovieToListData {
  listMovie_insert: ListMovie_Key;
}

export interface AddMovieToListVariables {
  listId: UUIDString;
  movieId: UUIDString;
  note?: string | null;
  position: number;
}

export interface CreatePublicListData {
  list_insert: List_Key;
}

export interface CreatePublicListVariables {
  name: string;
  description?: string | null;
}

export interface GetPublicListsData {
  lists: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & List_Key)[];
}

export interface GetUserWatchListData {
  watches: ({
    id: UUIDString;
    movie: {
      id: UUIDString;
      title: string;
      year: number;
    } & Movie_Key;
      watchDate: DateString;
  } & Watch_Key)[];
}

export interface GetUserWatchListVariables {
  userId: UUIDString;
}

export interface ListMovie_Key {
  listId: UUIDString;
  movieId: UUIDString;
  __typename?: 'ListMovie_Key';
}

export interface List_Key {
  id: UUIDString;
  __typename?: 'List_Key';
}

export interface Movie_Key {
  id: UUIDString;
  __typename?: 'Movie_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Watch_Key {
  id: UUIDString;
  __typename?: 'Watch_Key';
}

interface CreatePublicListRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicListVariables): MutationRef<CreatePublicListData, CreatePublicListVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePublicListVariables): MutationRef<CreatePublicListData, CreatePublicListVariables>;
  operationName: string;
}
export const createPublicListRef: CreatePublicListRef;

export function createPublicList(vars: CreatePublicListVariables): MutationPromise<CreatePublicListData, CreatePublicListVariables>;
export function createPublicList(dc: DataConnect, vars: CreatePublicListVariables): MutationPromise<CreatePublicListData, CreatePublicListVariables>;

interface GetPublicListsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicListsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicListsData, undefined>;
  operationName: string;
}
export const getPublicListsRef: GetPublicListsRef;

export function getPublicLists(): QueryPromise<GetPublicListsData, undefined>;
export function getPublicLists(dc: DataConnect): QueryPromise<GetPublicListsData, undefined>;

interface AddMovieToListRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddMovieToListVariables): MutationRef<AddMovieToListData, AddMovieToListVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddMovieToListVariables): MutationRef<AddMovieToListData, AddMovieToListVariables>;
  operationName: string;
}
export const addMovieToListRef: AddMovieToListRef;

export function addMovieToList(vars: AddMovieToListVariables): MutationPromise<AddMovieToListData, AddMovieToListVariables>;
export function addMovieToList(dc: DataConnect, vars: AddMovieToListVariables): MutationPromise<AddMovieToListData, AddMovieToListVariables>;

interface GetUserWatchListRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserWatchListVariables): QueryRef<GetUserWatchListData, GetUserWatchListVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserWatchListVariables): QueryRef<GetUserWatchListData, GetUserWatchListVariables>;
  operationName: string;
}
export const getUserWatchListRef: GetUserWatchListRef;

export function getUserWatchList(vars: GetUserWatchListVariables): QueryPromise<GetUserWatchListData, GetUserWatchListVariables>;
export function getUserWatchList(dc: DataConnect, vars: GetUserWatchListVariables): QueryPromise<GetUserWatchListData, GetUserWatchListVariables>;

