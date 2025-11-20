import PropTypes from 'prop-types';
import { Modal, Header, Grid, Segment, Icon, Label } from 'semantic-ui-react';
import TrainBullet from '../../ui/TrainBullet/TrainBullet';
import { useSettings, useDarkMode } from '../../../contexts';

import './AboutModal.scss';

const AboutModal = (props) => {
  const { open, handleClose } = props;
  const { settings } = useSettings();
  const isDarkMode = useDarkMode();
  return (
    <Modal closeIcon open={open} onClose={handleClose} size='tiny' className={isDarkMode ? 'about-modal dark' : 'about-modal'}>
      <Modal.Header>How to Play</Modal.Header>
      <Modal.Content scrolling>
        <Header as='h4'>About This Version</Header>
        <p><strong>Subwaydle Remastered</strong> is an enhanced fork of the original <a href="https://www.subwaydle.com" target="_blank" rel="noreferrer">Subwaydle</a>. 
        This version includes several improvements, such as:</p>
        <ul>
          <li><strong>Route filtering logic</strong> that prioritizes direct, efficient transit paths. </li>
          <li><strong>Practice mode</strong> with support for Weekday, Weekend, Late Night, and Accessible route options</li>
          <li><strong>Performance improvements</strong> with lazy loading of game data, making page load faster</li>
        </ul>
        <p>See the <a href="https://github.com/mapuya19/subwaydle" target="_blank" rel="noreferrer">source code</a> for more details.</p>

        <Header as='h4'>How to Play</Header>
        <p>Guess the <strong>SUBWAYDLE</strong> in 6 tries.</p>
        <p>Each guess must a be a <strong>valid subway trip involving 3 trains</strong> using available transfers between them.</p>
        <p>You need to guess a specific set of three trains that can make the trip.</p>

        <Header as='h4'>Examples</Header>
        <Segment basic>
          <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
            <Grid.Row>
              <Grid.Column>
                <Segment placeholder className='correct'>
                  {settings.display.showAnswerStatusBadges &&
                    <Label as='a' floating circular size='tiny'>
                      <Icon name="check" fitted />
                    </Label>
                  }
                  <TrainBullet id='A' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='N' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='7' size='medium' />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <div style={{ margin: '1em 0' }}>The <TrainBullet id='A' size='small' /> train is in the correct spot of the trip.</div>

        <Segment basic>
          <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
            <Grid.Row>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='GS' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder className='similar'>
                  {settings.display.showAnswerStatusBadges &&
                    <Label as='a' floating circular size='tiny'>
                      <Icon name="sync alternate" fitted />
                    </Label>
                  }
                  <TrainBullet id='1' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='L' size='medium' />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <div style={{ margin: '1em 0' }}>Another train that shares the same routing as the <TrainBullet id='1' size='small' /> train is in that spot of the trip.</div>

        <Segment basic>
          <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
            <Grid.Row>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='J' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder className='present'>
                  {settings.display.showAnswerStatusBadges &&
                    <Label as='a' floating circular size='tiny'>
                      <Icon name="arrows alternate horizontal" fitted />
                    </Label>
                  }
                  <TrainBullet id='5' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='2' size='medium' />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <div style={{ margin: '1em 0' }}>The <TrainBullet id='5' size='small' /> train is part of the trip, but in the wrong spot.</div>

        <Segment basic>
          <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
            <Grid.Row>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='2' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder className='sameColor'>
                  {settings.display.showAnswerStatusBadges &&
                    <Label as='a' floating circular size='tiny'>
                      <Icon name="sitemap" fitted />
                    </Label>
                  }
                  <TrainBullet id='C' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='L' size='medium' />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <div style={{ margin: '1em 0' }}>The <TrainBullet id='C' size='small' /> train is part of the same transit line as the answer train for that spot (e.g., A, C, E are all Eighth Avenue Line), but is not the correct route.</div>

        <Segment basic>
          <Grid centered columns={4} className={isDarkMode ? 'game-grid dark' : 'game-grid'}>
            <Grid.Row>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='F' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder>
                  <TrainBullet id='3' size='medium' />
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment placeholder className='absent'>
                  {settings.display.showAnswerStatusBadges &&
                    <Label as='a' floating circular size='tiny'>
                      <Icon name="x" fitted />
                    </Label>
                  }
                  <TrainBullet id='4' size='medium' />
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        <div style={{ margin: '1em 0' }}>The <TrainBullet id='4' size='small' /> train is not part of the trip in any spot.</div>

        <p><strong>Multiple routings may be possible</strong> to make the trip, but your goal is to
        find <strong>the one routing</strong> that matches the puzzle of the day. The solution <strong>may or may not</strong> be the fastest or efficient routing. It should also be noted that in the New York City Subway system, there are <strong>multiple stations with the same name</strong>.</p>
        <p><strong>No back tracking:</strong> No stations can be traveled through more than once.</p>
        <p><strong>Transfers are only allowed if and when lines diverge</strong> (i.e. if two lines are making the same stops, you can't switch back and forth between them,
          You can switch from a local line to an express line then back to the same local line, but you can't switch from an express line to a local line back to the same express line).</p>
        <p><strong>Transfers are allowed to/from St George station</strong> via <strong>South Ferry</strong>, <strong>Whitehall St–South Ferry</strong> or <strong>Bowling Green stations</strong> (using the Staten Island Ferry). Transfers are also allowed between stations with <strong>free out-of-system transfers</strong>.
          It is assumed that all stations allow transfer in all directions, even when they're not physically possible in real life (limitation due to this data is not being publicly available).</p>
        <p>Routing for each train line is based on <strong>midday schedule</strong> (i.e. no peak-direction express, no peak-only branches, no 
          Z, B goes to Bedford Park Blvd). <strong>Weekend puzzles are based on regularly-scheduled weekend routings.</strong></p>

        <Header as='h4'>Tips</Header>
        <p>Input using keyboard is supported.</p>
        <div style={{ margin: '1em 0' }}>Use <strong>I</strong> for <TrainBullet id='SI' size='small' />.</div>
        <div style={{ margin: '1em 0' }}>Use <strong>S</strong> for <TrainBullet id='GS' size='small' />.</div>
        <div style={{ margin: '1em 0' }}>Use <strong>K</strong> for <TrainBullet id='FS' size='small' />.</div>
        <div style={{ margin: '1em 0' }}>Use <strong>H</strong> for <TrainBullet id='H' size='small' />.</div>

        <Header as='h4'>About</Header>

        <p>Inspired by <a href="https://www.powerlanguage.co.uk/wordle/" target="_blank" rel="noreferrer">Wordle</a>,
          its <a href="https://github.com/hannahcode/wordle" target="_blank" rel="noreferrer">open-source clone</a>, <a href="https://nerdlegame.com/" target="_blank" rel="noreferrer">Nerdle</a>,
          and <a href="https://www.nytransitmuseum.org/">New York Transit Museum</a> Trivia Nights.</p>

        <p><a href="https://github.com/mapuya19/subwaydle" target="_blank" rel="noreferrer">Source code</a>.</p>

        <Header as='h4'>License</Header>
        <p>Copyright (c) 2022 Sunny Ng</p>
        <p>This software is licensed under the MIT License. See the <a href="https://github.com/mapuya19/subwaydle/blob/main/LICENSE" target="_blank" rel="noreferrer">LICENSE</a> file for details.</p>
      </Modal.Content>
    </Modal>
  );
}

AboutModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default AboutModal;
