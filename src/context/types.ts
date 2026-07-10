import type WebView from 'react-native-webview';
import type { ePubCfi, Location, PaginationData, Theme } from '../types';

export type PaginateOptions = {
  keepScrollOffset?: boolean;
};

export interface ReaderContextProps {
  goToLocation: (cfi: ePubCfi) => void;
  registerBook: (bookRef: WebView) => void;
  goPrevious: (options?: PaginateOptions) => void;
  goNext: (options?: PaginateOptions) => void;
  setAtStart: (atStart: boolean) => void;
  setAtEnd: (atEnd: boolean) => void;
  setTotalLocations: (totalLocations: number) => void;
  setCurrentLocation: (location: Location) => void;
  setMeta: (meta: {
    cover: string | ArrayBuffer | null | undefined;
    author: string;
    title: string;
    description: string;
    language: string;
    publisher: string;
    rights: string;
  }) => void;
  setProgress: (progress: number) => void;
  setLocations: (locations: ePubCfi[]) => void;
  setPagination: (pagination: PaginationData) => void;
  setIsPaginationReady: (isPaginationReady: boolean) => void;

  getLocations: () => ePubCfi[];
  getCurrentLocation: () => Location | null;
  getMeta: () => {
    cover: string | ArrayBuffer | null | undefined;
    author: string;
    title: string;
    description: string;
    language: string;
    publisher: string;
    rights: string;
  };
  theme: Theme;
  atStart: boolean;
  atEnd: boolean;
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
  isLoading?: boolean;
  setIsLoading: (isLoading: boolean) => void;
  progress: number;
  locations: ePubCfi[];
  /** Real page counts per spine section; empty until pagination finishes. */
  pagesPerSection: number[];
  /** Total rendered pages in the book (0 until pagination finishes). */
  totalPages: number;
  /** 1-based page number of the current view (0 until pagination finishes). */
  currentPage: number;
  /**
   * False while page counts are being (re)computed, e.g. right after opening
   * the book or after a font size / viewport change.
   */
  isPaginationReady: boolean;
  injectJavascript: (script: string) => void;
  changeFontSize: (fontSize: string) => void;
  changeTheme: (theme: Theme) => void;
  fontSize: string;
}
