import { describe, expect, it } from '@jest/globals';

import {
  computeTopConfidence,
  mergeAlternativeProps,
  type AlternativePropInput,
  type FeatureLike,
} from '../FeatureComposition';

describe('FeatureComposition', () => {
  const baseFeature: FeatureLike = {
    id: 'player-1',
    stat: 'Points',
    line: 24.5,
    confidence: 0.62,
    alternativeProps: [
      {
        id: 'player-1:Assists',
        stat: 'Assists',
        line: '5.5',
        confidence: '0.58',
        overOdds: '+110',
      },
    ],
  };

  it('merges alternative props and computes top confidence', () => {
    const incoming: AlternativePropInput[] = [
      {
        id: 'custom-alt',
        stat: 'Rebounds',
        line: '11',
        confidence: 0.74,
        overOdds: '-105',
        underOdds: '+115',
      },
      {
        stat: 'Steals',
        confidence: 88,
      },
    ];

    const result = mergeAlternativeProps(baseFeature, incoming);

    // Original feature should remain untouched
    expect(baseFeature.alternativeProps?.length).toBe(1);

    expect(result.alternativeProps).toHaveLength(3);
    const altMap = new Map(result.alternativeProps.map(entry => [entry.id, entry]));
    expect(altMap.get('custom-alt')).toEqual(
      expect.objectContaining({ stat: 'Rebounds', confidence: 74 })
    );
    expect(altMap.get('player-1:Steals')).toEqual(
      expect.objectContaining({ stat: 'Steals', confidence: 88, line: 24.5 })
    );
    expect(altMap.get('player-1:Assists')).toEqual(
      expect.objectContaining({ stat: 'Assists', confidence: 58, overOdds: 110 })
    );

    expect(result.topConfidence).toBe(88);
    expect(altMap.get('custom-alt')?.overOdds).toBe(-105);
    expect(altMap.get('custom-alt')?.underOdds).toBe(115);
  });

  it('respects preferIncoming flag when disabled', () => {
    const base: FeatureLike = {
      id: 'player-2',
      stat: 'Points',
      confidence: 0.6,
      alternativeProps: [
        {
          id: 'alt-shared',
          stat: 'Points',
          confidence: 0.7,
        },
      ],
    };

    const incoming: AlternativePropInput[] = [
      {
        id: 'alt-shared',
        stat: 'Points',
        confidence: 0.9,
      },
    ];

    const merged = mergeAlternativeProps(base, incoming, { preferIncoming: false });
    expect(merged.alternativeProps).toHaveLength(1);
    expect(merged.alternativeProps[0]?.confidence).toBe(70);
  });

  it('computes top confidence from mixed inputs', () => {
    const top = computeTopConfidence([
      { confidence: '48' },
      { confidence: 0.63 },
      72,
      undefined as unknown as number,
    ]);

    expect(top).toBe(72);

    const fallback = computeTopConfidence(undefined, 0.56);
    expect(fallback).toBe(56);
  });
});
