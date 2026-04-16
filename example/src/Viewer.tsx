import { Reader } from 'react-native-simple-epub-reader';

const Viewer = () => {
  return <Reader src="https://example-file-url.epub" beginAt={10} />;
};

export default Viewer;
