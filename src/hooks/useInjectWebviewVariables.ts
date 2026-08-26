import { useCallback } from 'react';

import type { SourceType, Theme } from '../types';
import template from '../constants/template';
import jszip from '../scripts/jszip';
import epubjs from '../scripts/epub';
import {
  bookPathResolverSnippet,
  inlineScriptTag,
} from '../helpers/webViewTemplate';

export function useInjectWebViewVariables() {
  const injectWebViewVariables = useCallback(
    ({
      type,
      book,
      allowScriptedContent,
      theme,
      locations,
    }: {
      type: SourceType;
      book: string;
      allowScriptedContent?: boolean;
      theme: Theme;
      locations?: string[];
    }) => {
      const initialLocations =
        locations && locations.length > 0 ? JSON.stringify(locations) : 'null';

      return template
        .replace(/<script id="jszip"><\/script>/, () => inlineScriptTag(jszip))
        .replace(/<script id="epubjs"><\/script>/, () =>
          inlineScriptTag(epubjs)
        )
        .replace(/const type = window.type;/, `const type = '${type}';`)
        .replace(
          /const file = window.book;/,
          `const file = ${bookPathResolverSnippet(book)};`
        )
        .replace(
          /const enableSelection = window.enable_selection;/,
          `const enableSelection = false;`
        )
        .replace(
          /allowScriptedContent: allowScriptedContent/,
          `allowScriptedContent: ${allowScriptedContent}`
        )
        .replace(/allowPopups: allowPopups/, `allowPopups: false`)
        .replace(
          /const theme = window.theme;/,
          `const theme = ${JSON.stringify(theme)};`
        )
        .replace(
          /const initialLocations = window.locations;/,
          `const initialLocations = ${initialLocations};`
        );
    },
    []
  );
  return { injectWebViewVariables };
}
