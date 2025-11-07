import { z } from 'zod';

export const PlayerProjectionSchema = z.object({
  playerId: z.string(),
  baseline: z.number(),
  ceiling: z.number(),
  floor: z.number(),
  median: z.number(),
  consistency: z.number(),
  volatility: z.number(),
  confidence: z.number(),
  factors: z.object({
    matchup: z.number(),
    recent_form: z.number(),
    venue: z.number(),
    weather: z.number(),
    pace: z.number(),
    usage: z.number(),
  }),
});

export const PlayerProjectionsResponseSchema = z.array(PlayerProjectionSchema);
export type PlayerProjection = z.infer<typeof PlayerProjectionSchema>;
