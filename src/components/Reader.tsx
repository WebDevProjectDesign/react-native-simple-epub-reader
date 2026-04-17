import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SourceType, type ReaderProps, type ePubCfi } from '../types';
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

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash.toString(36);
};

const sanitizeCacheSegment = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/,/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 80) || 'book';

const Reader = ({
  src,
  cacheKey,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  initialLocation,
  beginAt,
  waitForLocationsReady = false,
  onLocationsReady = () => {},
  onLocationsGenerated,
  onLocationChange = () => {},
  onFinish = () => {},
  onBeginning = () => {},
  onPinch = () => {},
  onSwipeDown = () => {},
  onSwipeUp = () => {},
  LoaderComponent,
  onWebViewMessage,
  onLocationsCacheMissing,
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

        setTotalLocations(totalLocations);
        onLocationChange?.({
          totalLocations,
          currentLocation,
          progress,
          currentSection,
        });
        setCurrentLocation(currentLocation);
        setProgress(progress);
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
          !hasPersistedLocationsRef.current
        ) {
          setTimeout(() => {
            try {
              persistTemplateWithLocations(parsedEvent.locations);
            } catch (persistError) {
              console.warn('Failed to persist cached locations:', persistError);
            }
          }, 0);
        }

        if (onLocationsGenerated && parsedEvent.locations?.length) {
          Promise.resolve(
            onLocationsGenerated({
              cacheKey,
              epubKey: props.epubKey,
              locations: parsedEvent.locations,
              src,
            })
          ).catch((error) => {
            console.warn('Failed to handle onLocationsGenerated:', error);
          });
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
    const sourceWithoutQuery = src.split('?')[0] || src;
    const pathParts = sourceWithoutQuery.split('/').filter(Boolean);
    const rawName = pathParts[pathParts.length - 1] || 'book.epub';
    const decoded = decodeURIComponent(rawName);

    const hasKnownExt = /\.(epub|zip)$/i.test(decoded);
    const fallbackBaseName = hasKnownExt
      ? decoded.replace(/\.(epub|zip)$/i, '')
      : decoded || 'book';
    const baseName = sanitizeCacheSegment(cacheKey || fallbackBaseName);
    const extension = hasKnownExt
      ? decoded.match(/\.(epub|zip)$/i)?.[0].toLowerCase() || '.epub'
      : '.epub';
    const cacheScope = (cacheKey || sourceWithoutQuery).toLowerCase();

    return `${baseName}-${hashString(cacheScope)}${extension}`;
  }, [cacheKey, src]);

  const htmlTemplateName = useMemo(
    () =>
      epubFileName
        .replace('.epub', '-template.html')
        .replace('.zip', '-template.html'),
    [epubFileName]
  );

  const persistTemplateWithLocations = useCallback(
    (locations: ePubCfi[]) => {
      const assets = templateAssetsRef.current;
      if (!assets || !locations.length) return;

      const generatedTemplateWithLocations = injectWebViewVariables({
        jszip: assets.jszip,
        epubjs: assets.epubjs,
        type: SourceType.EPUB,
        allowScriptedContent: true,
        book: assets.localEpubUri,
        theme: initialTheme,
        locations,
      });

      saveTemplateToFile(generatedTemplateWithLocations, htmlTemplateName);
      hasPersistedLocationsRef.current = true;
    },
    [htmlTemplateName, injectWebViewVariables]
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
          hasPersistedLocationsRef.current = true;
          if (isMounted) {
            setTemplateUri(getTemplateFileUri(htmlTemplateName));
          }
          return;
        }

        let locationsFromRemoteCache: ePubCfi[] | undefined;

        if (onLocationsCacheMissing) {
          try {
            const remoteLocations = await onLocationsCacheMissing({
              cacheKey,
              src,
            });

            if (Array.isArray(remoteLocations) && remoteLocations.length > 0) {
              locationsFromRemoteCache = remoteLocations;
            }
          } catch (remoteCacheError) {
            console.warn(
              'Failed to restore locations from onLocationsCacheMissing:',
              remoteCacheError
            );
          }
        }

        const generatedTemplate = injectWebViewVariables({
          jszip,
          epubjs,
          type: SourceType.EPUB,
          allowScriptedContent: true,
          book: localEpubUri,
          theme: initialTheme,
          locations: locationsFromRemoteCache,
        });

        const uri = saveTemplateToFile(generatedTemplate, htmlTemplateName);

        if (locationsFromRemoteCache?.length) {
          hasPersistedLocationsRef.current = true;
        }

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
    cacheKey,
    onLocationsCacheMissing,
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
        onSwipeUp={onSwipeUp}
        onSwipeDown={onSwipeDown}
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
