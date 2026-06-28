type TeamIntelligenceInput = {
  total_kills?: number | null;
  kills?: number | null;
  avg_points?: number | null;
  points?: number | null;
  wins?: number | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function calculateTeamIntelligence(team: TeamIntelligenceInput) {
  const kills = team.total_kills ?? team.kills;
  const points = team.avg_points ?? team.points;

  return n(kills) * 0.4 + n(points) * 0.4 + n(team.wins) * 10;
}