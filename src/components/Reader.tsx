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

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash.toString(36);
};

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
  const toSeconds = useCallback(
    (startMs: number) => Number(((Date.now() - startMs) / 1000).toFixed(3)),
    []
  );

  const logReader = useCallback((message: string, details?: unknown) => {
    if (details !== undefined) {
      console.log(`[Reader] ${message}`, details);
      return;
    }
    console.log(`[Reader] ${message}`);
  }, []);

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

    if (parsedEvent?.type === 'onLog') {
      console.log('[Reader/WebView]', parsedEvent.message, parsedEvent.data);
      onWebViewMessage?.(parsedEvent);
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
        logReader('onLocationsReady event', {
          totalLocations: props.totalLocations,
          locationsCount: parsedEvent.locations?.length || 0,
        });
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
        logReader('onReady event');
        if (!waitForLocationsReady) {
          setIsLoading(false);
        }
        if (initialLocation) {
          goToLocation(initialLocation);
        }
        break;
      case 'onDisplayError':
        logReader('onDisplayError event', parsedEvent.reason);
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
    const decoded = decodeURIComponent(rawName)
      .replace(/\s+/g, '_')
      .replace(/,/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    const hasKnownExt = /\.(epub|zip)$/i.test(decoded);
    const baseName = hasKnownExt
      ? decoded.replace(/\.(epub|zip)$/i, '')
      : decoded || 'book';
    const extension = hasKnownExt
      ? decoded.match(/\.(epub|zip)$/i)?.[0].toLowerCase() || '.epub'
      : '.epub';
    const cacheScope = sourceWithoutQuery.toLowerCase();

    return `${baseName}-${hashString(cacheScope)}${extension}`;
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
      const prepareStartMs = Date.now();

      try {
        logReader('start prepareReader', { src });
        setIsLoading(true);
        setTemplateUri('');
        hasAppliedBeginAtRef.current = false;
        hasPersistedLocationsRef.current = false;
        hasLocationsReadyRef.current = false;

        logReader('start loading scripts');
        const loadScriptsStartMs = Date.now();
        const [, jszip, epubjs] = await loadScripts();
        logReader('end loading scripts', {
          durationSeconds: toSeconds(loadScriptsStartMs),
        });

        if (!jszip || !epubjs) throw new Error('Failed to load scripts');

        logReader('start downloading ebook file', { epubFileName });
        const downloadStartMs = Date.now();
        const localEpubUri = await downloadEpub(src, epubFileName);
        logReader('end downloading ebook file', {
          localEpubUri,
          durationSeconds: toSeconds(downloadStartMs),
        });

        templateAssetsRef.current = { jszip, epubjs, localEpubUri };

        if (checkTemplateFileExists(htmlTemplateName)) {
          logReader('using cached html template', { htmlTemplateName });
          if (isMounted) {
            setTemplateUri(getTemplateFileUri(htmlTemplateName));
          }
          logReader('end prepareReader (cache hit)', {
            durationSeconds: toSeconds(prepareStartMs),
          });
          return;
        }

        logReader('start generating html template');
        const templateGenerateStartMs = Date.now();

        const generatedTemplate = injectWebViewVariables({
          jszip,
          epubjs,
          type: SourceType.EPUB,
          allowScriptedContent: true,
          book: localEpubUri,
          theme: initialTheme,
        });

        logReader('end generating html template', {
          durationSeconds: toSeconds(templateGenerateStartMs),
        });
        logReader('start saving html template file', { htmlTemplateName });
        const saveTemplateStartMs = Date.now();

        const uri = saveTemplateToFile(generatedTemplate, htmlTemplateName);
        logReader('end saving html template file', {
          uri,
          durationSeconds: toSeconds(saveTemplateStartMs),
        });

        if (isMounted) {
          setTemplateUri(uri);
        }
        logReader('end prepareReader', {
          durationSeconds: toSeconds(prepareStartMs),
        });
      } catch (error) {
        logReader('prepareReader failed', {
          error,
          durationSeconds: toSeconds(prepareStartMs),
        });
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
    logReader,
    setIsLoading,
    toSeconds,
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
