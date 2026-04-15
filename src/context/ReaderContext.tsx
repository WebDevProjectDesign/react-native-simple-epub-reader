import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { ReaderContextProps } from './types';
import { defaultTheme } from '../constants/theme';
import type WebView from 'react-native-webview';
import * as webViewInjectFunctions from '../helpers/webViewInjectFunctions';
import type { ePubCfi, Flow, Location, Theme } from '../types';
import { useReaderState } from '../hooks/useReaderState';
import { Actions } from '../types/state.types';

const ReaderContext = createContext<ReaderContextProps>({
  registerBook: () => {},
  setAtStart: () => {},
  setAtEnd: () => {},
  setTotalLocations: () => {},
  setCurrentLocation: () => {},
  setMeta: () => {},
  setProgress: () => {},
  setLocations: () => {},

  goToLocation: () => {},
  goPrevious: () => {},
  goNext: () => {},
  getLocations: () => [],
  getCurrentLocation: () => null,
  getMeta: () => ({
    cover: '',
    author: '',
    title: '',
    description: '',
    language: '',
    publisher: '',
    rights: '',
  }),

  atStart: false,
  atEnd: false,
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
  theme: defaultTheme,

  injectJavascript: () => {},
  changeFontSize: () => {},
  changeTheme: () => {},
  fontSize: '9pt',

  isLoading: false,
  setIsLoading: () => {},
});

function ReaderProvider({ children }: { children: React.ReactNode }) {
  const { bookReducer, initialState } = useReaderState();
  const [state, dispatch] = useReducer(bookReducer, initialState);
  const [loading, setLoading] = useState<boolean>(true);
  const book = useRef<WebView | null>(null);

  const registerBook = useCallback((bookRef: WebView) => {
    book.current = bookRef;
  }, []);

  const setAtStart = useCallback((atStart: boolean) => {
    dispatch({ type: Actions.SET_AT_START, payload: atStart });
  }, []);
  const setAtEnd = useCallback((atEnd: boolean) => {
    dispatch({ type: Actions.SET_AT_END, payload: atEnd });
  }, []);

  const setTotalLocations = useCallback((totalLocations: number) => {
    dispatch({ type: Actions.SET_TOTAL_LOCATIONS, payload: totalLocations });
  }, []);

  const setCurrentLocation = useCallback((location: Location) => {
    dispatch({ type: Actions.SET_CURRENT_LOCATION, payload: location });
  }, []);

  const setMeta = useCallback(
    (meta: {
      cover: string | ArrayBuffer | null | undefined;
      author: string;
      title: string;
      description: string;
      language: string;
      publisher: string;
      rights: string;
    }) => {
      dispatch({ type: Actions.SET_META, payload: meta });
    },
    []
  );

  const setProgress = useCallback((progress: number) => {
    dispatch({ type: Actions.SET_PROGRESS, payload: progress });
  }, []);

  const setLocations = useCallback((locations: ePubCfi[]) => {
    dispatch({ type: Actions.SET_LOCATIONS, payload: locations });
  }, []);

  const getLocations = useCallback(() => state.locations, [state.locations]);

  const getCurrentLocation = useCallback(
    () => state.currentLocation,
    [state.currentLocation]
  );

  const getMeta = useCallback(() => state.meta, [state.meta]);
  const changeFontFamily = useCallback((fontFamily: string) => {
    book.current?.injectJavaScript(`
      rendition.themes.font('${fontFamily}');
      rendition.views().forEach(view => view.pane ? view.pane.render() : null); true;
    `);
    dispatch({ type: Actions.CHANGE_FONT_FAMILY, payload: fontFamily });
  }, []);

  const injectJavascript = useCallback((script: string) => {
    book.current?.injectJavaScript(script);
  }, []);

  const changeFlow = useCallback((flow: Flow) => {
    webViewInjectFunctions.injectJavaScript(
      book,
      `rendition.flow(${JSON.stringify(flow)}); true`
    );
    dispatch({ type: Actions.SET_FLOW, payload: flow });
  }, []);

  const setFlow = useCallback((flow: Flow) => {
    dispatch({ type: Actions.SET_FLOW, payload: flow });
  }, []);

  const changeTheme = useCallback((theme: Theme) => {
    book.current?.injectJavaScript(`
      rendition.themes.register({ theme: ${JSON.stringify(theme)} });
      rendition.themes.select('theme');
      rendition.views().forEach(view => view.pane ? view.pane.render() : null); true;
    `);
    dispatch({ type: Actions.CHANGE_THEME, payload: theme });
  }, []);

  const goNext = useCallback(() => {
    webViewInjectFunctions.injectJavaScript(
      book,
      `
        rendition.next();
      `
    );
  }, []);

  const goPrevious = useCallback(() => {
    webViewInjectFunctions.injectJavaScript(
      book,
      `
        rendition.prev();
      `
    );
  }, []);

  const goToLocation = useCallback((targetCfi: ePubCfi) => {
    book.current?.injectJavaScript(`rendition.display('${targetCfi}'); true`);
  }, []);

  const changeFontSize = useCallback((size: string) => {
    book.current?.injectJavaScript(`
      rendition.themes.fontSize('${size}');
      rendition.views().forEach(view => view.pane ? view.pane.render() : null); true;
    `);
    dispatch({ type: Actions.CHANGE_FONT_SIZE, payload: size });
  }, []);

  const contextValue = useMemo(
    () => ({
      registerBook,
      goToLocation,
      goNext,
      goPrevious,
      setAtStart,
      setAtEnd,
      setTotalLocations,
      setCurrentLocation,
      changeTheme,
      getLocations,
      getCurrentLocation,
      getMeta,
      setMeta,
      setProgress,
      setLocations,
      changeFontFamily,
      injectJavascript,
      changeFlow,
      setFlow,
      changeFontSize,
      theme: state.theme,
      flow: state.flow,
      fontSize: state.fontSize,
      atStart: state.atStart,
      atEnd: state.atEnd,
      totalLocations: state.totalLocations,
      currentLocation: state.currentLocation,
      meta: state.meta,
      progress: state.progress,
      locations: state.locations,
      isLoading: loading,
      setIsLoading: setLoading,
    }),
    [
      registerBook,
      goNext,
      goPrevious,
      goToLocation,
      setAtStart,
      setAtEnd,
      setTotalLocations,
      setCurrentLocation,
      changeTheme,
      getLocations,
      getCurrentLocation,
      getMeta,
      setMeta,
      setProgress,
      setLocations,
      changeFontFamily,
      injectJavascript,
      changeFlow,
      setFlow,
      changeFontSize,
      state.theme,
      state.flow,
      state.fontSize,
      state.atStart,
      state.atEnd,
      state.totalLocations,
      state.currentLocation,
      state.meta,
      state.progress,
      state.locations,
      loading,
      setLoading,
    ]
  );

  return (
    <ReaderContext.Provider value={contextValue}>
      {children}
    </ReaderContext.Provider>
  );
}

export { ReaderContext, ReaderProvider };
