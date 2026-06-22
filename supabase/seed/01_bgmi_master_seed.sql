-- =========================================================
-- PlayRank BGMI Master Seed - Batch 01
-- Teams, Players, Tournaments
-- =========================================================

-- =========================
-- TEAMS
-- =========================

INSERT INTO teams (
  name,
  short_name,
  slug,
  country,
  logo_url,
  points,
  kills,
  wins,
  matches_played,
  global_rank
)
VALUES
  ('Team Soul', 'SOUL', 'team-soul', 'India', NULL, 840, 410, 24, 78, 1),
  ('GodLike Esports', 'GL', 'godlike-esports', 'India', NULL, 810, 390, 21, 75, 2),
  ('Team XSpark', 'XSPARK', 'team-xspark', 'India', NULL, 755, 365, 18, 72, 3),
  ('Orangutan', 'OG', 'orangutan', 'India', NULL, 690, 330, 15, 68, 4),
  ('Revenant Esports', 'RNT', 'revenant-esports', 'India', NULL, 640, 310, 13, 64, 5),
  ('Entity Gaming', 'Entity', 'entity-gaming', 'India', NULL, 625, 300, 12, 62, 6),
  ('Team Tamilas', 'TT', 'team-tamilas', 'India', NULL, 600, 285, 11, 61, 7),
  ('Global Esports', 'GE', 'global-esports', 'India', NULL, 580, 270, 10, 60, 8),
  ('Gods Reign', 'GR', 'gods-reign', 'India', NULL, 560, 260, 9, 58, 9),
  ('Team 8Bit', '8BIT', 'team-8bit', 'India', NULL, 540, 250, 8, 56, 10),
  ('Team Forever', 'TF', 'team-forever', 'India', NULL, 525, 240, 8, 55, 11),
  ('Blind Esports', 'BLIND', 'blind-esports', 'India', NULL, 510, 235, 7, 54, 12),
  ('Hydra Esports', 'HYDRA', 'hydra-esports', 'India', NULL, 495, 225, 7, 52, 13),
  ('Carnival Gaming', 'CG', 'carnival-gaming', 'India', NULL, 480, 218, 6, 51, 14),
  ('Gladiators Esports', 'GDR', 'gladiators-esports', 'India', NULL, 465, 210, 6, 50, 15),
  ('Medal Esports', 'MEDAL', 'medal-esports', 'India', NULL, 450, 205, 5, 49, 16)
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  country = EXCLUDED.country,
  points = EXCLUDED.points,
  kills = EXCLUDED.kills,
  wins = EXCLUDED.wins,
  matches_played = EXCLUDED.matches_played,
  global_rank = EXCLUDED.global_rank;


-- =========================
-- PLAYERS
-- =========================
-- Team IDs are resolved by slug so this works even if UUIDs differ.

