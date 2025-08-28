import React from 'react';
import renderer, { act } from 'react-test-renderer';
import PlayerPerformanceChart, { PerformancePoint } from '../PlayerPerformanceChart';

describe('PlayerPerformanceChart (renderer)', () => {
  test('renders a canvas inside a div', () => {
    const data: PerformancePoint[] = [
      { date: '2025-08-20T00:00:00.000Z', actual: 20, line: 18 },
      { date: '2025-08-21T00:00:00.000Z', actual: 22, line: 19 },
    ];

    let tree: any;
    act(() => {
      tree = renderer.create(<PlayerPerformanceChart data={data} />);
    });

    const root = tree.root;
    const canvas = root.findAllByType('canvas');
    expect(canvas.length).toBeGreaterThanOrEqual(1);
  });
});
