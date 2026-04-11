import { View, StyleSheet } from 'react-native';
import { Reader, ReaderProvider } from 'react-native-simple-epub-reader';

export default function App() {
  return (
    <ReaderProvider>
      <View style={styles.container}>
        <Reader src="https://storage.googleapis.com/cdn.rtck.pl/30-twarzy-maryi/book/Ks-Mateusz-Dutkiewicz_30-twarzy-Maryi.epub" />
      </View>
    </ReaderProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
