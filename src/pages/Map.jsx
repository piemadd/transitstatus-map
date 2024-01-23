import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles"; //pmtiles stuff
//import layers from "protomaps-themes-base";
import mapLayers from "../assets/mapLayers.json";
import Sheet from "react-modal-sheet";

import loadTransitStatusV1 from "./mapComponents/loadTransitStatusV1.js";

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
              "https://tilea.transitstat.us/tiles/{z}/{x}/{y}.mvt",
              "https://tileb.transitstat.us/tiles/{z}/{x}/{y}.mvt",
              "https://tilec.transitstat.us/tiles/{z}/{x}/{y}.mvt",
              "https://tiled.transitstat.us/tiles/{z}/{x}/{y}.mvt",
            ],
            maxzoom: 15,
            attribution:
              "Map Data &copy; OpenStreetMap Contributors | &copy; Transitstatus | &copy; Protomaps",
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
