import { ReaderProvider } from 'react-native-simple-epub-reader';
import Viewer from './Viewer';
import { useState } from 'react';
import Login from './Login';

export default function App() {
  const [token, setToken] = useState<string | null>(null);

  return !token ? (
    <Login setToken={setToken} />
  ) : (
    <ReaderProvider>
      <Viewer token={token} />
    </ReaderProvider>
  );
}