INSERT INTO players (
  ign,
  slug,
  team_id,
  role,
  country,
  kd_ratio,
  avg_damage,
  win_rate,
  matches_played,
  total_kills,
  mvp_count,
  recent_form
)
VALUES
  ('Goblin', 'goblin', (SELECT id FROM teams WHERE slug = 'team-soul'), 'Assaulter', 'India', 4.8, 610, 31, 72, 345, 12, 'WWLWW'),
  ('Omega', 'omega', (SELECT id FROM teams WHERE slug = 'team-soul'), 'IGL', 'India', 3.1, 420, 29, 70, 220, 7, 'WLWWW'),
  ('Neyo', 'neyo', (SELECT id FROM teams WHERE slug = 'team-soul'), 'Support', 'India', 2.7, 390, 27, 68, 185, 4, 'LWWLW'),
  ('Naksh', 'naksh', (SELECT id FROM teams WHERE slug = 'team-soul'), 'Entry', 'India', 3.5, 460, 26, 65, 230, 5, 'WWLLW'),

  ('Jonathan', 'jonathan', (SELECT id FROM teams WHERE slug = 'godlike-esports'), 'Assaulter', 'India', 5.4, 690, 28, 76, 410, 16, 'WWWWW'),
  ('ClutchGod', 'clutchgod', (SELECT id FROM teams WHERE slug = 'godlike-esports'), 'IGL', 'India', 3.4, 455, 25, 74, 250, 8, 'WLWLW'),
  ('Zgod', 'zgod', (SELECT id FROM teams WHERE slug = 'godlike-esports'), 'Support', 'India', 2.9, 405, 24, 72, 205, 5, 'LWWWW'),
  ('Admino', 'admino', (SELECT id FROM teams WHERE slug = 'godlike-esports'), 'Entry', 'India', 3.6, 480, 23, 70, 240, 6, 'WWLWL'),

  ('Scout', 'scout', (SELECT id FROM teams WHERE slug = 'team-xspark'), 'Assaulter', 'India', 4.6, 590, 26, 70, 330, 11, 'WWWLW'),
  ('Sarang', 'sarang', (SELECT id FROM teams WHERE slug = 'team-xspark'), 'Entry', 'India', 4.1, 550, 24, 68, 300, 9, 'WLWWW'),
  ('Shadow', 'shadow', (SELECT id FROM teams WHERE slug = 'team-xspark'), 'IGL', 'India', 3.2, 430, 23, 66, 220, 6, 'WWLLW'),
  ('Aditya', 'aditya', (SELECT id FROM teams WHERE slug = 'team-xspark'), 'Support', 'India', 2.8, 395, 22, 64, 180, 4, 'LWLWW'),

  ('Akshat', 'akshat', (SELECT id FROM teams WHERE slug = 'orangutan'), 'Assaulter', 'India', 4.2, 565, 24, 67, 310, 9, 'WWLWW'),
  ('Attanki', 'attanki', (SELECT id FROM teams WHERE slug = 'orangutan'), 'Support', 'India', 3.0, 410, 22, 66, 205, 5, 'WLWLW'),
  ('Aaru', 'aaru', (SELECT id FROM teams WHERE slug = 'orangutan'), 'Entry', 'India', 3.5, 470, 21, 64, 225, 4, 'LLWWW'),
  ('Driger', 'driger', (SELECT id FROM teams WHERE slug = 'orangutan'), 'IGL', 'India', 3.1, 425, 22, 65, 210, 5, 'WWLLW'),

  ('Sensei', 'sensei', (SELECT id FROM teams WHERE slug = 'revenant-esports'), 'IGL', 'India', 3.4, 455, 21, 63, 215, 5, 'WLWWL'),
  ('Apollo', 'apollo', (SELECT id FROM teams WHERE slug = 'revenant-esports'), 'Assaulter', 'India', 3.9, 520, 22, 64, 260, 7, 'WWLWL'),
  ('MJ', 'mj', (SELECT id FROM teams WHERE slug = 'revenant-esports'), 'Support', 'India', 2.6, 370, 19, 60, 160, 3, 'LWLWW'),
  ('Fierce', 'fierce', (SELECT id FROM teams WHERE slug = 'revenant-esports'), 'Entry', 'India', 3.3, 450, 20, 61, 210, 4, 'WWLLW'),

  ('Viper', 'viper', (SELECT id FROM teams WHERE slug = 'team-8bit'), 'Support', 'India', 2.7, 380, 18, 58, 165, 3, 'WLWLW'),
  ('Manya', 'manya', (SELECT id FROM teams WHERE slug = 'team-soul'), 'Flex', 'India', 3.7, 500, 24, 66, 245, 6, 'WWWLL'),
  ('Rony', 'rony', (SELECT id FROM teams WHERE slug = 'team-xspark'), 'Flex', 'India', 3.6, 490, 23, 64, 235, 5, 'WLWWW'),
  ('Nakul', 'nakul', (SELECT id FROM teams WHERE slug = 'team-soul'), 'Support', 'India', 2.8, 390, 20, 60, 175, 3, 'LWWLW')
ON CONFLICT (slug)
DO UPDATE SET
  ign = EXCLUDED.ign,
  team_id = EXCLUDED.team_id,
  role = EXCLUDED.role,
  country = EXCLUDED.country,
  kd_ratio = EXCLUDED.kd_ratio,
  avg_damage = EXCLUDED.avg_damage,
  win_rate = EXCLUDED.win_rate,
  matches_played = EXCLUDED.matches_played,
  total_kills = EXCLUDED.total_kills,
  mvp_count = EXCLUDED.mvp_count,
  recent_form = EXCLUDED.recent_form;


-- =========================
-- TOURNAMENTS
-- =========================
-- BGIS and BMPS are the two main Krafton BGMI tournament properties.
-- BMIC 2025 is included as an international cup-style event.

INSERT INTO tournaments (
  name,
  slug,
  organizer,
  prize_pool,
  participating_teams,
  location,
  start_date,
  end_date,
  status,
  mvp_player_id
)
VALUES
  (
    'BGIS 2026',
    'bgis-2026',
    'Krafton India Esports',
    20000000,
    16,
    'Chennai, India',
    '2026-01-01',
    '2026-03-29',
    'Live',
    (SELECT id FROM players WHERE slug = 'jonathan')
  ),
  (
    'BMPS 2026',
    'bmps-2026',
    'Krafton India Esports',
    20000000,
    16,
    'India',
    '2026-05-01',
    '2026-07-30',
    'Upcoming',
    NULL
  ),
  (
    'BMIC 2025',
    'bmic-2025',
    'Krafton India Esports',
    10000000,
    16,
    'New Delhi, India',
    '2025-10-31',
    '2025-11-03',
    'Completed',
    (SELECT id FROM players WHERE slug = 'goblin')
  ),
  (
    'BGIS 2025',
    'bgis-2025',
    'Krafton India Esports',
    20000000,
    16,
    'India',
    '2025-01-01',
    '2025-04-01',
    'Completed',
    (SELECT id FROM players WHERE slug = 'scout')
  ),
  (
    'BMPS 2025',
    'bmps-2025',
    'Krafton India Esports',
    20000000,
    16,
    'India',
    '2025-06-01',
    '2025-08-31',
    'Completed',
    (SELECT id FROM players WHERE slug = 'jonathan')
  )
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  organizer = EXCLUDED.organizer,
  prize_pool = EXCLUDED.prize_pool,
  participating_teams = EXCLUDED.participating_teams,
  location = EXCLUDED.location,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  status = EXCLUDED.status,
  mvp_player_id = EXCLUDED.mvp_player_id;