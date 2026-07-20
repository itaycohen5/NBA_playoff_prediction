import joblib
import pandas as pd
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent

model = joblib.load(BASE / 'models' / 'nba_prediction_model.pkl')

# הגדרת משחק לדוגמה מבוסס הפרשים (Home MINUS Away)
sample_matchup = pd.DataFrame([{
    'REST_DIFF': 1,           # קבוצת הבית נחה יום אחד יותר מקבוצת החוץ
    'CUM_WIN_PCT_DIFF': 0.15, # לקבוצת הבית יש 15% ניצחונות יותר בעונה
    'MIN_DIFF': 0,
    'FGM_DIFF': 2.0,
    'FGA_DIFF': 1.0,
    'FG_PCT_DIFF': 0.02,
    'FG3M_DIFF': 1.5,
    'FG3A_DIFF': 2.0,
    'FG3_PCT_DIFF': 0.01,
    'FTM_DIFF': 0.5,
    'FTA_DIFF': 0.2,
    'FT_PCT_DIFF': 0.01,
    'OREB_DIFF': -1.0,
    'DREB_DIFF': 2.0,
    'REB_DIFF': 1.0,
    'AST_DIFF': 3.0,
    'STL_DIFF': 1.0,
    'BLK_DIFF': 0.5,
    'TOV_DIFF': -1.5,         # קבוצת הבית מאבדת פחות כדורים (מעולה)
    'PF_DIFF': -1.0,
    'PTS_DIFF': 4.5,          # קבוצת הבית קולעת 4.5 נקודות יותר בממוצע
    'PLUS_MINUS_DIFF': 3.0,
    'OFF_RATING_DIFF': 2.5    # קבוצת הבית מייצרת 2.5 נקודות יותר לכל 100 פוזשנים
}])

prediction = model.predict(sample_matchup)[0]
probability = model.predict_proba(sample_matchup)[0][1]

print(f"Prediction for HOME team: {'WIN' if prediction == 1 else 'LOSS'}")
print(f"Home Team Win Probability: {probability:.2f}")