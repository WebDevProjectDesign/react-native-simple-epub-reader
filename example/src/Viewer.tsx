import { Reader } from 'react-native-simple-epub-reader';

const Viewer = () => {
  return (
    <Reader
      src={
        'https://storage.googleapis.com/cdn.rtck.pl/30-twarzy-maryi/book/Ks-Mateusz-Dutkiewicz_30-twarzy-Maryi.epub'
      }
    />
  );
};

export default Viewer;
