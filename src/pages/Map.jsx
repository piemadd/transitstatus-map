import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles"; //pmtiles stuff
//import layers from "protomaps-themes-base";
import mapLayers from "../assets/mapLayers.json";
import Sheet from "react-modal-sheet";

import loadTransitStatusV1 from "./loadTransitStatusV1.js";

//import gtfsShapes from "../meta/gtfsShapes.json";
//import passioShapes from "../meta/passioShapes.json";
//import icons from "../meta/icons.json";

//pmtiles protocol handling setup
let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [bottomOpen, setBottomOpen] = useState(false);

  useEffect(() => {
    if (map.current) return; // stops map from intializing more than once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      hash: true,
      style: {
        zoom: 0,
        pitch: 0,
        center: [41.884579601743276, -87.6279871036212],
        glyphs: "https://fonts.transitstat.us/_output/{fontstack}/{range}.pbf",
        sprite: "https://osml.transitstat.us/sprites/osm-liberty",
        layers: mapLayers, //layers("protomaps", "dark"),
        bearing: 0,
        sources: {
          protomaps: {
            type: "vector",
            tiles: [
              "https://tilea.piemadd.com/tiles/{z}/{x}/{y}.mvt",
              "https://tileb.piemadd.com/tiles/{z}/{x}/{y}.mvt",
              "https://tilec.piemadd.com/tiles/{z}/{x}/{y}.mvt",
              "https://tiled.piemadd.com/tiles/{z}/{x}/{y}.mvt",
            ],
            maxzoom: 15,
            attribution:
              "Map Data &copy; OpenStreetMap Contributors | &copy; Transitstatus 2023 | Uses Protomaps",
          },
          natural_earth_shaded_relief: {
            maxzoom: 6,
            tileSize: 256,
            tiles: ["https://naturalearthtiles.transitstat.us/{z}/{x}/{y}.png"],
            type: "raster",
          },
          transit_lines: {
            type: "vector",
            url: "pmtiles://https://gobbler.transitstat.us/transit.pmtiles",
            maxzoom: 12,
          },
        },
        version: 8,
        metadata: {},
      },
      center: [-96.63, 38.82],
      zoom: 3,
    });
    
    loadTransitStatusV1(map.current);

    map.current.once("load", () => {
      //load in the shapes upon map loading complete
      /*
      [...new Set(gtfsShapes)].forEach((shapePath) => {
        const shapeURL = `https://gtfs.piemadd.com/data/${shapePath}`;
        const agencyKey = `${shapePath.split("/")[0]}_${shapePath
          .split("/")[2]
          .replace(".geojson", "")}`;
        fetch(shapeURL)
          .then((res) => res.json())
          .then((data) => {
            map.current.addSource(`routes_${agencyKey}`, {
              type: "geojson",
              data: data,
            });

            map.current.addLayer({
              id: `routes_${agencyKey}`,
              type: "line",
              source: `routes_${agencyKey}`,
              minzoom: data.features[0].properties.minZoom,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": ["get", "routeColor"],
                "line-opacity": 1,
                "line-width": 2,
              },
            });
          });
      });

      [...new Set(passioShapes)].forEach((shapePath) => {
        const shapeURL = `https://passio.piemadd.com/data/${shapePath}`;
        const agencyKey = shapePath.split("/")[0];
        fetch(shapeURL)
          .then((res) => res.json())
          .then((data) => {
            map.current.addSource(`routes_${agencyKey}`, {
              type: "geojson",
              data: data,
            });

            map.current.addLayer({
              id: `routes_${agencyKey}`,
              type: "line",
              minzoom: data.features[0].properties.minZoom,
              source: `routes_${agencyKey}`,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": ["get", "routeColor"],
                "line-opacity": 1,
                "line-width": 2,
              },
            });
          });
      });
      */
    });
  }, []);

  return (
    <>
      <section className='topBar'>
        <button onClick={() => setBottomOpen(true)}>Open</button>
      </section>
      <section className='map' ref={mapContainer}></section>
      <Sheet
        isOpen={bottomOpen}
        onClose={() => setBottomOpen(false)}
        detent='full-height'
        snapPoints={[1.0, 0.25]}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            <p>Hello world!</p>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </>
  );
};

export default Map;
