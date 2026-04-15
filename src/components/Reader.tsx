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
import { saveTemplateToFile } from '../helpers/saveTemplateToFile';
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

const Reader = ({
  src,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  initialLocation,
  onLocationsReady = () => {},
  onLocationChange = () => {},
  onFinish = () => {},
  onBeginning = () => {},
  onPinch = () => {},
  LoaderComponent,
}: ReaderProps) => {
  const [templateUri, setTemplateUri] = useState<string>('');

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

  const onMessage = (event: any) => {
    const parsedEvent = JSON.parse(event.nativeEvent.data);

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
        setLocations(parsedEvent.locations);
        setTotalLocations(props.totalLocations);
        setCurrentLocation(props.currentLocation);
        setProgress(props.progress);

        return onLocationsReady(props.epubKey, parsedEvent.locations);
      case 'onReady':
        if (initialLocation) {
          goToLocation(initialLocation);
        }
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
    const fontSizeValue = parseInt(fontSize.replace('pt', ''), 10);

    const scaleValue = e.scale > 1 ? e.scale * 0.5 : e.scale;

    const newFontSize = fontSizeValue * scaleValue;

    const clampedFontSize = Math.min(Math.max(newFontSize, 6), 32);
    changeFontSize(`${clampedFontSize}pt`);
    onPinch?.(e);
  };

  const htmlTemplateName = useMemo(
    () => src.split('/').pop()?.replace('.epub', '.html') || 'index.html',
    [src]
  );

  const epubFileName = useMemo(
    () => src.split('/').pop() || 'book.epub',
    [src]
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

        const [, jszip, epubjs] = await loadScripts();

        if (!jszip || !epubjs) throw new Error('Failed to load scripts');

        const localEpubUri = await downloadEpub(src, epubFileName);

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
      } finally {
        if (isMounted) setIsLoading(false);
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

  if (isLoading) {
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
    <>
      <GestureHandler
        onSwipeLeft={handleOnSwipeLeft}
        onSwipeRight={handleOnSwipeRight}
        onTap={handleOnTap}
        onPinch={handleOnPinch}
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
          style={styles.container}
        />
      </GestureHandler>
    </>
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
});

export default Reader;
