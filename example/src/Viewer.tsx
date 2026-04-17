import { useCallback } from 'react';
import { Reader } from 'react-native-simple-epub-reader';
import { fetchLocations } from './fetchLocations';

const Viewer = ({ token }: { token: string }) => {
  const handleLocationsCacheMissing = useCallback(
    (props: { cacheKey: string; src: string }) => fetchLocations(props, token),
    [token]
  );

  return (
    <>
      <Reader
        src="https://storage.googleapis.com/cdn.rtck.pl/chwala-mu/book/Chwa%C5%82aMu.epub"
        onLocationsCacheMissing={handleLocationsCacheMissing}
        cacheKey="992"
        waitForLocationsReady={true}
        beginAt={33}
      />
    </>
  );
};

export default Viewer;
