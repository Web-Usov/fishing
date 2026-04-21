export type MapProvider = 'yandex' | 'google';

export type MapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type MapInitOptions = {
  container: HTMLDivElement;
  selectedPoint: MapPoint | null;
  center: [number, number];
  zoom: number;
  onSelectCoordinates: (coordinates: [number, number]) => void;
};

export type MapUpdateOptions = {
  selectedPoint: MapPoint | null;
  center: [number, number];
};

export interface MapAdapter {
  init(options: MapInitOptions): Promise<void>;
  update(options: MapUpdateOptions): void;
  destroy(): void;
}
