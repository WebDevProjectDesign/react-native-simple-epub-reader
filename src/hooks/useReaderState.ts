import { defaultTheme } from '../constants/theme';
import {
  Actions,
  type BookActions,
  type InitialState,
} from '../types/state.types';

export const useReaderState = () => {
  const initialState: InitialState = {
    theme: defaultTheme,
    fontFamily: 'Helvetica',
    fontSize: '9pt',
    atStart: false,
    atEnd: false,
    key: '',
    totalLocations: 0,
    currentLocation: null,
    meta: {
      cover: '',
      author: '',
      title: '',
      description: '',
      language: '',
      publisher: '',
      rights: '',
    },
    progress: 0,
    locations: [],
    pagesPerSection: [],
    totalPages: 0,
    isPaginationReady: false,
    isLoading: true,
    isRendering: true,
    section: null,
    flow: 'paginated',
  };

  function bookReducer(state: InitialState, action: BookActions): InitialState {
    switch (action.type) {
      case Actions.CHANGE_FONT_SIZE:
        return {
          ...state,
          fontSize: action.payload,
        };
      case Actions.SET_AT_START:
        return {
          ...state,
          atStart: action.payload,
        };
      case Actions.SET_AT_END:
        return {
          ...state,
          atEnd: action.payload,
        };
      case Actions.SET_KEY:
        return {
          ...state,
          key: action.payload,
        };
      case Actions.SET_TOTAL_LOCATIONS:
        return {
          ...state,
          totalLocations: action.payload,
        };
      case Actions.SET_CURRENT_LOCATION: {
        const location = action.payload;

        // Self-correction: the hidden pagination rendition measures sections
        // right after render, so late-loading images/fonts can skew a count
        // by a page or two. The visible rendition reports the authoritative
        // page count of the current section on every relocation - adopt it,
        // otherwise the global page number would jump at chapter boundaries.
        let { pagesPerSection, totalPages } = state;
        const index = location?.start?.index;
        const measuredTotal = location?.start?.displayed?.total || 0;

        if (
          state.isPaginationReady &&
          measuredTotal > 0 &&
          typeof index === 'number' &&
          index >= 0 &&
          index < pagesPerSection.length &&
          pagesPerSection[index] !== measuredTotal
        ) {
          pagesPerSection = [...pagesPerSection];
          pagesPerSection[index] = measuredTotal;
          totalPages = pagesPerSection.reduce((sum, pages) => sum + pages, 0);
        }

        return {
          ...state,
          currentLocation: location,
          pagesPerSection,
          totalPages,
        };
      }
      case Actions.SET_META:
        return {
          ...state,
          meta: action.payload,
        };
      case Actions.SET_PROGRESS:
        return {
          ...state,
          progress: action.payload,
        };
      case Actions.SET_LOCATIONS:
        return {
          ...state,
          locations: action.payload,
        };
      case Actions.SET_PAGINATION:
        return {
          ...state,
          pagesPerSection: action.payload.pagesPerSection,
          totalPages: action.payload.totalPages,
          isPaginationReady: true,
        };
      case Actions.SET_IS_PAGINATION_READY:
        return {
          ...state,
          isPaginationReady: action.payload,
        };
      case Actions.SET_IS_LOADING:
        return {
          ...state,
          isLoading: action.payload,
        };
      case Actions.SET_IS_RENDERING:
        return {
          ...state,
          isRendering: action.payload,
        };
      case Actions.SET_SECTION:
        return {
          ...state,
          section: action.payload,
        };
      case Actions.SET_FLOW:
        return {
          ...state,
          flow: action.payload,
        };
      case Actions.CHANGE_THEME:
        return {
          ...state,
          theme: action.payload,
        };
      case Actions.CHANGE_FONT_FAMILY:
        return {
          ...state,
          fontFamily: action.payload,
        };
      default:
        return state;
    }
  }

  return { initialState, bookReducer };
};
