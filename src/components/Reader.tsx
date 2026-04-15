import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SourceType, type ReaderProps } from '../types';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadScripts } from '../helpers/loadScripts';
import {
  checkTemplateFileExists,
  getTemplateFileUri,
  saveTemplateToFile,
} from '../helpers/saveTemplateToFile';
import { downloadEpub } from '../helpers/downloadEpub';
import { Paths } from 'expo-file-system';
import { useInjectWebViewVariables } from '../hooks/useInjectWebviewVariables';
import WebView from 'react-native-webview';
import GestureHandler from './GestureHandler';
import { defaultTheme as initialTheme } from '../constants/theme';
import { ReaderContext } from '../context/ReaderContext';
import type {
  GestureUpdateEvent,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import INTERNAL_EVENTS from '../constants/internalEvents';

const Reader = ({
  src,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  initialLocation,
  beginAt,
  waitForLocationsReady = false,
  onLocationsReady = () => {},
  onLocationChange = () => {},
  onFinish = () => {},
  onBeginning = () => {},
  onPinch = () => {},
  LoaderComponent,
  onWebViewMessage,
}: ReaderProps) => {
  const [templateUri, setTemplateUri] = useState<string>('');
  const pinchStartFontSizeRef = useRef<number | null>(null);
  const hasAppliedBeginAtRef = useRef(false);
  const templateAssetsRef = useRef<{
    jszip: string;
    epubjs: string;
    localEpubUri: string;
  } | null>(null);
  const hasPersistedLocationsRef = useRef(false);
  const hasLocationsReadyRef = useRef(false);

  const {
    registerBook,
    goNext,
    goPrevious,
    setMeta,
    setLocations,
    setTotalLocations,
    setCurrentLocation,
    setProgress,
    goToLocation,
    setAtEnd,
    setAtStart,
    fontSize,
    changeFontSize,
    setIsLoading,
    isLoading,
  } = useContext(ReaderContext);

  const { injectWebViewVariables } = useInjectWebViewVariables();
  const bookRef = useRef<WebView | null>(null);

  const goToProgress = useCallback((progress: number) => {
    const normalizedProgress =
      progress > 1
        ? Math.min(Math.max(progress / 100, 0), 1)
        : Math.min(Math.max(progress, 0), 1);

    bookRef.current?.injectJavaScript(`
      if (
        typeof rendition !== 'undefined' &&
        rendition &&
        typeof book !== 'undefined' &&
        book &&
        book.locations &&
        typeof book.locations.cfiFromPercentage === 'function'
      ) {
        const targetCfi = book.locations.cfiFromPercentage(${normalizedProgress});
        if (targetCfi) {
          rendition.display(targetCfi);
        }
      }
      true;
    `);
  }, []);

  const onMessage = (event: any) => {
    let parsedEvent;
    try {
      parsedEvent = JSON.parse(event.nativeEvent.data);
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
      return;
    }

    if (!INTERNAL_EVENTS.includes(parsedEvent?.type) && onWebViewMessage) {
      return onWebViewMessage(parsedEvent);
    }

    switch (parsedEvent.type) {
      case 'onLocationChange':
        const { totalLocations, currentLocation, progress, currentSection } =
          parsedEvent;

        if (currentLocation.atStart) setAtStart(true);
        else if (currentLocation.atEnd) setAtEnd(true);
        else {
          setAtStart(false);
          setAtEnd(false);
        }

        onLocationChange?.({
          totalLocations,
          currentLocation,
          progress,
          currentSection,
        });
        break;
      case 'meta':
        const { metadata } = parsedEvent;
        setMeta(metadata);
        break;
      case 'onLocationsReady':
        const props = parsedEvent;
        hasLocationsReadyRef.current = true;
        setLocations(parsedEvent.locations);
        setTotalLocations(props.totalLocations);
        setCurrentLocation(props.currentLocation);
        setProgress(props.progress);
        setIsLoading(false);

        if (
          typeof beginAt === 'number' &&
          !initialLocation &&
          !hasAppliedBeginAtRef.current
        ) {
          goToProgress(beginAt);
          hasAppliedBeginAtRef.current = true;
        }

        onLocationsReady(props.epubKey, parsedEvent.locations);

        if (
          parsedEvent.locations?.length &&
          templateAssetsRef.current &&
          !hasPersistedLocationsRef.current
        ) {
          setTimeout(() => {
            const assets = templateAssetsRef.current;
            if (!assets) return;

            try {
              const generatedTemplateWithLocations = injectWebViewVariables({
                jszip: assets.jszip,
                epubjs: assets.epubjs,
                type: SourceType.EPUB,
                allowScriptedContent: true,
                book: assets.localEpubUri,
                theme: initialTheme,
                locations: parsedEvent.locations,
              });

              saveTemplateToFile(
                generatedTemplateWithLocations,
                htmlTemplateName
              );
              hasPersistedLocationsRef.current = true;
            } catch (persistError) {
              console.warn('Failed to persist cached locations:', persistError);
            }
          }, 0);
        }

        break;
      case 'onReady':
        if (!waitForLocationsReady) {
          setIsLoading(false);
        }
        if (initialLocation) {
          goToLocation(initialLocation);
        }
        break;
      case 'onDisplayError':
        setIsLoading(false);
        console.error('Reader display error:', parsedEvent.reason);
        break;

      case 'onBeginning':
        setAtStart(true);

        return onBeginning();

      case 'onFinish':
        setAtEnd(true);

        return onFinish();

      default:
        console.warn('Unknown message type:', parsedEvent.type);
    }
  };

  const handleOnTap = () => {
    onTap?.();
  };

  const handleOnSwipeLeft = () => {
    onSwipeLeft?.();
    goNext();
  };

  const handleOnSwipeRight = () => {
    onSwipeRight?.();
    goPrevious();
  };

  const handleOnPinch = (
    e: GestureUpdateEvent<PinchGestureHandlerEventPayload>
  ) => {
    if (pinchStartFontSizeRef.current === null) {
      pinchStartFontSizeRef.current = parseFloat(fontSize.replace('pt', ''));
    }

    const baseFontSize = pinchStartFontSizeRef.current;
    const sensitivity = 0.5;
    const adjustedScale = 1 + (e.scale - 1) * sensitivity;
    const scaledFontSize = baseFontSize * adjustedScale;
    const clampedFontSize = Math.min(Math.max(scaledFontSize, 9), 32);
    const smoothedFontSize = Math.round(clampedFontSize * 2) / 2;

    changeFontSize(`${smoothedFontSize}pt`);
    onPinch?.(e);
  };

  const handleOnPinchStart = () => {
    pinchStartFontSizeRef.current = parseFloat(fontSize.replace('pt', ''));
  };

  const handleOnPinchEnd = () => {
    pinchStartFontSizeRef.current = null;
  };

  const epubFileName = useMemo(() => {
    const splited = src.split('/').pop() || 'book.epub';
    const cleanName = splited.split('?')[0] || 'book.epub';
    const decoded = decodeURIComponent(cleanName)
      .replace(' ', '_')
      .replace(',', '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    return decoded;
  }, [src]);

  const htmlTemplateName = useMemo(
    () =>
      epubFileName
        .replace('.epub', '-template.html')
        .replace('.zip', '-template.html'),
    [epubFileName]
  );

  const handleBookRef = useCallback(
    (instance: WebView | null) => {
      bookRef.current = instance;
      if (instance) {
        registerBook(instance);
      }
    },
    [registerBook]
  );

  useEffect(() => {
    let isMounted = true;

    const prepareReader = async () => {
      try {
        setIsLoading(true);
        setTemplateUri('');
        hasAppliedBeginAtRef.current = false;
        hasPersistedLocationsRef.current = false;
        hasLocationsReadyRef.current = false;

        const [, jszip, epubjs] = await loadScripts();

        if (!jszip || !epubjs) throw new Error('Failed to load scripts');

        const localEpubUri = await downloadEpub(src, epubFileName);

        templateAssetsRef.current = { jszip, epubjs, localEpubUri };

        if (checkTemplateFileExists(htmlTemplateName)) {
          if (isMounted) {
            setTemplateUri(getTemplateFileUri(htmlTemplateName));
          }
          return;
        }

        const generatedTemplate = injectWebViewVariables({
          jszip,
          epubjs,
          type: SourceType.EPUB,
          allowScriptedContent: true,
          book: localEpubUri,
          theme: initialTheme,
        });

        const uri = saveTemplateToFile(generatedTemplate, htmlTemplateName);

        if (isMounted) {
          setTemplateUri(uri);
        }
      } catch (error) {
        console.error('Reader Error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    prepareReader();
    return () => {
      isMounted = false;
    };
  }, [
    src,
    htmlTemplateName,
    epubFileName,
    injectWebViewVariables,
    setIsLoading,
  ]);

  if (!templateUri) {
    return LoaderComponent ? (
      <LoaderComponent />
    ) : (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Przygotowuję książkę...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureHandler
        onSwipeLeft={handleOnSwipeLeft}
        onSwipeRight={handleOnSwipeRight}
        onTap={handleOnTap}
        onPinchStart={handleOnPinchStart}
        onPinch={handleOnPinch}
        onPinchEnd={handleOnPinchEnd}
      >
        <WebView
          pointerEvents="none"
          ref={handleBookRef}
          source={{ uri: templateUri }}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
          originWhitelist={['*']}
          scrollEnabled={false}
          mixedContentMode="compatibility"
          allowingReadAccessToURL={Paths.document.uri}
          allowUniversalAccessFromFileURLs
          allowFileAccessFromFileURLs
          allowFileAccess
          javaScriptCanOpenWindowsAutomatically
          onMessage={onMessage}
          onLoadEnd={() => {
            if (!waitForLocationsReady || hasLocationsReadyRef.current) {
              setIsLoading(false);
            }
          }}
          style={styles.container}
        />
      </GestureHandler>

      {isLoading &&
        (LoaderComponent ? (
          <View style={styles.loaderOverlay}>
            <LoaderComponent />
          </View>
        ) : (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" />
            <Text>Przygotowuję książkę...</Text>
          </View>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default Reader;
