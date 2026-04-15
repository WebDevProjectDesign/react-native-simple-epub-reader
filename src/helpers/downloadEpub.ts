import { File, Paths } from 'expo-file-system';

export const downloadEpub = async (
  url: string,
  fileName: string
): Promise<string> => {
  try {
    const file = new File(Paths.document, fileName);

    if (file.exists) {
      return file.uri;
    }

    const normalized = url.split('?X-Goog-Algorithm')[0];

    if (!normalized) {
      throw new Error('Invalid URL provided for EPUB download.');
    }

    console.log({ url });

    const downloadedFile = await File.downloadFileAsync(normalized, file);

    return downloadedFile.uri;
  } catch (error) {
    console.error('Download Error:', error);
    throw error;
  }
};
