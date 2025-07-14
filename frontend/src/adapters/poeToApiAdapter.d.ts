import { PoeDataBlock } from '@/types.ts';
import { PrizePicksProps } from '@/shared/prizePicks.ts';
/**
 * Adapts data from a "Poe-like" source (structured as PoeDataBlock)
 * into a more usable format, such as PrizePicksProps for prop card display.
 */
export declare class PoeToApiAdapter {
  constructor();
  /**
   * Transforms an array of PoeDataBlock objects into an array of PrizePicksProps.
   * Focuses on blocks of type 'prop_card'.
   *
   * @param poeDataBlocks - An array of PoeDataBlock objects.
   * @returns An array of PrizePicksProps.
   */
  transformPoeDataToPrizePicksProps(poeDataBlocks: PoeDataBlock[0]): PrizePicksProps[0];
  /**
   * Simulates fetching data from a Poe-like API and transforming it.
   * @returns A promise that resolves to an array of PrizePicksProps.
   */
  fetchAndTransformPoeData(): Promise<PrizePicksProps[0]>;
}
export declare const poeToApiAdapter: PoeToApiAdapter;
