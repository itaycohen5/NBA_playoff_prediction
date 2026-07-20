from nba_api.stats.endpoints import leaguedashteamstats

stats = leaguedashteamstats.LeagueDashTeamStats(
    season='2025-26'
)

df = stats.get_data_frames()[0]

df.to_csv('data/team_stats.csv', index=False)

print(df.head())