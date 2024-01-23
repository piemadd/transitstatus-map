import { agencies } from '../../config.js';

import iconImage from '../../assets/full_arrow_sdf.png';

//const feeds = [];

const loadTransitStatusV1 = (map) => {
  map.loadImage(iconImage, (error, image) => {
    if (error) throw error;
    map.addImage('full_arrow', image, { sdf: true });


    Object.keys(agencies).forEach((agencyKey) => {
      const agency = agencies[agencyKey];
      //console.log(agency)

      const processTrainData = (agencyData) => {
        let trainsGeoJSON = {
          "type": "FeatureCollection",
          "features": []
        };

        Object.keys(agencyData.trains).forEach((runNumber) => {
          const train = agencyData.trains[runNumber];

          trainsGeoJSON.features.push({
            "type": "Feature",
            "properties": {
              color: `#${train.lineColor}`,
              heading: train.heading,
              train,
            },
            "geometry": {
              "coordinates": [
                train.lon,
                train.lat
              ],
              "type": "Point"
            }
          })
        })

        return trainsGeoJSON;
      }

      const getAgencyData = async () => {
        const res = await fetch(agency.endpoint);
        const data = await res.json();
        
        return data;
      }

      getAgencyData()
        .then((data) => {
          const processed = processTrainData(data);

          map.addSource(`transit-vehicles-${agencyKey}`, {
            type: 'geojson',
            data: processed
          });

          map.addLayer({
            'id': `transit-vehicles-${agencyKey}`,
            'type': 'symbol',
            'source': `transit-vehicles-${agencyKey}`,
            'layout': {
              'icon-image': 'full_arrow',
              'icon-size': 0.5,
              "icon-rotation-alignment": "map",
              "icon-allow-overlap": true,
              "icon-rotate": ["get", "heading"],
            },
            "paint": {
              "icon-color": ["get", "color"],
              "icon-halo-color": "#ffffff",
              "icon-halo-width": 2
            }
          });

          setInterval(() => {
            getAgencyData()
              .then((data) => {
                const processed = processTrainData(data);

                map.getSource(`transit-vehicles-${agencyKey}`)
                  .setData(processed)
              });
          }, 10000)
        })
    })
  });
};

export default loadTransitStatusV1;