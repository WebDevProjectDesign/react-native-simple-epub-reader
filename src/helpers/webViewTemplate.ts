// Turns a bare file name into an absolute URL next to the template. Absolute
// file:// URIs are not baked into the template: on iOS the app container path
// changes on every update, which would leave cached templates pointing at a
// directory that no longer exists. Absolute or data/base64 inputs pass through.
export const bookPathResolverSnippet = (book: string) =>
  `(function (name) { return /^[a-z][a-z0-9+.-]*:/i.test(name) || name.length > 1000 ? name : location.href.replace(/[^/]*$/, '') + name; })('${book}')`;

// HTML parsers close a <script> at the first </script>, even inside JS strings.
export const inlineScriptTag = (source: string) =>
  `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>`;
