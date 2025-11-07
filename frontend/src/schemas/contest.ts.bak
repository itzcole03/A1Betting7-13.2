import { z } from 'zod';

export const ContestSchema = z.object({
  id: z.string(),
  name: z.string(),
  entryFee: z.number(),
  totalPrizes: z.number(),
  entries: z.number(),
  maxEntries: z.number(),
  payoutStructure: z.enum(['top_heavy', 'flat', 'winner_take_all']),
  sport: z.string(),
  slate: z.string(),
  startTime: z.union([z.string(), z.date()]),
  positions: z.record(z.string(), z.number()),
  salaryCap: z.number(),
  site: z.enum(['draftkings', 'fanduel', 'superdraft', 'yahoo']),
});

export const ContestsResponseSchema = z.array(ContestSchema);
export type Contest = z.infer<typeof ContestSchema>;
