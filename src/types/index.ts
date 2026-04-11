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
}

export type ReaderProps = {
  src: string;
  initialLocation?: string;
  onLocationChange?: (data: LocationChangeData) => void;
  onLocationsReady?: (epubKey: string, locations: ePubCfi[]) => void;
  onFinish?: () => void;
  onBeginning?: () => void;
} & GestureHandlerProps;

export type Flow = 'paginated' | 'scrolled-doc';
