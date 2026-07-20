import pandas as pd
from pathlib import Path

# הגדרת נתיב בסיס לפרויקט
BASE = Path(__file__).resolve().parent.parent
raw_data_path = BASE / 'data' / 'nba_real_games.csv'

if not raw_data_path.exists():
    raise FileNotFoundError("קובץ הדאטה הגולמי לא נמצא! הרץ קודם את fetch_nba_data.py")

# טעינת הנתונים וסידור כרונולוגי
gamelog = pd.read_csv(raw_data_path)
gamelog['WIN'] = gamelog['WL'].map({'W': 1, 'L': 0})
gamelog['GAME_DATE'] = pd.to_datetime(gamelog['GAME_DATE'])
gamelog = gamelog.sort_values(by='GAME_DATE')

print("Calculating Advanced Stats (Offensive Rating)...")
# נוסחת פוזשנים מוערכת: FGA + 0.44 * FTA - OREB + TOV
possessions = gamelog['FGA'] + 0.44 * gamelog['FTA'] - gamelog['OREB'] + gamelog['TOV']
possessions = possessions.replace(0, 100) # מניעת חלוקה באפס במקרים קיצוניים
gamelog['OFF_RATING'] = (gamelog['PTS'] / possessions) * 100

# רשימת השדות הבסיסיים שנרצה לחשב להם ממוצע נע
features = [
    'MIN', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT',
    'FTM', 'FTA', 'FT_PCT', 'OREB', 'DREB', 'REB',
    'AST', 'STL', 'BLK', 'TOV', 'PF', 'PTS', 'PLUS_MINUS', 'OFF_RATING'
]

print("Calculating rolling stats, rest days, and cumulative win percentages...")
team_perf = pd.DataFrame()
team_perf['GAME_ID'] = gamelog['GAME_ID']
team_perf['TEAM_ID'] = gamelog['TEAM_ID']
team_perf['WIN'] = gamelog['WIN']
team_perf['IS_HOME'] = gamelog['MATCHUP'].str.contains('vs.').astype(int)

# א) חישוב ימי מנוחה (הפרש בימים מהמשחק הקודם פחות 1)
team_perf['REST_DAYS'] = gamelog.groupby('TEAM_ID')['GAME_DATE'].diff().dt.days - 1
team_perf['REST_DAYS'] = team_perf['REST_DAYS'].fillna(3) # ברירת מחדל לתחילת עונה

# ב) אחוז ניצחונות מצטבר של הקבוצה מתחילת העונה (לפני המשחק הנוכחי)
shifted_win = gamelog.groupby('TEAM_ID')['WIN'].shift(1)
cum_wins = shifted_win.groupby(gamelog['TEAM_ID']).cumsum()
cum_games = shifted_win.groupby(gamelog['TEAM_ID']).cumcount()
team_perf['CUM_WIN_PCT'] = cum_wins / cum_games
team_perf['CUM_WIN_PCT'] = team_perf['CUM_WIN_PCT'].fillna(0.5)

# ג) חישוב ממוצעים נעים (5 משחקים אחרונים שקדמו למשחק הנוכחי)
shifted_stats = gamelog.groupby('TEAM_ID')[features].shift(1)
rolling_stats = shifted_stats.groupby(gamelog['TEAM_ID']).rolling(window=5, min_periods=1).mean().reset_index(level=0, drop=True)

for col in features:
    team_perf[f'ROLL_{col}'] = rolling_stats[col]

print("Merging matchups to create Differential Features (Home - Away)...")
# פיצול המכונה לקבוצות הבית וקבוצות החוץ וחיבורן לפי מזהה משחק
home_df = team_perf[team_perf['IS_HOME'] == 1].copy()
away_df = team_perf[team_perf['IS_HOME'] == 0].copy()

matchups = pd.merge(home_df, away_df, on='GAME_ID', suffixes=('_HOME', '_AWAY'))

# יצירת דף הנתונים הסופי המבוסס על הפרשים בלבד
diff_df = pd.DataFrame()
diff_df['WIN'] = matchups['WIN_HOME'] # המטרה לניבוי: האם קבוצת הבית ניצחה?
diff_df['REST_DIFF'] = matchups['REST_DAYS_HOME'] - matchups['REST_DAYS_AWAY']
diff_df['CUM_WIN_PCT_DIFF'] = matchups['CUM_WIN_PCT_HOME'] - matchups['CUM_WIN_PCT_AWAY']

for col in features:
    diff_df[f'{col}_DIFF'] = matchups[f'ROLL_{col}_HOME'] - matchups[f'ROLL_{col}_AWAY']

# מחיקת שורות חסרות מתחילת העונה
diff_df = diff_df.dropna()

output_path = BASE / 'data' / 'clean_real_nba_games.csv'
diff_df.to_csv(output_path, index=False)

print(f"Success! Advanced differential data saved to: {output_path}")