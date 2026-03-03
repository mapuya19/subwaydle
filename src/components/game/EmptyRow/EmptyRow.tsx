import { Grid, Segment } from 'semantic-ui-react';
import type { EmptyRowProps } from '../../../types/components';

const EmptyRow = ({ count }: EmptyRowProps): React.ReactElement => {
  return (
    <Grid.Row>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Grid.Column key={i}>
            <Segment placeholder></Segment>
          </Grid.Column>
        ))}
    </Grid.Row>
  );
};

export default EmptyRow;
