from nba_api.stats.endpoints import leaguegamelog
from pathlib import Path

# הגדרת נתיב בסיס לפרויקט
BASE = Path(__file__).resolve().parent.parent

print("Fetching NBA game logs for the current 2025-26 season...")

# משיכת נתוני העונה הנוכחית מה-API
games = leaguegamelog.LeagueGameLog(
    season='2025-26',
    season_type_all_star='Regular Season'
)

# המרה ל-DataFrame של Pandas
df = games.get_data_frames()[0]

# ודאות שתיקיית data קיימת
data_dir = BASE / 'data'
data_dir.mkdir(exist_ok=True)

# שמירה לקובץ ה-CSV המרכזי של הפרויקט
output_path = data_dir / 'nba_real_games.csv'
df.to_csv(output_path, index=False)

print("\n--- Data Sample ---")
print(df[['GAME_DATE', 'TEAM_NAME', 'MATCHUP', 'WL']].head())
print(f"\n✅ NBA 2025-26 data saved successfully to: {output_path}")