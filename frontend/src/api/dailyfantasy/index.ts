﻿import { getLogger } from '@/core/logging/logger';
import { getMetrics } from '@/core/metrics/metrics';
import { NextApiRequest, NextApiResponse } from 'next';

interface DailyFantasyRequest {
  site: 'draftkings' | 'fanduel';
  date: string;
  sport: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { site, date, sport } = req.body as DailyFantasyRequest;
  const logger = getLogger();
  const metrics = getMetrics();
  const apiKey = process.env.DAILYFANTASY_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const startTime = Date.now();
    const data = await fetchDailyFantasyData(site, date, sport, apiKey);
    const duration = Date.now() - startTime;

    metrics.timing('dailyfantasy_api_request_duration', duration, {
      site,
      sport,
    });

    logger.info('Successfully fetched DailyFantasy data', {
      site,
      sport,
      date,
      playerCount: data.length,
    });

    return res.status(200).json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Error fetching DailyFantasy data', {
      error: errorMessage,
      site,
      sport,
      date,
    });
    metrics.increment('dailyfantasy_api_error', {
      site,
      sport,
      error: errorMessage,
    });

    return res.status(500).json({ error: errorMessage });
  }
}

async function fetchDailyFantasyData(
  site: 'draftkings' | 'fanduel',
  date: string,
  sport: string,
  apiKey: string
) {
  const baseUrl =
    site === 'draftkings' ? 'https://api.draftkings.com/v1' : 'https://api.fanduel.com/v1';

  const response = await fetch(`${baseUrl}/contests/${sport}/${date}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  }).catch(error => {
    console.error('API Error:', error);
    throw error;
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return processFantasyData(data, site);
}

function processFantasyData(data: any, _site: 'draftkings' | 'fanduel') {
  // Process the raw API response into our standardized format
  const players = data.players || [];

  return players.map((player: any) => {
    const playerData = player;

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      team: playerData.team,
      position: playerData.position,
      salary: playerData.salary,
      projectedPoints: playerData.projectedPoints,
      actualPoints: playerData.actualPoints,
      ownershipPercentage: playerData.ownershipPercentage,
    };
  });
}
