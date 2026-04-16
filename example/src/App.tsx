import { ReaderProvider } from 'react-native-simple-epub-reader';
import Viewer from './Viewer';

export default function App() {
  return (
    <ReaderProvider>
      <Viewer />
    </ReaderProvider>
  );
}
