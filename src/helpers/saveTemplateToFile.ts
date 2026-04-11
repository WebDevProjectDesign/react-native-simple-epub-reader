import { File, Paths } from 'expo-file-system';

export const saveTemplateToFile = (template: string, fileName: string) => {
  try {
    const htmlFile = new File(Paths.document, fileName);
    if (!htmlFile.exists) {
      htmlFile.create();
    }
    htmlFile.write(template);
    return htmlFile.uri;
  } catch (error) {
    console.error('Error saving template file:', error);
    throw error;
  }
};

export const checkTemplateFileExists = (fileName: string) => {
  const htmlFile = new File(Paths.document, fileName);
  return htmlFile.exists;
};
