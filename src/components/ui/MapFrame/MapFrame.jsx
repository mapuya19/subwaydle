import PropTypes from 'prop-types';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax

import { todaysTrip, todaysSolution } from '../../../utils/answerValidations';

import stations from "../../../data/stations.json";
import routes from "../../../data/routes.json";

import { MANHATTAN_TILT, DEFAULT_LNG, DEFAULT_LAT, DEFAULT_ZOOM } from '../../../utils/constants';

import './MapFrame.scss';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapFrame = (props) => {
  const { practiceMode = null, practiceGameIndex = null } = props;
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [shapes, setShapes] = useState(null);

  // Lazy load the large shapes.json file (996KB) to reduce initial bundle size
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
        const station = stations[stopId];
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

  const lineGeoJson = useCallback((line) => {
    if (!shapes) return null; // Wait for shapes to load
    
    const route = routes[line.route];
    let shape;
    const beginCoord = [stations[line.begin].longitude, stations[line.begin].latitude];
    const endCoord = [stations[line.end].longitude, stations[line.end].latitude];
    let coordinates = [];

    if (line.route === 'A') {
      const lineA1 = shapes['A1'];
      if (lineA1.some((coord) => coord[0] === beginCoord[0] && coord[1] === beginCoord[1]) && lineA1.some((coord) => coord[0] === endCoord[0] && coord[1] === endCoord[1])) {
        shape = shapes['A1'];
      } else {
        shape = shapes['A2'];
      }
    } else {
      shape = shapes[line.route];
    }

    const beginIndex = shape.findIndex((coord) => coord[0] === beginCoord[0] && coord[1] === beginCoord[1]);
    const endIndex = shape.findIndex((coord) => coord[0] === endCoord[0] && coord[1] === endCoord[1]);

    if (beginIndex < endIndex) {
      coordinates = shape.slice(beginIndex, endIndex + 1);
    } else {
      coordinates = shape.slice(endIndex, beginIndex + 1);
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
    }
  }, [shapes]);

  // Initialize map once
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add map layers when shapes data is loaded
  useEffect(() => {
    if (!map.current || !shapes) return;
    
    const addMapLayers = () => {
      if (!map.current.loaded()) {
        map.current.once('load', addMapLayers);
        return;
      }

      // Remove existing layers if they exist
      ['line-0', 'line-1', 'line-2', 'Stops'].forEach((layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(layerId)) {
          map.current.removeSource(layerId);
        }
      });

      map.current.resize();
      const trip = todaysTrip(practiceMode, practiceGameIndex);
      const solution = todaysSolution(practiceMode, practiceGameIndex);
      let coordinates = [];
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
      ].forEach((line, i) => {
        const lineJson = lineGeoJson(line);
        if (!lineJson) return;
        coordinates = coordinates.concat(lineJson.geometry.coordinates);
        const layerId = `line-${i}`;
        map.current.addSource(layerId, {
          "type": "geojson",
          "data": lineJson
        });
        map.current.addLayer({
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
      map.current.addSource("Stops", {
        "type": "geojson",
        "data": stopsJson
      });
      map.current.addLayer({
        "id": "Stops",
        "type": "symbol",
        "source": "Stops",
        "layout": {
          "text-field": ['get', 'name'],
          "text-size": 12,
          "text-font": ['Lato Bold', "Open Sans Bold","Arial Unicode MS Bold"],
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
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
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
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
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
}

MapFrame.propTypes = {
  practiceMode: PropTypes.string,
  practiceGameIndex: PropTypes.number,
};

export default MapFrame;
