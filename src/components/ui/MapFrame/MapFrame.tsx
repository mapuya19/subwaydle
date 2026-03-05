import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

import { isWeekend, todaysTrip, todaysSolution } from '../../../utils/answerValidations';

import stations from "../../../data/stations.json";
import routes from "../../../data/routes.json";

import { MANHATTAN_TILT, DEFAULT_LNG, DEFAULT_LAT, DEFAULT_ZOOM } from '../../../utils/constants';
import { PracticeMode } from '../../../utils/constants';

import './MapFrame.scss';

(mapboxgl as any).accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

interface MapFrameProps {
  practiceMode?: PracticeMode | null;
  practiceGameIndex?: number | null;
}

type Station = {
  name: string;
  longitude: number;
  latitude: number;
};

type StationsData = Record<string, Station>;

type RouteInfo = {
  id: string;
  name: string;
  color: string;
  text_color: string | null;
  alternate_name: string | null;
};

type RoutesData = Record<string, RouteInfo>;

type Line = {
  route: string;
  begin: string;
  end: string;
};

const MapFrame = ({ practiceMode = null, practiceGameIndex = null }: MapFrameProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [shapes, setShapes] = useState<Record<string, number[][]> | null>(null);

  useEffect(() => {
    import("../../../data/shapes.json").then((shapesModule) => {
      setShapes(shapesModule.default);
    });
  }, []);

  const stopsGeoJson = useCallback(() => {
    const currentSolution = todaysSolution(practiceMode, practiceGameIndex);
    const stops = [
      currentSolution.origin,
      currentSolution.first_transfer_arrival,
      currentSolution.first_transfer_departure,
      currentSolution.second_transfer_arrival,
      currentSolution.second_transfer_departure,
      currentSolution.destination
    ];
    return {
      "type": "FeatureCollection",
      "features": [...new Set(stops)].map((stopId) => {
        const station = (stations as StationsData)[stopId];
        return {
          "type": "Feature",
          "properties": {
            "id": stopId,
            "name": station.name,
          },
          "geometry": {
            "type": "Point",
            "coordinates": [station.longitude, station.latitude]
          }
        }
      })
    };
  }, [practiceMode, practiceGameIndex]);

  const lineGeoJson = useCallback((line: Line) => {
    if (!shapes) return null;
    
    const route = (routes as RoutesData)[line.route];
    if (!route) return null;
    
    let shape: number[][] | undefined;
    const beginCoord = [(stations as StationsData)[line.begin].longitude, (stations as StationsData)[line.begin].latitude];
    const endCoord = [(stations as StationsData)[line.end].longitude, (stations as StationsData)[line.end].latitude];
    let coordinates: number[][] = [];

    const findClosestCoordIndex = (targetCoord: number[], shapeArray: number[][]): number => {
      const TOLERANCE = 0.0001;
      let closestIndex = -1;
      let minDistance = Infinity;
      
      for (let i = 0; i < shapeArray.length; i++) {
        const coord = shapeArray[i];
        const distance = Math.sqrt(
          Math.pow(coord[0] - targetCoord[0], 2) + 
          Math.pow(coord[1] - targetCoord[1], 2)
        );
        
        if (distance < TOLERANCE) {
          if (distance < 0.00001) {
            return i;
          }
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

    if (!shape) return null;

    const beginIndex = findClosestCoordIndex(beginCoord, shape);
    const endIndex = findClosestCoordIndex(endCoord, shape);

    if (beginIndex === -1 || endIndex === -1) {
      return null;
    }

    if (beginIndex < endIndex) {
      coordinates = shape.slice(beginIndex, endIndex + 1);
    } else {
      coordinates = shape.slice(endIndex, beginIndex + 1);
    }

    if (coordinates.length === 0) {
      return null;
    }

    return {
      "type": "Feature",
      "properties": {
        "color": route.color,
      },
      "geometry": {
        "type": "LineString",
        "coordinates": coordinates
      }
    };
  }, [shapes, practiceMode]);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [lng, lat],
      bearing: MANHATTAN_TILT,
      minZoom: 9,
      zoom: zoom,
      maxBounds: [
        [-74.8113, 40.1797],
        [-73.3584, 41.1247]
      ],
      maxPitch: 0,
    });
    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();
  }, []);

  useEffect(() => {
    if (!map.current || !shapes) return;
    
    const addMapLayers = () => {
      if (!map.current || !map.current.loaded()) {
        if (map.current) {
          map.current.once('load', addMapLayers);
        }
        return;
      }

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
          end: solution.first_transfer_arrival,
        },
        {
          route: trip[1],
          begin: solution.first_transfer_departure,
          end: solution.second_transfer_arrival,
        },
        {
          route: trip[2],
          begin: solution.second_transfer_departure,
          end: solution.destination,
        },
      ].forEach((line, _i) => {
        const lineJson = lineGeoJson(line);
        if (!lineJson) return;
        const layerId = `line-${_i}`;
        map.current!.addSource(layerId, {
          "type": "geojson",
          "data": lineJson as any
        });
        map.current!.addLayer({
          "id": layerId,
          "type": "line",
          "source": layerId,
          "layout": {
            "line-join": "miter",
            "line-cap": "round",
          },
          "paint": {
            "line-width": 2,
            "line-color": ["get", "color"],
          }
        });
      });
      const stopsJson = stopsGeoJson();
      map.current!.addSource("Stops", {
        "type": "geojson",
        "data": stopsJson as any
      });
      map.current!.addLayer({
        "id": "Stops",
        "type": "symbol",
        "source": "Stops",
        "layout": {
          "text-field": ['get', 'name'],
          "text-size": 12,
          "text-font": ['Arial Bold', 'Arial Unicode MS Bold', 'Open Sans Bold'],
          "text-optional": false,
          "text-justify": "auto",
          'text-allow-overlap': false,
          "text-padding": 1,
          "text-variable-anchor": ["bottom-right", "top-right", "bottom-left", "top-left", "right", "left", "bottom"],
          "text-radial-offset": 0.5,
          "icon-image": "express-stop",
          "icon-size": 8/13,
          "icon-allow-overlap": true,
        },
        "paint": {
          "text-color": '#ffffff',
        },
      });
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

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
    if (!map.current) return;
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
