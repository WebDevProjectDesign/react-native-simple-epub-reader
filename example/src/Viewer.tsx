import { useCallback, useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Reader, ReaderContext } from 'react-native-simple-epub-reader';

export interface IProductSegment {
  id: number;
  product_id: number;
  title: string;
  sequence: number;
  file_url: string;
  duration: number | null;
  pages: number | null;
  cover_url: string | null;
  completed: boolean;
  position: number;
  last_update: string | null;
}

const Viewer = ({ token }: { token: string }) => {
  const [segment, setSegment] = useState<IProductSegment | null>(null);
  const { goToLocation } = useContext(ReaderContext);

  const fetchSegment = useCallback(async () => {
    const response = await fetch(
      `https://api.rtck.pl/api/v1/product-segments/${418}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      setSegment(data.data);
    } else {
      console.error(
        'Failed to fetch segment:',
        response.status,
        response.statusText
      );
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchSegment();
  }, [token, fetchSegment]);

  if (!segment) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Fetching segment...</Text>
      </View>
    );
  }
  return (
    <Reader
      src={segment.file_url}
      onLocationsReady={() => console.log('ready')}
      onWebViewMessage={(message) => {
        if (message.type === 'onCfiFromPercentage') {
          goToLocation(message.cfi);
        }
      }}
      beginAt={segment.position || 0}
      waitForLocationsReady
    />
  );
};

export default Viewer;
