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

      const getAgencyData = async () => {
        const res = await fetch(agency.endpoint);
        const data = await res.json();
        let finalGeoJSON = {
          "type": "FeatureCollection",
          "features": []
        };

        Object.keys(data.trains).forEach((runNumber) => {
          const train = data.trains[runNumber];

          finalGeoJSON.features.push({
            "type": "Feature",
            "properties": {
              color: `#${train.lineColor}`,
              heading: train.heading,
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

        return finalGeoJSON;
      }

      getAgencyData()
        .then((data) => {
          map.addSource(`transit-vehicles-${agencyKey}`, {
            type: 'geojson',
            data: data
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
                map.getSource(`transit-vehicles-${agencyKey}`)
                  .setData(data)
              });
          }, 10000)
        })
    })
  });
};

export default loadTransitStatusV1;