import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import type { MapFrameProps } from '../../../types/components';
import { isWeekend, todaysTrip, todaysSolution } from '../../../utils/answerValidations';
import stations from '../../../data/stations.json';
import routes from '../../../data/routes.json';
import { MANHATTAN_TILT, DEFAULT_LNG, DEFAULT_LAT, DEFAULT_ZOOM } from '../../../utils/constants';
import './MapFrame.scss';

(mapboxgl as any).accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

interface ShapeData {
  [key: string]: number[][];
}

interface Station {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Route {
  id: string;
  name: string;
  color: string;
  text_color: string | null;
  alternate_name: string | null;
}

interface LineInfo {
  route: string;
  begin: string;
  end: string;
}

interface FeatureCollection {
  type: string;
  features: Array<{
    type: string;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: number[][] | number[];
    };
  }>;
}

interface Feature {
  type: string;
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

const MapFrame = ({ practiceMode = null, practiceGameIndex = null }: MapFrameProps): React.ReactElement => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [shapes, setShapes] = useState<ShapeData | null>(null);

  // Lazy load large shapes.json file (996KB) to reduce initial bundle size
  useEffect(() => {
    import('../../../data/shapes.json').then((shapesModule) => {
      setShapes(shapesModule.default as ShapeData);
    });
  }, []);

  const stopsGeoJson = useCallback((): FeatureCollection => {
    const currentSolution = todaysSolution(practiceMode, practiceGameIndex);
    const stops = [
      currentSolution.origin,
      currentSolution.first_transfer_arrival!,
      currentSolution.first_transfer_departure!,
      currentSolution.second_transfer_arrival!,
      currentSolution.second_transfer_departure!,
      currentSolution.destination,
    ];
    return {
      type: 'FeatureCollection',
      features: [...new Set(stops)].map((stopId) => {
        const station = (stations as Record<string, Station>)[stopId];
        return {
          type: 'Feature',
          properties: {
            id: stopId,
            name: station.name,
          },
          geometry: {
            type: 'Point',
            coordinates: [station.longitude, station.latitude],
          },
        };
      }),
    };
  }, [practiceMode, practiceGameIndex]);

  const lineGeoJson = useCallback(
    (line: LineInfo): Feature | null => {
      if (!shapes) return null; // Wait for shapes to load

      const route = (routes as Record<string, Route>)[line.route];
      if (!route) return null; // Route doesn't exist

      let shape: number[][] | undefined;
      const beginCoord = [(stations as Record<string, Station>)[line.begin].longitude, (stations as Record<string, Station>)[line.begin].latitude];
      const endCoord = [(stations as Record<string, Station>)[line.end].longitude, (stations as Record<string, Station>)[line.end].latitude];
      let coordinates: number[][] = [];

      // Helper function to find closest coordinate index using tolerance
      const findClosestCoordIndex = (targetCoord: number[], shapeArray: number[][]): number => {
        const TOLERANCE = 0.0001; // Approximately 11 meters
        let closestIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < shapeArray.length; i++) {
          const coord = shapeArray[i];
          const distance = Math.sqrt(
            Math.pow(coord[0] - targetCoord[0], 2) + Math.pow(coord[1] - targetCoord[1], 2)
          );

          // First try exact match
          if (distance < TOLERANCE) {
            if (distance < 0.00001) {
              return i; // Exact match found
            }
            // Track closest match within tolerance
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = i;
            }
          }
        }

        return closestIndex;
      };

      if (line.route === 'A') {
        const lineA1 = shapes['A1'];
        if (!lineA1) return null;

        const beginInA1 = findClosestCoordIndex(beginCoord, lineA1) !== -1;
        const endInA1 = findClosestCoordIndex(endCoord, lineA1) !== -1;

        if (beginInA1 && endInA1) {
          shape = shapes['A1'];
        } else {
          shape = shapes['A2'];
        }
      } else if (line.route === 'F' && isWeekend(practiceMode)) {
        shape = shapes['F-Weekend'];
      } else {
        shape = shapes[line.route];
      }

      if (!shape) return null; // Shape doesn't exist

      const beginIndex = findClosestCoordIndex(beginCoord, shape);
      const endIndex = findClosestCoordIndex(endCoord, shape);

