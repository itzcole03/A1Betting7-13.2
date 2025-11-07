import { SocialSentimentData } from '../types/global';

export type { SocialSentimentData };

export class SocialSentimentAdapter {
  private cache: SocialSentimentData[] | null = null;

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async fetch(): Promise<SocialSentimentData[]> {
    const data: SocialSentimentData[] = [
      {
        player: 'Test Player',
        sentiment: {
          score: 0.5,
          volume: 100,
        },
        trending: false,
        keywords: ['basketball', 'performance'],
        timestamp: new Date().toISOString(),
      },
    ];
    this.cache = data;
    return data;
  }

  async getData(): Promise<SocialSentimentData[] | null> {
    return this.cache;
  }

  clearCache(): void {
    this.cache = null;
  }
}
