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

    // The template loads the book by a file name next to it, so local files
    // still have to land in the document directory.
    if (url.startsWith('file://')) {
      new File(url).copy(file);

      return file.uri;
    }

    // Keep full URL (including query params) to support signed/private links.
    const downloadedFile = await File.downloadFileAsync(url, file);

    return downloadedFile.uri;
  } catch (error) {
    console.error('Download Error:', error);
    throw error;
  }
};
