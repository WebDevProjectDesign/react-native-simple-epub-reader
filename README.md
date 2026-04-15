# react-native-simple-epub-reader

A lightweight React Native ePub reader powered by `react-native-webview`, with support for:

- remote `.epub` files,
- swipe navigation,
- pinch-to-zoom font scaling,
- reading progress and location callbacks,
- imperative controls through `ReaderContext`.

## Features

- Fast setup with a single `Reader` component.
- Built-in gestures: tap, swipe left/right, pinch.
- Progress events (`onLocationChange`, `onLocationsReady`, `onBeginning`, `onFinish`).
- Programmatic controls: `goNext`, `goPrevious`, `goToLocation`, `changeTheme`, `changeFontSize`.
- Works with TypeScript out of the box.

## Installation

```bash
npm install react-native-simple-epub-reader
```

Install peer dependencies:

```bash
npm install react-native-webview react-native-gesture-handler expo-file-system @expo/vector-icons
```

If your app uses Expo, make sure native modules are installed and configured:

```bash
npx expo install react-native-webview react-native-gesture-handler expo-file-system @expo/vector-icons
```

## Quick Start

Wrap your app with `ReaderProvider`:

```tsx
import { ReaderProvider } from 'react-native-simple-epub-reader';
import Viewer from './Viewer';

export default function App() {
  return (
    <ReaderProvider>
      <Viewer />
    </ReaderProvider>
  );
}
```

Render a book:

```tsx
import { Reader } from 'react-native-simple-epub-reader';

export function Viewer() {
  return <Reader src="https://example.com/my-book.epub" />;
}
```

## Reader API

### Props

| Prop               | Type                           | Required | Description                                              |
| ------------------ | ------------------------------ | -------- | -------------------------------------------------------- |
| `src`              | `string`                       | Yes      | Remote URL to an `.epub` file.                           |
| `initialLocation`  | `string`                       | No       | Initial CFI location (`epubcfi(...)`).                   |
| `onTap`            | `() => void`                   | No       | Called on tap gesture.                                   |
| `onSwipeLeft`      | `() => void`                   | No       | Called before built-in `goNext()`.                       |
| `onSwipeRight`     | `() => void`                   | No       | Called before built-in `goPrevious()`.                   |
| `onPinch`          | `(e) => void`                  | No       | Called on pinch gesture.                                 |
| `onLocationChange` | `(data) => void`               | No       | Reading position/progress update.                        |
| `onLocationsReady` | `(epubKey, locations) => void` | No       | Called when locations are generated.                     |
| `onBeginning`      | `() => void`                   | No       | Called when user reaches beginning of the book.          |
| `onFinish`         | `() => void`                   | No       | Called when user reaches end of the book.                |
| `onWebViewMessage` | `(event) => void`              | No       | Receives custom WebView messages not handled internally. |
| `LoaderComponent`  | `React.ComponentType`          | No       | Custom loading component.                                |

### `onLocationChange` payload

```ts
type LocationChangeData = {
  totalLocations: number;
  currentLocation: Location;
  progress: number;
  currentSection: Section | null;
};
```

## ReaderContext API

Use `ReaderContext` to control reader state from your own UI:

```tsx
import { useContext } from 'react';
import { ReaderContext } from 'react-native-simple-epub-reader';

export function Controls() {
  const { goNext, goPrevious, progress, changeFontSize } =
    useContext(ReaderContext);

  return <>{/* your custom controls */}</>;
}
```

Available methods and state include:

- `goNext()`
- `goPrevious()`
- `goToLocation(cfi)`
- `changeTheme(theme)`
- `changeFontSize(fontSize)` (example: `"12pt"`)
- `injectJavascript(script)`
- `progress`, `currentLocation`, `locations`, `meta`, `atStart`, `atEnd`, `fontSize`

## Theming

Theme shape:

```ts
type Theme = {
  [selector: string]: {
    [cssProperty: string]: string;
  };
};
```

Example:

```ts
const darkTheme = {
  body: { background: '#111' },
  p: { color: '#f5f5f5' },
  h1: { color: '#ffffff' },
  a: { color: '#7cc7ff' },
};
```

Then call `changeTheme(darkTheme)` through `ReaderContext`.

## Notes and Limitations

- `src` should point to an accessible remote `.epub` URL.
- The reader internally caches files in `expo-file-system` document storage.
- Internal WebView event names are consumed by the library; `onWebViewMessage` receives non-internal/custom events only.

## Troubleshooting

### Book does not render

- Verify that `src` is a valid `.epub` URL.
- Ensure network access and CORS/server rules allow download.
- Confirm `react-native-webview` and `expo-file-system` are installed.

### Gestures do not work

- Confirm `react-native-gesture-handler` is installed and configured in your app entrypoint.

### Loading never ends

- Check Metro/device logs for WebView or file system errors.
- Verify the downloaded file is not blocked or corrupted.

## Example App

This repository includes a working app in [example](example) showing minimal integration.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
