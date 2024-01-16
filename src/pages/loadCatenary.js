import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const turnEntityIntoGeoJSON = (raw) => {
  try {
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(raw)
    );

    const geoJSON = {
      "type": "FeatureCollection",
      "features": feed.entity.map((entity) => {
        const vehicle = entity.vehicle;

        return {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "coordinates": [
              vehicle.position.longitude,
              vehicle.position.latitude
            ],
            "type": "Point"
          }
        }
      })
    }

    return geoJSON
  } catch (e) {
    return {
      type: "FeatureCollection",
      features: [],
    }
  }
}

const loadCatenary = (map) => {
  if (!map) return false;

  fetch('https://kactus.catenarymaps.org/gtfsrttimes')
    .then((res) => res.json())
    .then((feeds) => {
      feeds.forEach((feed) => {
        const feedID = feed.feed;

        fetch(`https://kactus.catenarymaps.org/gtfsrt/?feed=${feedID}&category=vehicles`)
          .then((res) => res.arrayBuffer())
          .then((raw) => {

            const geoJSON = turnEntityIntoGeoJSON(raw);

            map.addSource(feedID, {
              type: 'geojson',
              data: geoJSON
            })

            map.addLayer({
              id: feedID,
              source: feedID,
              type: 'circle',
              paint: {
                'circle-radius': 4,
                'circle-color': '#007cbf',
                'circle-stroke-width': 1,
                'circle-stroke-color': "#ffffff"
              }
            })

            console.log('Initialized:', feedID)

            /*
            setInterval(() => {
              fetch('https://kactus.catenarymaps.org/gtfsrt/?feed=f-metro~losangeles~bus~rt&category=vehicles')
                .then((res) => res.arrayBuffer())
                .then((raw) => {
                  const newGeoJSON = turnEntityIntoGeoJSON(raw);
                  map.getSource(feedID).setData(newGeoJSON)
                  //console.log('Updated:', feedID)
                })
            }, 2000)
            */
          })
      })


    })
};

export default loadCatenary;