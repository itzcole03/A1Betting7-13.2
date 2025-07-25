export class SocialSentimentAdapter {
  private cache: unknown = null;

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  fetch(): Promise<unknown[]> {
    const data = [{ player: 'Test', sentiment: 'positive' }];
    this.cache = data;
    return Promise.resolve(data);
  }

  getData(): Promise<unknown[] | null> {
    return Promise.resolve(this.cache as unknown[] | null);
  }

  clearCache(): void {
    this.cache = null;
  }
}
