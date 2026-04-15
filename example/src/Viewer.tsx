import { Reader } from 'react-native-simple-epub-reader';

const Viewer = () => {
  return (
    <Reader
      src={
        'https://storage.googleapis.com/cdn.rtck.pl/the-best-ja/book/Poros%C5%82o%2C%20BestJa%2C%20ebook%2C%20epub.epub?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=rtck-api-signed-urls-96%40rtck-premium-dev.iam.gserviceaccount.com%2F20260415%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260415T190425Z&X-Goog-Expires=172800&X-Goog-SignedHeaders=host&X-Goog-Signature=9fe8fd54bb3f2ee60d839ee5c7baeb6ed43c7d324af600f5ae836c8aed5ab3730f8d545ae38af91ee278ce1952cf913f41b318d884cebdfa3d450bb8f178994e57a5149cd4b55010b81285789ff2fe94abd9770df55bff1325cd9cb3d1c3b7ced139c79a76d8b8dd8e85fb06898d9e23897f2d56c6867d291728b6e0047d1dcff6e865293fbde41d2af2b59eb3cf065fec29206176ebb3d05c9ec581fc5b10dad0edc89fff741bc5fac0b0cf9e871cc88eecb17e9c8dcc77d0b826a5dc4a89eee3c6fdbe4b4c9ef7280e81b0a1dcc94c2329c49531f80cf952e3aeab2e377e5237f34526c36ba98fb30a7661fd5747955be2902ff388826f52bce35a211392dd'
      }
      onLocationsReady={() => console.log('ready')}
      waitForLocationsReady
      beginAt={89}
    />
  );
};

export default Viewer;
