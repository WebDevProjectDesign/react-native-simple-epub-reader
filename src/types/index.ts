import type {
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';

export interface LocationChangeData {
  totalLocations: number;
  currentLocation: Location;
  progress: number;
  currentSection: Section | null;
}

export type Location = {
  atStart?: boolean;
  atEnd?: boolean;
  end: {
    cfi: ePubCfi;
    displayed: {
      page: number;
      total: number;
    };
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
  start: {
    cfi: ePubCfi;
    displayed: {
      page: number;
      total: number;
    };
    href: string;
    index: number;
    location: number;
    percentage: number;
  };
};

export type Section = {
  id: string;
  href: string;
  label: string;
  parent?: any;
  subitems: any[];
};

/**
 * @example
 * ````
 * epubcfi(/6/6!/4/2,/2/2/1:0,/4[q1]/2/14/2/1:14)
 * ````
 */
export type ePubCfi = string;

export enum SourceType {
  EPUB = 'epub',
}

export type Theme = {
  [key: string]: {
    [key: string]: string;
  };
};

export interface GestureHandlerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onPinchStart?: () => void;
  onPinch?: (e: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => void;
  onPinchEnd?: () => void;
  onWebViewMessage?: (event: any) => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export type LocationsCacheMissingParams = {
  cacheKey: string;
  src: string;
};

export type LocationsGeneratedData = {
  cacheKey?: string;
  epubKey: string;
  locations: ePubCfi[];
  src: string;
};

type BaseReaderProps = {
  src: string;
  cacheKey?: string;
  initialLocation?: string;
  beginAt?: number;
  waitForLocationsReady?: boolean;
  onLocationChange?: (data: LocationChangeData) => void;
  onLocationsReady?: (epubKey: string, locations: ePubCfi[]) => void;
  onLocationsGenerated?: (data: LocationsGeneratedData) => void | Promise<void>;
  onFinish?: () => void;
  onBeginning?: () => void;
  LoaderComponent?: React.ComponentType;
} & GestureHandlerProps;

type ReaderPropsWithoutRemoteCache = BaseReaderProps & {
  onLocationsCacheMissing?: undefined;
};

type ReaderPropsWithRemoteCache = BaseReaderProps & {
  cacheKey: string;
  onLocationsCacheMissing: (
    params: LocationsCacheMissingParams
  ) => Promise<ePubCfi[] | null | undefined>;
};

export type ReaderProps =
  | ReaderPropsWithoutRemoteCache
  | ReaderPropsWithRemoteCache;

export type Flow = 'paginated' | 'scrolled-doc';
