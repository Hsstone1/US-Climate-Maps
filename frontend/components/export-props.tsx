export type MarkerType = {
  id: string;
  lat: number;
  lng: number;
  data: any;
};

export const LocationColors = (alpha: number): string[] => [
  `rgba(255, 65, 54, ${alpha})`,
  `rgba(46, 204, 64, ${alpha})`,
  `rgba(125, 60, 152, ${alpha})`,
  `rgba(57, 204, 204, ${alpha})`,
  `rgba(245, 242, 49, ${alpha})`,
  `rgba(255, 220, 0, ${alpha})`,
  `rgba(61, 90, 128, ${alpha})`,
  `rgba(220, 20, 60, ${alpha})`,
  `rgba(61, 153, 112, ${alpha})`,
  `rgba(128, 0, 0, ${alpha})`,
];
