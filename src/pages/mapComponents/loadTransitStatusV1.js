import { agencies } from '../../config.js';

import arrowImage from '../../assets/full_arrow_sdf.png';
import circleImage from '../../assets/full_circle_sdf.png';

//const feeds = [];

const loadTransitStatusV1 = async (map, setBottomOpen, setBottomState) => {
  map.loadImage(arrowImage, (error, arrowImageLoaded) => {
    if (error) throw error;
    map.addImage('full_arrow', arrowImageLoaded, { sdf: true });
    map.loadImage(circleImage, (error, circleImageLoaded) => {
      if (error) throw error;
      map.addImage('full_circle', circleImageLoaded, { sdf: true });
      Object.keys(agencies).forEach((agencyKey) => {
        const agency = agencies[agencyKey];
        //console.log(agency)

        const processTrainData = (agencyData) => {
          let trainsGeoJSON = {
            type: 'FeatureCollection',
            features: []
          };

          let stationsGeoJSON = {
            type: 'FeatureCollection',
            features: []
          };

          Object.keys(agencyData.trains).forEach((runNumber) => {
            const train = agencyData.trains[runNumber];

            trainsGeoJSON.features.push({
              type: 'Feature',
              id: runNumber,
              properties: {
                color: `#${train.lineColor}`,
                heading: train.heading,
                data: {
                  ...train,
                  agency: agencyKey,
                  lastUpdated: agencyData.lastUpdated,
                  runNumber
                }
              },
              geometry: {
                coordinates: [
                  train.lon,
                  train.lat
                ],
                type: 'Point'
              }
            })
          });

          Object.keys(agencyData.stations).forEach((stationID) => {
            const station = agencyData.stations[stationID];

            stationsGeoJSON.features.push({
              type: 'Feature',
              id: stationID,
              properties: {
                data: {
                  ...station,
                  agency: agencyKey,
                  lastUpdated: agencyData.lastUpdated
                }
              },
              geometry: {
                coordinates: [
                  station.lon,
                  station.lat
                ],
                type: 'Point'
              }
            })
          })

          return {
            trainsGeoJSON,
            stationsGeoJSON
          };
        }

        const getAgencyData = async () => {
          const res = await fetch(agency.endpoint);
          const data = await res.json();

          return data;
        }

        getAgencyData()
          .then((data) => {
            const processed = processTrainData(data);

            map.addSource(`transit-stations-${agencyKey}`, {
              type: 'geojson',
              data: processed.stationsGeoJSON
            });

            map.addLayer({
              id: `transit-stations-${agencyKey}`,
              type: 'circle',
              source: `transit-stations-${agencyKey}`,
              paint: {
                'circle-radius': 6,
                'circle-color': '#fff',
                'circle-stroke-color': '#000',
                'circle-stroke-width': 2,
              },
            });

            map.addSource(`transit-vehicles-${agencyKey}`, {
              type: 'geojson',
              data: processed.trainsGeoJSON
            });

            map.addLayer({
              id: `transit-vehicles-${agencyKey}`,
              type: 'symbol',
              source: `transit-vehicles-${agencyKey}`,
              layout: {
                'icon-image': agency.showArrow ? 'full_arrow' : 'full_circle',
                'icon-size': 0.5,
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-rotate': ['get', 'heading'],
              },
              paint: {
                'icon-color': ['get', 'color'],
                'icon-halo-color': '#ffffff',
                'icon-halo-width': 2,
              }
            });

            setInterval(() => {
              getAgencyData()
                .then((data) => {
                  const processed = processTrainData(data);

                  map.getSource(`transit-vehicles-${agencyKey}`)
                    .setData(processed.trainsGeoJSON)

                  map.getSource(`transit-stations-${agencyKey}`)
                    .setData(processed.stationsGeoJSON)
                });
            }, 10000)
          })
      })
    });
  });
};

export default loadTransitStatusV1;