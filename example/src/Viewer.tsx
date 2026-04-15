import { Reader } from 'react-native-simple-epub-reader';

const Viewer = () => {
  return (
    <Reader
      src={
        'https://storage.googleapis.com/cdn.rtck.pl/the-best-ja/book/Poros%C5%82o%2C%20BestJa%2C%20ebook%2C%20epub.epub?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=rtck-api-signed-urls-96%40rtck-premium-dev.iam.gserviceaccount.com%2F20260415%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260415T150407Z&X-Goog-Expires=172800&X-Goog-SignedHeaders=host&X-Goog-Signature=2bea5ffc4ccbbc9073dc31a85e282de664a3f57760724bd0841c260420319d55b0c917888f652cf544dac17dfa429169f4d0e82e7a8034c0475670739aa45741c2e60cff69e3e60a2a0f46aca88ac81d9b7946957161d095bfcdf4417f985cb7a06e3e76e8c847a7947f118bc5dfb86f9388fdab6b317c7b9bf8ab51472f631d723bc8d14d373b514d1b2494409c0a5f592861e7ed096eb6f719cc7471403249ad949518a2b80e8007696e9ae4393e7cce099a910376b39806072e46b57f05fadb3bf8f86e548aea5e15e3a90391bf26e0cffbb8f4e2fc83c2ce2ba90e2446b0dd1e8c94b29f74ec4d3b50f73f41e55a30c1586b9c3050a0f3ee10c93bb82e4f'
      }
    />
  );
};

export default Viewer;
