import type {
  ePubCfi,
  LocationsCacheMissingParams,
} from 'react-native-simple-epub-reader';

export const fetchLocations = async (
  params: LocationsCacheMissingParams,
  token: string
): Promise<ePubCfi[] | null | undefined> => {
  console.log('Fetching locations with params:', params.cacheKey);
  try {
    const response = await fetch(
      `http://192.168.18.101:3000/api/v1/product-segments/${params.cacheKey}/locations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      console.log('Failed to fetch locations:', response.statusText);
      return null;
    }
    console.log(
      'Locations fetched successfully for cacheKey:',
      params.cacheKey
    );
    const data = await response.json();
    return data as ePubCfi[];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return null;
  }
};
