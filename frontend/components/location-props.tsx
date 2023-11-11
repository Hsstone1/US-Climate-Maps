export type MarkerType = {
  id: string;
  lat: number;
  lng: number;
  data: any;
};

export const LocationColors = (alpha: number): string[] => [
  `rgba(255, 0, 0, ${alpha})`,
  `rgba(0, 186, 0, ${alpha})`,
  `rgba(0, 0, 255, ${alpha})`,
  `rgba(252, 189, 0, ${alpha})`,
  `rgba(186, 0, 127, ${alpha})`,
  `rgba(61, 90, 128, ${alpha})`,
  `rgba(220, 20, 60, ${alpha})`,
  `rgba(61, 153, 112, ${alpha})`,
  `rgba(128, 0, 0, ${alpha})`,
];
