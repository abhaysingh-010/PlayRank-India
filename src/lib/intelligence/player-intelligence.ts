type PlayerIntelligenceInput = {
  total_kills?: number | null;
  avg_damage?: number | null;
  mvp_count?: number | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function calculatePlayerIntelligence(player: PlayerIntelligenceInput) {
  return (
    n(player.total_kills) * 0.4 +
    n(player.avg_damage) * 0.3 +
    n(player.mvp_count) * 20
  );
}