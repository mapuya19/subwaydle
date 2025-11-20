import './TrainBullet.scss';

// Map route IDs to SVG filenames in public folder
const getSvgFileName = (id) => {
  const svgMap = {
    'GS': 's',
    'FS': 'sf',
    'SI': 'sir',
    'H': 'sr',
  };
  
  if (svgMap[id]) {
    return svgMap[id];
  }
  
  // Numbers stay as-is, letters convert to lowercase
  if (/^\d+$/.test(id)) {
    return id;
  }
  
  return id.toLowerCase();
};

const TrainBullet = (props) => {
  const { id, size = 'medium' } = props;
  const svgFileName = getSvgFileName(id);
  const svgPath = `/train-bullets/${svgFileName}.svg`;

  return (
    <img 
      src={svgPath} 
      alt={id} 
      className={`train-bullet train-bullet-${size}`}
    />
  );
}

export default TrainBullet;