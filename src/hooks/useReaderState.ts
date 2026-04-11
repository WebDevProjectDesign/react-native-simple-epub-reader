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
      case Actions.SET_CURRENT_LOCATION:
        return {
          ...state,
          currentLocation: action.payload,
        };
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
