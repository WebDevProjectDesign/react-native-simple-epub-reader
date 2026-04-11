import type { RefObject } from 'react';

import WebView from 'react-native-webview';

export function injectJavaScript(
  ref: RefObject<WebView | null>,
  script: string
) {
  ref.current?.injectJavaScript(`
    try {
      ${script}
    } catch (error) {
      alert(error?.message);
    }

    true;
  `);
}
