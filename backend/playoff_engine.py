import pandas as pd
import random
from pathlib import Path
import os


class PlayoffEngine:
    def __init__(self, data_path=None):
        self.base_dir = Path(__file__).resolve().parent.parent

        if data_path:
            self.data_path = os.path.join(data_path, 'team_stats.csv')
        else:
            self.data_path = os.path.join(self.base_dir, 'data', 'team_stats.csv')

        if not os.path.exists(self.data_path):
            alt_path = os.path.join(self.base_dir, 'data', 'clean_real_nba_games.csv')
            if os.path.exists(alt_path):
                self.data_path = alt_path

        self.team_db = {}
        self.west_teams = {}
        self.east_teams = {}
        self.load_and_clean_data()

    def load_and_clean_data(self):
        try:
            df = pd.read_csv(self.data_path)
            team_col = next((col for col in ['TEAM_NAME', 'TEAM', 'Team', 'team', 'Name', 'name'] if col in df.columns),
                            None)

            if not team_col:
                raise ValueError("No team column found in CSV")

            # דירוג פלייאוף 2026 הרשמי (מקומות 1 עד 8)
            WEST_SEEDING = [
                "Oklahoma City Thunder",  # 1
                "San Antonio Spurs",  # 2
                "Denver Nuggets",  # 3
                "Los Angeles Lakers",  # 4
                "Houston Rockets",  # 5
                "Minnesota Timberwolves",  # 6
                "Portland Trail Blazers",  # 7
                "Phoenix Suns"  # 8
            ]
            EAST_SEEDING = [
                "Detroit Pistons",  # 1
                "Boston Celtics",  # 2
                "Cleveland Cavaliers",  # 3
                "New York Knicks",  # 4
                "Atlanta Hawks",  # 5
                "Toronto Raptors",  # 6
                "Philadelphia 76ers",  # 7
                "Orlando Magic"  # 8
            ]

            win_col = 'CUM_WIN_PCT' if 'CUM_WIN_PCT' in df.columns else 'W_PCT'

            # טעינת הסטטיסטיקות מה-CSV אל תוך מאגר המנוע
            for index, row in df.iterrows():
                team_name = str(row[team_col])
                self.team_db[team_name] = {
                    'CUM_WIN_PCT': row.get(win_col, 0.5),
                    'OFF_RATING': row.get('ROLL_OFF_RATING', 110),
                    'DEF_RATING': row.get('ROLL_DEF_RATING', 110),
                    'REB_PER_GAME': row.get('ROLL_REB', 42.5)
                }

            # שיבוץ הקבוצות בעץ הטורניר כדי שהמנוע יצוות אותם נכון למצ'אפים שהגדרת
            for i in range(8):
                self.west_teams[i + 1] = WEST_SEEDING[i]
                self.east_teams[i + 1] = EAST_SEEDING[i]

            print("✅ NBA 2026 Custom East/West Brackets Loaded Successfully!")

        except Exception as e:
            print(f"⚠️ שגיאה בטעינת נתונים: {e}")
            self._load_fallback_teams()



    def _load_fallback_teams(self):
        # מנגנון גיבוי שמבטיח שהאפליקציה תמיד תרוץ, גם אם ה-CSV ריק/פגום
        west_dummy = ["Nuggets", "Thunder", "Timberwolves", "Clippers", "Mavericks", "Suns", "Lakers", "Pelicans"]
        east_dummy = ["Celtics", "Knicks", "Bucks", "Cavaliers", "Magic", "Pacers", "76ers", "Heat"]

        for i in range(8):
            self.west_teams[i + 1] = west_dummy[i]
            self.east_teams[i + 1] = east_dummy[i]

            # נתונים פיקטיביים שיאפשרו חישובי יחסים (Odds) תקינים
            self.team_db[west_dummy[i]] = {'CUM_WIN_PCT': 0.60 - (i * 0.02), 'OFF_RATING': 115 - i, 'DEF_RATING': 110,
                                           'REB_PER_GAME': 42}
            self.team_db[east_dummy[i]] = {'CUM_WIN_PCT': 0.60 - (i * 0.02), 'OFF_RATING': 115 - i, 'DEF_RATING': 110,
                                           'REB_PER_GAME': 42}

    def generate_game_stats(self, t1, t2, series_history=None):
        t1_stats = self.team_db.get(t1, {'OFF_RATING': 110, 'DEF_RATING': 110, 'REB_PER_GAME': 42})
        t2_stats = self.team_db.get(t2, {'OFF_RATING': 110, 'DEF_RATING': 110, 'REB_PER_GAME': 42})

        t1_off = t1_stats['OFF_RATING']
        t2_off = t2_stats['OFF_RATING']

        if series_history:
            last_game = series_history[-1]
            if last_game.winner == t1:
                t1_off += 3.0
            elif last_game.winner == t2:
                t2_off += 3.0

        base_t1_pts = (t1_off + t2_stats['DEF_RATING']) / 2
        base_t2_pts = (t2_off + t1_stats['DEF_RATING']) / 2

        t1_pts = int(random.gauss(base_t1_pts - 5, 8))
        t2_pts = int(random.gauss(base_t2_pts - 5, 8))

        while t1_pts == t2_pts:
            t1_pts += random.choice([1, 2, 3])
            t2_pts += random.choice([1, 2, 3])

        t1_reb = int(random.gauss(t1_stats['REB_PER_GAME'], 4))
        t2_reb = int(random.gauss(t2_stats['REB_PER_GAME'], 4))

        return {
            "winner": t1 if t1_pts > t2_pts else t2,
            "t1_pts": t1_pts,
            "t2_pts": t2_pts,
            "t1_rebounds": t1_reb,
            "t2_rebounds": t2_reb,
            "total_points": t1_pts + t2_pts
        }

    def calculate_advanced_odds(self, t1, t2, series_history=None):
        t1_stats = self.team_db.get(t1, {'CUM_WIN_PCT': 0.5, 'OFF_RATING': 110, 'DEF_RATING': 110})
        t2_stats = self.team_db.get(t2, {'CUM_WIN_PCT': 0.5, 'OFF_RATING': 110, 'DEF_RATING': 110})

        win_pct_t1 = t1_stats['CUM_WIN_PCT']
        t1_off = t1_stats['OFF_RATING']
        t2_off = t2_stats['OFF_RATING']

        if series_history:
            last_game = series_history[-1]
            if last_game.winner == t1:
                win_pct_t1 += 0.05
                t1_off += 2.5
            elif last_game.winner == t2:
                win_pct_t1 -= 0.05
                t2_off += 2.5

        win_prob_t1 = win_pct_t1 / (win_pct_t1 + t2_stats['CUM_WIN_PCT'])
        win_prob_t1 = max(0.15, min(0.85, win_prob_t1))

        ml_t1 = round((1 / win_prob_t1) * 0.95, 2)
        ml_t2 = round((1 / (1 - win_prob_t1)) * 0.95, 2)

        # התוספת החדשה: חישוב יחס למנצחת הסדרה כולה!
        series_prob_t1 = min(0.95, max(0.05, win_prob_t1 + (win_prob_t1 - 0.5) * 0.4))
        series_ml_t1 = round((1 / series_prob_t1) * 0.85, 2)
        series_ml_t2 = round((1 / (1 - series_prob_t1)) * 0.85, 2)

        spread_diff = (t1_off - t2_off) / 2
        t1_spread = round(spread_diff * 2) / 2

        projected_total = ((t1_off + t2_off) / 2) * 2 - 10
        over_under = round(projected_total * 2) / 2

        return {
            "moneyline": {t1: ml_t1, t2: ml_t2},
            "series_winner": {t1: series_ml_t1, t2: series_ml_t2}, # << כאן זה נכנס
            "spread": {"team1_spread": -t1_spread, "team2_spread": t1_spread, "odds": 1.90},
            "over_under_points": {"line": over_under, "over_odds": 1.90, "under_odds": 1.90}
        }