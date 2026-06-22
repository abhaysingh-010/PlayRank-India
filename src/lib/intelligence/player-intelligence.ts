export function calculatePlayerIntelligence(player:any)
{
  return (
    player.total_kills * 0.4 +
    player.avg_damage * 0.3 +
    player.mvp_count * 20
  );
}