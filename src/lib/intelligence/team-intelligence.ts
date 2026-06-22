export function calculateTeamIntelligence(team:any)
{
  return (
    team.total_kills * 0.4 +
    team.avg_points * 0.4 +
    team.wins * 10
  );
}