import { Paths, File } from 'expo-file-system';
import jszip from '../scripts/jszip';
import epub from '../scripts/epub';

export const loadScripts = async () => {
  const jszipFile = new File(Paths.document, 'jszip.min.js');
  if (!jszipFile.exists) {
    jszipFile.create();
    jszipFile.write(jszip);
  }

  const epubjsFile = new File(Paths.document, 'epub.min.js');
  if (!epubjsFile.exists) {
    epubjsFile.create();
    epubjsFile.write(epub);
  }

  const jszipFileUri = jszipFile.uri;
  const epubjsFileUri = epubjsFile.uri;

  return [`${jszipFileUri},${epubjsFileUri}`, jszipFileUri, epubjsFileUri];
};
