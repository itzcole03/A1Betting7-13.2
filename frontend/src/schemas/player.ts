import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  position: z.string(),
  salary: z.number(),
  projectedPoints: z.number(),
  ownership: z.number(),
  value: z.number(),
  matchup: z.string(),
  gameTime: z.union([z.string(), z.date()]),
  isLocked: z.boolean(),
  recentForm: z.array(z.number()),
  ceiling: z.number(),
  floor: z.number(),
  consistency: z.number(),
  news: z.array(z.string()),
  stats: z.object({
    avgPoints: z.number(),
    gamesPlayed: z.number(),
    totalPoints: z.number(),
    bestGame: z.number(),
    worstGame: z.number(),
  }),
  tags: z.array(z.string()),
  tier: z.enum(['elite', 'solid', 'value', 'punt']),
  injuryStatus: z.string(),
  weatherImpact: z.number(),
  vegas: z.object({
    impliedTotal: z.number(),
    spread: z.number(),
    gameTotal: z.number(),
  }),
});

export const PlayerPoolResponseSchema = z.array(PlayerSchema);
export type Player = z.infer<typeof PlayerSchema>;
