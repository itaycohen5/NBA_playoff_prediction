import sys
from pathlib import Path
from sqlalchemy.orm import sessionmaker

# מוודא שתיקיית הפרויקט נמצאת ב-Path כדי למצוא את המודולים
sys.path.append(str(Path(__file__).resolve().parent))

from backend.db.database import engine, Base
from backend.db.models import User, Bet, GameHistory
from backend.db.auth import get_password_hash  # וודא שפונקציית ה-Hash קיימת בנתיב הזה


def init():
    print("🚀 מתחיל באתחול מסד הנתונים...")

    # 1. יצירת הטבלאות
    Base.metadata.create_all(bind=engine)
    print("✅ טבלאות נוצרו בהצלחה!")

    # 2. יצירת משתמש דמו
    Session = sessionmaker(bind=engine)
    session = Session()

    if not session.query(User).filter_by(username="Itay").first():
        # יצירת Hash לסיסמה "Password123!"
        hashed_pw = get_password_hash("Password123!")
        new_user = User(
            username="Itay",
            balance=1000.0,
            hashed_password=hashed_pw
        )
        session.add(new_user)
        session.commit()
        print("✅ משתמש 'Itay' נוצר בהצלחה!")
        print("🔑 סיסמה: Password123!")
    else:
        print("ℹ️ המשתמש 'Itay' כבר קיים.")

    session.close()
    print("🏁 האתחול הושלם.")


if __name__ == "__main__":
    init()