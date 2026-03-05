import './TrainBullet.scss';

type TrainBulletSize = 'small' | 'medium' | 'large';

interface TrainBulletProps {
  id: string;
  size?: TrainBulletSize;
}

const getSvgFileName = (id: string): string => {
  const svgMap: Record<string, string> = {
    'GS': 's',
    'FS': 'sf',
    'SI': 'sir',
    'H': 'sr',
  };
  
  if (svgMap[id]) {
    return svgMap[id];
  }
  
  if (/^\d+$/.test(id)) {
    return id;
  }
  
  return id.toLowerCase();
};

const TrainBullet = ({ id, size = 'medium' }: TrainBulletProps) => {
  const svgFileName = getSvgFileName(id);
  const svgPath = `/train-bullets/${svgFileName}.svg`;

  return (
    <img 
      src={svgPath} 
      alt={id} 
      className={`train-bullet train-bullet-${size}`}
    />
  );
};

export default TrainBullet;
