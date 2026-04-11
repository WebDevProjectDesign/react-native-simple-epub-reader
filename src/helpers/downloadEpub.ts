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

    const downloadedFile = await File.downloadFileAsync(url, file);

    return downloadedFile.uri;
  } catch (error) {
    console.error('Download Error:', error);
    throw error;
  }
};
