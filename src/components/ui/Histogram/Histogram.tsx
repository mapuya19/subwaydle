import { Header, Statistic } from 'semantic-ui-react';

interface HistogramStats {
  totalGames?: number;
  successRate?: number;
  currentStreak?: number;
  bestStreak?: number;
  distribution?: number[];
  played?: number;
  win?: number;
  streak?: number;
  maxStreak?: number;
}

const Histogram = ({ stats }: { stats: HistogramStats }): React.ReactElement => {
  return (
    <>
      <Header as="h3">Statistics</Header>
      <Statistic.Group size="mini">
        <Statistic>
          <Statistic.Value>{stats.totalGames || stats.played}</Statistic.Value>
          <Statistic.Label>Played</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{stats.successRate}</Statistic.Value>
          <Statistic.Label>Win %</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{stats.currentStreak || stats.streak}</Statistic.Value>
          <Statistic.Label>Current<br />Streak</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{stats.bestStreak || stats.maxStreak}</Statistic.Value>
          <Statistic.Label>Max<br />Streak</Statistic.Label>
        </Statistic>
      </Statistic.Group>
    </>
  );
};

export default Histogram;
