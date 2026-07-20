import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent

# קריאת הדאטה המעודכן (המבוסס על הפרשים)
df = pd.read_csv(BASE / 'data' / 'clean_real_nba_games.csv')

# ודאות שתיקיית הויזואליזציות קיימת
visualizations_dir = BASE / 'visualizations'
visualizations_dir.mkdir(exist_ok=True)

# 1. התפלגות ניצחונות של קבוצת הבית
df['WIN'].value_counts().plot(kind='bar', color=['green', 'red'])
plt.title('Home Team: Win vs Loss Distribution')
plt.xlabel('Outcome (0=Home Loss, 1=Home Win)')
plt.ylabel('Count')

plt.tight_layout()
plt.savefig(visualizations_dir / 'win_distribution.png')
plt.clf()

# 2. הפרש נקודות ממוצע ב-5 המשחקים האחרונים (מנצחים מול מפסידים)
df.groupby('WIN')['PTS_DIFF'].mean().plot(kind='bar', color=['orange', 'blue'])
plt.title('Average Rolling Points Difference: Win vs Loss')
plt.xlabel('Home Team Outcome (0=Loss, 1=Win)')
plt.ylabel('Avg PTS Difference (Home - Away)')

plt.tight_layout()
plt.savefig(visualizations_dir / 'avg_points.png')
plt.clf()

# 3. הפרש מדד הפלוס-מינוס הממוצע
df.groupby('WIN')['PLUS_MINUS_DIFF'].mean().plot(kind='bar', color=['purple', 'teal'])
plt.title('Average Rolling Plus-Minus Difference: Win vs Loss')
plt.xlabel('Home Team Outcome (0=Loss, 1=Win)')
plt.ylabel('Avg Plus-Minus Difference (Home - Away)')

plt.tight_layout()
plt.savefig(visualizations_dir / 'avg_plus_minus.png')

print("Visualizations saved successfully in the 'visualizations' folder.")