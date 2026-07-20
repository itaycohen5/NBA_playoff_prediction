import subprocess
import sys
from pathlib import Path

# הגדרת נתיב בסיס (תיקיית השורש של הפרויקט)
BASE_DIR = Path(__file__).resolve().parent

# שמות הסקריפטים להרצה לפי הסדר
SCRIPTS = [
    "scripts/fetch_nba_data.py",
    "scripts/fetch_team_stats.py",
    "scripts/etl_pipeline.py",
    "scripts/train_model.py",
    "frontend/playoff_ui.py"
]

print("=" * 60)
print("🚀 STARTING AUTOMATED NBA PLAYOFFS PIPELINE (2025-26) 🚀")
print("=" * 60)

for script_name in SCRIPTS:
    # הקוד החכם: בודק אם הסקריפט נמצא בתיקייה הראשית או בתוך תיקיית scripts
    script_path = BASE_DIR / "scripts" / script_name
    if not script_path.exists():
        script_path = BASE_DIR / script_name

    if not script_path.exists():
        print(f"\n❌ שגיאה: הקובץ '{script_name}' לא נמצא באף תיקייה!")
        sys.exit(1)

    print(f"\n▶️ Running: {script_name}...")
    print("-" * 40)

    # הרצה באמצעות האקזקיוטור של הסביבה הנוכחית
    result = subprocess.run([sys.executable, str(script_path)])

    if result.returncode != 0:
        print(f"\n❌ הצינור נעצר! שגיאה בהרצת הסקריפט: {script_name}")
        sys.exit(1)

    print("-" * 40)
    print(f"✅ Finished successfully: {script_name}")

print("\n" + "=" * 60)
print("🎉 ALL STEPS COMPLETED SUCCESSFULLY! THE PIPELINE IS DONE. 🎉")
print("=" * 60)