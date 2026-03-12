import StatsBox from '../StatsBox/StatsBox';
import StatsHistogram from '../StatsHistogram/StatsHistogram';
import { useStats } from '../../../contexts/StatsContext';
import { useDarkMode } from '../../../contexts';
import { GameStats } from '../../../utils/stats';

interface StatsProps {
  isDarkMode?: boolean;
  stats?: GameStats;
}

const Stats = (_props: StatsProps) => {
  const { stats } = useStats();
  const isDarkMode = useDarkMode();
  return (
    <>
      <StatsBox isDarkMode={isDarkMode} stats={stats} />
      <StatsHistogram isDarkMode={isDarkMode} stats={stats} />
    </>
  );
};

export default Stats;
