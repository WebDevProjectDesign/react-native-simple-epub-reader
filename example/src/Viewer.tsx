import { Reader } from 'react-native-simple-epub-reader';

const Viewer = () => {
  return (
    <Reader
      src="https://storage.googleapis.com/cdn.rtck.pl/ja-i-moje-imie/book/Pawlukiewicz%2C%20Ja%20i%20moje%20imie%2C%20ebook%2C%20epub.epub?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=rtck-api-signed-urls-96%40rtck-premium-dev.iam.gserviceaccount.com%2F20260416%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260416T113520Z&X-Goog-Expires=172800&X-Goog-SignedHeaders=host&X-Goog-Signature=00b3b99e879073264e082e5de4d3aa674924641f26dd6d29f231c57877c0be59c9d4ac4c1191fe452ca6b810a5c4fc5fb99471339398cc86a02ede8cb9f9a27b6e48b942a91b2733821e7bb5a29c6cb2a817dd407cf862a5ac223cf4f8369bb1deb1411be1f5d8419be4026c32b8528c9e93e2f28c4d0b8dd66b2805c9a1557bc198e7932882c5bd5759cef49650cbfacf41f473bfca0018c829e6a0e9a4f4a26d6944da4c141c40dd66a9205bc88ef3c053647692c122392ecd62dc8b0704de34a6a5c0c1fae63d3d49c7f97a04c3dd03fefd78983e13f6eabebe865a8abd56839b3b3bd16cb6cc785ee1b32cbca0feb1a5d515a8af991d3d096f9dba893e1e"
      beginAt={10}
      onSwipeDown={() => console.log('swipe down')}
      onSwipeUp={() => console.log('swipe up')}
    />
  );
};

export default Viewer;
