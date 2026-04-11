import type { ePubCfi, Flow, Location, Section, Theme } from './index';

export enum Actions {
  CHANGE_FONT_SIZE = 'CHANGE_FONT_SIZE',
  SET_AT_START = 'SET_AT_START',
  SET_AT_END = 'SET_AT_END',
  SET_KEY = 'SET_KEY',
  SET_TOTAL_LOCATIONS = 'SET_TOTAL_LOCATIONS',
  SET_CURRENT_LOCATION = 'SET_CURRENT_LOCATION',
  SET_META = 'SET_META',
  SET_PROGRESS = 'SET_PROGRESS',
  SET_LOCATIONS = 'SET_LOCATIONS',
  SET_IS_LOADING = 'SET_IS_LOADING',
  SET_IS_RENDERING = 'SET_IS_RENDERING',
  SET_SECTION = 'SET_SECTION',
  SET_TOC = 'SET_TOC',
  SET_LANDMARKS = 'SET_LANDMARKS',
  SET_FLOW = 'SET_FLOW',
  CHANGE_THEME = 'CHANGE_THEME',
  CHANGE_FONT_FAMILY = 'CHANGE_FONT_FAMILY',
}

type BookPayload = {
  [Actions.CHANGE_THEME]: Theme;
  [Actions.CHANGE_FONT_SIZE]: string;
  [Actions.SET_AT_START]: boolean;
  [Actions.SET_AT_END]: boolean;
  [Actions.SET_KEY]: string;
  [Actions.SET_TOTAL_LOCATIONS]: number;
  [Actions.SET_CURRENT_LOCATION]: Location;
  [Actions.SET_META]: {
    cover: string | ArrayBuffer | null | undefined;
    author: string;
    title: string;
    description: string;
    language: string;
    publisher: string;
    rights: string;
  };
  [Actions.SET_PROGRESS]: number;
  [Actions.SET_LOCATIONS]: ePubCfi[];
  [Actions.SET_IS_LOADING]: boolean;
  [Actions.SET_IS_RENDERING]: boolean;
  [Actions.SET_SECTION]: Section | null;
  [Actions.SET_FLOW]: Flow;
  [Actions.CHANGE_FONT_FAMILY]: string;
};

type ActionMap<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export type BookActions = ActionMap<BookPayload>[keyof ActionMap<BookPayload>];

export type InitialState = {
  theme: Theme;
  fontFamily: string;
  fontSize: string;
  atStart: boolean;
  atEnd: boolean;
  key: string;
  totalLocations: number;
  currentLocation: Location | null;
  meta: {
    cover: string | ArrayBuffer | null | undefined;
    author: string;
    title: string;
    description: string;
    language: string;
    publisher: string;
    rights: string;
  };
  progress: number;
  locations: ePubCfi[];
  isLoading: boolean;
  isRendering: boolean;
  section: Section | null;
  flow: Flow;
};