      if (beginIndex === -1 || endIndex === -1) {
        return null; // Couldn't find coordinates
      }

      if (beginIndex < endIndex) {
        coordinates = shape.slice(beginIndex, endIndex + 1);
      } else {
        coordinates = shape.slice(endIndex, beginIndex + 1);
      }

      if (coordinates.length === 0) {
        return null; // No coordinates found
      }

      return {
        type: 'Feature',
        properties: {
          color: route.color,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      };
    },
    [shapes, practiceMode]
  );

  // Initialize map once
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [lng, lat],
      bearing: MANHATTAN_TILT,
      minZoom: 9,
      zoom: zoom,
      maxBounds: [
        [-74.8113, 40.1797],
        [-73.3584, 41.1247],
      ],
      maxPitch: 0,
    });
    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add map layers when shapes data is loaded
  useEffect(() => {
    if (!map.current || !shapes) return;

    const addMapLayers = () => {
      if (!map.current!.loaded()) {
        map.current!.once('load', addMapLayers);
        return;
      }

      // Remove existing layers if they exist
      ['line-0', 'line-1', 'line-2', 'Stops'].forEach((layerId) => {
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
        }
        if (map.current!.getSource(layerId)) {
          map.current!.removeSource(layerId);
        }
      });

      map.current!.resize();
      const trip = todaysTrip(practiceMode, practiceGameIndex);
      const solution = todaysSolution(practiceMode, practiceGameIndex);
      let coordinates: number[][] = [];
      [
        {
          route: trip[0],
          begin: solution.origin,
          end: solution.first_transfer_arrival!,
        },
        {
          route: trip[1],
          begin: solution.first_transfer_departure!,
          end: solution.second_transfer_arrival!,
        },
        {
          route: trip[2],
          begin: solution.second_transfer_departure!,
          end: solution.destination,
        },
      ].forEach((line, i) => {
        const lineJson = lineGeoJson(line);
        if (!lineJson) return;
        coordinates = coordinates.concat(lineJson.geometry.coordinates);
        const layerId = `line-${i}`;
        map.current!.addSource(layerId, {
          type: 'geojson',
          data: lineJson as unknown as GeoJSON.FeatureCollection,
        });
        map.current!.addLayer({
          id: layerId,
          type: 'line',
          source: layerId,
          layout: {
            'line-join': 'miter',
            'line-cap': 'round',
          },
          paint: {
            'line-width': 2,
            'line-color': ['get', 'color'],
          },
        });
      });
      const stopsJson = stopsGeoJson();
      map.current!.addSource('Stops', {
        type: 'geojson',
        data: stopsJson as unknown as GeoJSON.FeatureCollection,
      });
      map.current!.addLayer({
        id: 'Stops',
        type: 'symbol',
        source: 'Stops',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-font': ['Arial Bold', 'Arial Unicode MS Bold', 'Open Sans Bold'],
          'text-optional': false,
          'text-justify': 'auto',
          'text-allow-overlap': false,
          'text-padding': 1,
          'text-variable-anchor': ['bottom-right', 'top-right', 'bottom-left', 'top-left', 'right', 'left', 'bottom'],
          'text-radial-offset': 0.5,
          'icon-image': 'express-stop',
          'icon-size': 8 / 13,
          'icon-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });
      const bounds = coordinates.reduce(
        (bounds, coord) => {
          return bounds.extend(coord);
        },
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );

      if (!bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: {
            top: 20,
            right: 20,
            left: 20,
            bottom: 150,
          },
          bearing: MANHATTAN_TILT,
        });
      }
    };

    addMapLayers();
  }, [shapes, lineGeoJson, stopsGeoJson, practiceMode, practiceGameIndex]);

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    const handleMove = () => {
      setLng(Number(map.current!.getCenter().lng.toFixed(4)));
      setLat(Number(map.current!.getCenter().lat.toFixed(4)));
      setZoom(Number(map.current!.getZoom().toFixed(2)));
    };

    map.current.on('move', handleMove);

    return () => {
      if (map.current) {
        map.current.off('move', handleMove);
      }
    };
  }, []);

  return (
    <div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default MapFrame;
