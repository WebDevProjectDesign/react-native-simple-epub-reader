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

    if (!url) {
      throw new Error('Invalid URL provided for EPUB download.');
    }

    // Keep full URL (including query params) to support signed/private links.
    const downloadedFile = await File.downloadFileAsync(url, file);

    return downloadedFile.uri;
  } catch (error) {
    console.error('Download Error:', error);
    throw error;
  }
};
