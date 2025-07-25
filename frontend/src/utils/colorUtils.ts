export function getStatusColor(status: string): string {
  switch (status) {
    case 'live':
      return 'text-red-400 bg-red-500/20';
    case 'upcoming':
      return 'text-green-400 bg-green-500/20';
    case 'completed':
      return 'text-gray-400 bg-gray-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
}

export function getRecommendationColor(rec: string): string {
  switch (rec) {
    case 'home':
      return 'text-blue-400 bg-blue-500/20';
    case 'away':
      return 'text-purple-400 bg-purple-500/20';
    case 'over':
      return 'text-green-400 bg-green-500/20';
    case 'under':
      return 'text-red-400 bg-red-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-green-400 text-green-900';
  if (confidence >= 65) return 'bg-yellow-400 text-yellow-900';
  return 'bg-red-400 text-red-100';
}
