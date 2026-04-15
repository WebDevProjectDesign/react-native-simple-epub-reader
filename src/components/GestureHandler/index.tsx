import type { FC, PropsWithChildren } from 'react';

import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import type { GestureHandlerProps } from '../../types';

const GestureHandler: FC<PropsWithChildren<GestureHandlerProps>> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onPinch,
}) => {
  const swipeLeftGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.LEFT)
    .onEnd(() => {
      onSwipeLeft?.();
    });

  const swipeRightGesture = Gesture.Fling()
    .runOnJS(true)
    .direction(Directions.RIGHT)
    .onEnd(() => {
      onSwipeRight?.();
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(250)
    .onStart(() => {
      onTap?.();
    });

  const pinchGesture = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate((e) => {
      onPinch?.(e);
    });

  const combinedGesture = Gesture.Race(
    Gesture.Exclusive(swipeLeftGesture, swipeRightGesture),
    tapGesture,
    pinchGesture
  );
  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={combinedGesture}>{children}</GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
};

export default GestureHandler;
