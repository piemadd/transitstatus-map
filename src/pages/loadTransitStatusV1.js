import { agencies } from '../config.js';

console.log(agencies)

//const feeds = [];

const loadTransitStatusV1 = (map) => {
  map.loadImage('./icons/full_arrow_sdf.png', (error, image) => {
    if (error) throw error;
    map.addImage('full_arrow', image, { sdf: true });
  });

  Object.keys(agencies).forEach((agencyKey) => {
    const agency = agencies[agencyKey];
    //console.log(agency)

    const getAgencyData = () => {
      fetch(agency.endpoint)
        .then((res) => res.json())
        .then((data) => {
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

          map.addSource(`transit-vehicles-${agencyKey}`, {
            type: 'geojson',
            data: finalGeoJSON
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

        })

      return false;
    }

    console.log(getAgencyData());
  })
};

export default loadTransitStatusV1;