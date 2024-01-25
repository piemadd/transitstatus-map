import { agencies } from "../config.js";

import React, { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles"; //pmtiles stuff
//import layers from "protomaps-themes-base";
import mapLayers from "../assets/mapLayers.json";
import Sheet from "react-modal-sheet";

import loadTransitStatusV1 from "./mapComponents/loadTransitStatusV1.js";
import { hoursMinutesUntilArrival, timeFormat } from "./timeHelpers.js";

//import gtfsShapes from "../meta/gtfsShapes.json";
//import passioShapes from "../meta/passioShapes.json";
//import icons from "../meta/icons.json";

//pmtiles protocol handling setup
let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const stationDestinationsToLines = (agency, stationName, destinations) => {
  return Object.keys(destinations)
    .flatMap((destinationKey, i) => {
      const destination = destinations[destinationKey];

      if (destination.trains.length === 0) return destinationKey;

      //adding to dict to split up by line
      let lines = {};
      destination.trains.forEach((train) => {
        if (!lines[train.lineCode]) lines[train.lineCode] = [];
        lines[train.lineCode].push({
          ...train,
          destination: destinationKey,
        });
      });

      //sort each line and return
      return Object.values(lines).map((line) =>
        line.sort((a, b) => a.actualETA - b.actualETA)
      );
    })
    .sort((a, b) => {
      //no trains, based on name alphabetically
      if (!Array.isArray(a) && !Array.isArray(b)) return a - b;
      //both have trains, based on next train time
      if (Array.isArray(a) && Array.isArray(b))
        return a[0].actualETA - b[0].actualETA;

      //only a has trains
      if (Array.isArray(a)) return -1;
      //only b has trains
      if (Array.isArray(b)) return 1;

      //fallback that probably wont work
      return b - a;
    });
};

const StationDestinationsMin = ({ destinations }) => {};

const StationDestinations = ({
  agency,
  stationName,
  destinations,
  bottomSnap,
}) => {
  return stationDestinationsToLines(agency, stationName, destinations)
    .map((n) => {
      console.log(n);
      return n;
    })
    .map((line, i) => {
      if (Array.isArray(line)) {
        return (
          <>
            <div
              className='train'
              style={{
                backgroundColor: "#" + line[0].lineColor,
                color: "#" + line[0].lineTextColor,
              }}
            >
              <span>
                <p>
                  {agencies[agency].useCodeForShortName
                    ? line[0].lineCode
                    : line[0].line}
                  {agencies[agency].addLine ? " Line " : " "}#
                  {agencies[agency].removeLineCodeFromRunNumber
                    ? line[0].runNumber.replace(line[0].lineCode, "")
                    : line[0].runNumber}{" "}
                  to
                </p>
                <h3>
                  {line[0].destination
                    ? line[0].destination
                    : line[0].routeLongName}
                </h3>
                {line[0].extra && line[0].extra.info ? (
                  <p>{line[0].extra.info}</p>
                ) : null}
              </span>
              {!line[0].noETA ? (
                <span>
                  <h3 className='trainTime'>
                    {hoursMinutesUntilArrival(line[0].actualETA)}
                  </h3>
                  <p className='trainTime'>{timeFormat(line[0].actualETA)}</p>
                  {line[0].extra && line[0].extra.cap ? (
                    <p className='trainTime'>
                      {Math.ceil(
                        (line[0].extra.load / line[0].extra.cap) * 100
                      )}
                      % Full
                    </p>
                  ) : null}
                </span>
              ) : (
                <span>
                  <h3 className='trainTime'>No ETA</h3>
                  {line[0].extra && line[0].extra.cap ? (
                    <p className='trainTime'>
                      {Math.ceil(
                        (line[0].extra.load / line[0].extra.cap) * 100
                      )}
                      % Full
                    </p>
                  ) : null}
                </span>
              )}
            </div>
            {line.length > 1 && bottomSnap === 0 ? (
              <div className='trainAdd'>
                <div
                  className='train'
                  style={{
                    backgroundColor: "#" + line[0].lineColor,
                    color: "#" + line[0].lineTextColor,
                  }}
                >
                  <h4>Also in:</h4>
                </div>
                {line.slice(1).map((train) => {
                  return (
                    <div
                      className='train'
                      style={{
                        backgroundColor: "#" + train.lineColor,
                        color: "#" + train.lineTextColor,
                      }}
                    >
                      {!train.noETA ? (
                        <span>
                          <h3 className='trainTime'>
                            {hoursMinutesUntilArrival(train.actualETA)}
                          </h3>
                          <p className='trainTime'>
                            {timeFormat(train.actualETA)}
                          </p>
                          {train.extra && train.extra.cap ? (
                            <p className='trainTime'>
                              {Math.ceil(
                                (train.extra.load / train.extra.cap) * 100
                              )}
                              % Full
                            </p>
                          ) : null}
                        </span>
                      ) : (
                        <span>
                          <h3 className='trainTime'>No ETA</h3>
                          {train.extra && train.extra.cap ? (
                            <p className='trainTime'>
                              {Math.ceil(
                                (train.extra.load / train.extra.cap) * 100
                              )}
                              % Full
                            </p>
                          ) : null}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        );
      } else if (typeof line === "string") {
        return <p className='destinations'>Nothing towards {line}</p>;
      }
      return <p>line</p>;
    });
};

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const sheet = useRef(null);
  const snapTo = (i) => sheet.current?.snapTo(i);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [bottomSnap, setBottomSnap] = useState(1);
  const [bottomState, setBottomState] = useState(null);

  window.setBottomState = setBottomState; //dont ask

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
          /*
          natural_earth_shaded_relief: {
            maxzoom: 6,
            tileSize: 256,
            tiles: ["https://naturalearthtiles.transitstat.us/{z}/{x}/{y}.png"],
            type: "raster",
          },
          */
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

    loadTransitStatusV1(map.current, setBottomOpen, setBottomState).then(() => {
      map.current.on("click", function (e) {
        let f = map.current
          .queryRenderedFeatures(e.point)
          .filter((feature) => feature.source.startsWith("transit-")); //NOT transit_, that is the transit lines

        if (f.length === 0) return; //do nothing
        if (f.length === 1) {
          //only clicked on 1
          const item = f[0];
          const itemType = item.source.split("-")[1];

          setBottomState({
            itemType,
            data: JSON.parse(item?.properties?.data),
          });
          setBottomOpen(true);
          console.log("Bottom Sheet Opened");
          return;
        } else {
          const data = JSON.parse(f[0].properties.data);

          new maplibregl.Popup()
            .setLngLat([data.lon, data.lat])
            .setHTML(
              "I haven't accounted for someone clicking 2 things at once yet, sorry"
            )
            .addTo(map.current);

          console.log("more than 1, need to spread");
        }
      });
    });
  }, []);

  return (
    <>
      <section className='topBar'>
        <div className='topBarContent'>
          <h1>Transitstat.us</h1>
          <p>2.0.0-beta.1</p>
        </div>
      </section>
      <section className='map' ref={mapContainer}></section>
      <Sheet
        ref={sheet}
        isOpen={bottomOpen}
        onClose={() => setBottomOpen(false)}
        detent='full-height'
        initialSnap={1}
        snapPoints={[1.0, 0.5]} // 134]}
        onSnap={(snapIndex) => {
          console.log("> Current snap point index:", snapIndex);
          setBottomSnap(snapIndex);
        }}
      >
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content>
            <Sheet.Scroller>
              <section className='modal-sheet-content'>
                {bottomState?.itemType === "stations" ? (
                  <>
                    <div className='stationTitleHolder'>
                      <div className='stationTitle'>
                        <h2>{bottomState.data.stationName}</h2>
                        <p>
                          As of{" "}
                          {new Date(
                            bottomState.data.lastUpdated
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {/*}
                    <button
                      className='stationTitleButton'
                      onClick={() => {
                        bottomSnap === 1 ? snapTo(0) : setBottomOpen(false);
                      }}
                    >
                      {bottomSnap === 1 ? "Expand" : "Close"}
                    </button>
                    */}
                    </div>
                    <StationDestinations
                      agency={bottomState.data.agency}
                      stationName={bottomState.data.stationName}
                      destinations={bottomState.data.destinations}
                      bottomSnap={bottomSnap}
                    />
                  </>
                ) : null}
                {bottomState?.itemType === "vehicles" ? (
                  <>
                    <div className='stationTitleHolder'>
                      <div className='stationTitle'>
                        <h2>Run {bottomState.data.runNumber}</h2>
                        <p>
                          As of{" "}
                          {new Date(
                            bottomState.data.lastUpdated
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        className='stationTitleButton'
                        onClick={() => {
                          bottomSnap === 1 ? snapTo(0) : setBottomOpen(false);
                        }}
                      >
                        {bottomSnap === 1 ? "Expand" : "Close"}
                      </button>
                    </div>
                    <p>Vehicles are currently not supported</p>
                  </>
                ) : null}
              </section>
            </Sheet.Scroller>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={() => setBottomOpen(false)} />
      </Sheet>
    </>
  );
};

export default Map;
