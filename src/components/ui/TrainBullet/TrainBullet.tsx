import './TrainBullet.scss';
import type { TrainBulletProps } from '../../../types/components';

// Map route IDs to SVG filenames in public folder
const getSvgFileName = (id: string): string => {
  const svgMap: Record<string, string> = {
    GS: 's',
    FS: 'sf',
    SI: 'sir',
    H: 'sr',
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

const TrainBullet = ({ id, size = 'medium' }: TrainBulletProps): React.ReactElement => {
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
