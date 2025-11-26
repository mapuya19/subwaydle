import { removeDisconnectedRouteCombos } from './gameDataLoader';

describe('removeDisconnectedRouteCombos', () => {
  it('removes SI combos that do not transfer via the ferry terminals', () => {
    const answers = [
      ['A', 'B', 'C'],
      ['SI', 'C', 'R'],
      ['1', '4', 'SI'],
    ];

    const solutions = {
      'A-B-C': { origin: 'R01' },
      'SI-C-R': {
        first_transfer_arrival: 'S31',
        first_transfer_departure: 'A45',
        second_transfer_arrival: 'A27',
        second_transfer_departure: 'R16',
      },
      '1-4-SI': {
        first_transfer_arrival: '110',
        first_transfer_departure: '410',
        second_transfer_arrival: '420',
        second_transfer_departure: 'S31',
      },
    };

    const { answers: filteredAnswers, solutions: filteredSolutions } = removeDisconnectedRouteCombos(answers, solutions);

    expect(filteredAnswers).toEqual([
      ['A', 'B', 'C'],
      ['1', '4', 'SI'],
    ]);
    expect(filteredSolutions).toEqual({
      'A-B-C': { origin: 'R01' },
      '1-4-SI': {
        first_transfer_arrival: '110',
        first_transfer_departure: '410',
        second_transfer_arrival: '420',
        second_transfer_departure: 'S31',
      },
    });
  });

  it('removes SI combos when the solution lacks valid ferry transfer data', () => {
    const answers = [
      ['SI', '1', 'R'],
    ];

    const solutions = {
      'SI-1-R': {
        first_transfer_arrival: 'S14',
        first_transfer_departure: '142',
        second_transfer_arrival: 'R23',
        second_transfer_departure: 'R23',
      },
    };

    const { answers: filteredAnswers, solutions: filteredSolutions } = removeDisconnectedRouteCombos(answers, solutions);
    expect(filteredAnswers).toEqual([]);
    expect(filteredSolutions).toEqual({});
  });

  it('returns empty collections when data is missing', () => {
    const { answers, solutions } = removeDisconnectedRouteCombos();
    expect(answers).toEqual([]);
    expect(solutions).toEqual({});
  });
});

