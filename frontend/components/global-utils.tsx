export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const S3_IMAGE_BUCKET_URL = process.env.NEXT_PUBLIC_S3_IMAGE_BUCKET_URL;
const currentYear = new Date().getFullYear();
export const MAX_YEAR = 2022;
export const MIN_YEAR = 1980;
export const NUM_YEARS = MAX_YEAR - MIN_YEAR;
export const NUM_LINE_BREAKS = 3;

export type MarkerType = {
  id: string;
  lat: number;
  lng: number;
  data: any;
};

export const LocationColors = (alpha: number): string[] => [
  `rgba(255, 0, 0, ${alpha})`,
  `rgba(0, 173, 9, ${alpha})`,
  `rgba(0, 0, 255, ${alpha})`,
  `rgba(252, 189, 0, ${alpha})`,
  `rgba(186, 0, 127, ${alpha})`,
  `rgba(61, 90, 128, ${alpha})`,
  `rgba(220, 20, 60, ${alpha})`,
  `rgba(61, 153, 112, ${alpha})`,
  `rgba(128, 0, 0, ${alpha})`,
];

interface LineBreaksProps {
  count?: number; // Number of line breaks to insert
}

export function LineBreaks({ count = NUM_LINE_BREAKS }) {
  // Create an array of line breaks based on the count
  const breaks = Array.from({ length: count }, (_, index) => (
    <br key={index} />
  ));

  return <>{breaks}</>;
}

export function get_image_from_koppen(location: MarkerType) {
  const koppen_type = location.data.location_data.koppen;

  //This regex matches the (Cfa) part of the string "Humid subtropical climate (Cfa)"
  const match = /\(([^)]+)\)/.exec(koppen_type);
  let climate_type = "";
  if (match) {
    climate_type = `(${match[1]})`; // Includes parentheses
  }
  return S3_IMAGE_BUCKET_URL + "(" + koppen_type + ")" + ".png";
}
