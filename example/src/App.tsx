import { ReaderProvider } from 'react-native-simple-epub-reader';
import Viewer from './Viewer';
import { useState } from 'react';
import Login from './Login';

export default function App() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <ReaderProvider>
      {!token ? <Login setToken={setToken} /> : <Viewer token={token} />}
    </ReaderProvider>
  );
}
