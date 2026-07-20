import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib

BASE = Path(__file__).resolve().parent.parent

df = pd.read_csv(BASE / 'data' / 'clean_real_nba_games.csv')

# רשימת הפיצ'רים החדשה מבוססת ההפרשים
features = [
    'REST_DIFF', 'CUM_WIN_PCT_DIFF',
    'MIN_DIFF', 'FGM_DIFF', 'FGA_DIFF', 'FG_PCT_DIFF',
    'FG3M_DIFF', 'FG3A_DIFF', 'FG3_PCT_DIFF',
    'FTM_DIFF', 'FTA_DIFF', 'FT_PCT_DIFF',
    'OREB_DIFF', 'DREB_DIFF', 'REB_DIFF',
    'AST_DIFF', 'STL_DIFF', 'BLK_DIFF',
    'TOV_DIFF', 'PF_DIFF', 'PTS_DIFF',
    'PLUS_MINUS_DIFF', 'OFF_RATING_DIFF'
]

X = df[features]
y = df['WIN']

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

preds = model.predict(X_test)
accuracy = accuracy_score(y_test, preds)

print(f"Model Accuracy: {accuracy:.3f}")

joblib.dump(model, BASE / 'models' / 'nba_prediction_model.pkl')
print("Model saved successfully with advanced features.")