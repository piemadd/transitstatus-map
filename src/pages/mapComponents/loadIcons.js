const onlyThese = ['000000_FFFFFF', 'FFFFFF_000000'];
const enforceOnlyThese = true;

const loadIcons = (map) => {

  map.loadImage('./icons/000000_FFFFFF.png', (error, image) => {
    if (error) throw error;
    map.addImage('lightOutline', image, { sdf: true });
  });

  map.loadImage('./icons/FFFFFF_000000.png', (error, image) => {
    if (error) throw error;
    map.addImage('darkOutline', image, { sdf: true });
  });
}

export default loadIcons;