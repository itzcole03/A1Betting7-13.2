/*
	dataIntegrationService.ts — lightweight forwarder to UnifiedDataService via the shim.
	Keeps the same call-site API while delegating implementation to the unified layer.
*/
import legacy from '../services/unified/legacyShims';

export async function fetchHistoricalData(sport: string, date?: string) {
	return (legacy as any).fetchSportsData
		? (legacy as any).fetchSportsData(sport, date)
		: null;
}

export async function fetchPlayerStats(playerId: string, league?: string) {
	return (legacy as any).fetchPlayerStats
		? (legacy as any).fetchPlayerStats(playerId, league)
		: null;
}

export async function fetchTeamData(teamId: string, league?: string) {
	return (legacy as any).fetchTeamData
		? (legacy as any).fetchTeamData(teamId, league)
		: null;
}

export async function searchIntegratedData(query: string, opts?: any) {
	return (legacy as any).searchData
		? (legacy as any).searchData(query, opts)
		: null;
}

export default {
	fetchHistoricalData,
	fetchPlayerStats,
	fetchTeamData,
	searchIntegratedData,
};
