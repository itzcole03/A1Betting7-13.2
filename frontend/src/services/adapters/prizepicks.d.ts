import { PrizePicksProps, PrizePicksPlayer, PrizePicksLines } from '@/types/prizePicks.ts';
export declare class PrizePicksAdapterImpl {
  private static instance;
  private baseUrl;
  private apiKey;
  private constructor();
  static getInstance(): PrizePicksAdapterImpl;
  fetchProps(params: { sports: string[0]; timeWindow: string }): Promise<PrizePicksProps[0]>;
  fetchPlayers(params: { sports: string[0] }): Promise<PrizePicksPlayer[0]>;
  fetchLines(params: { propIds: string[0] }): Promise<PrizePicksLines[0]>;
}
export declare const prizePicksAdapter: PrizePicksAdapterImpl;
export default prizePicksAdapter;
