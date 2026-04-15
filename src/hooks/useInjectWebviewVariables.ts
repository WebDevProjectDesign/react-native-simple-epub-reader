import { useCallback } from 'react';

import type { SourceType, Theme } from '../types';
import template from '../constants/template';

export function useInjectWebViewVariables() {
  const injectWebViewVariables = useCallback(
    ({
      jszip,
      epubjs,
      type,
      book,
      allowScriptedContent,
      theme,
      locations,
    }: {
      jszip: string;
      epubjs: string;
      type: SourceType;
      book: string;
      allowScriptedContent?: boolean;
      theme: Theme;
      locations?: string[];
    }) => {
      const initialLocations =
        locations && locations.length > 0 ? JSON.stringify(locations) : 'null';

      return template
        .replace(
          /<script id="jszip"><\/script>/,
          `<script src="${jszip}"></script>`
        )
        .replace(
          /<script id="epubjs"><\/script>/,
          `<script src="${epubjs}"></script>`
        )
        .replace(/const type = window.type;/, `const type = '${type}';`)
        .replace(/const file = window.book;/, `const file = '${book}';`)
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
