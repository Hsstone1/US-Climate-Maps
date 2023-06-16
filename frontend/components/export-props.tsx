export type MarkerType = {
  id: string;
  lat: number;
  lng: number;
  data: any;
};

export const LocationColors = (alpha: number): string[] => [
  `rgba(255, 0, 0, ${alpha})`,
  `rgba(0, 255, 0, ${alpha})`,
  `rgba(0, 0, 255, ${alpha})`,
  `rgba(252, 186, 3, ${alpha})`,
  `rgba(255, 0, 255, ${alpha})`,
  `rgba(0, 255, 255, ${alpha})`,
  `rgba(123, 45, 67, ${alpha})`,
  `rgba(89, 234, 78, ${alpha})`,
  `rgba(12, 56, 178, ${alpha})`,
  `rgba(201, 89, 145, ${alpha})`,
];
