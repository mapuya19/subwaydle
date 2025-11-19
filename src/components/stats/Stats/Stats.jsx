import StatsBox from '../StatsBox/StatsBox';
import StatsHistogram from '../StatsHistogram/StatsHistogram';
import { useStats } from '../../../contexts/StatsContext';
import { useDarkMode } from '../../../contexts';

const Stats = (props) => {
  const { stats } = useStats();
  const isDarkMode = useDarkMode();
  return (
    <>
      <StatsBox isDarkMode={isDarkMode} stats={stats} />
      <StatsHistogram isDarkMode={isDarkMode} stats={stats} />
    </>
  );
}

export default Stats;