from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone

# התיקון הקריטי: אנחנו מייבאים את ה-Base מה-database שלנו כדי שכולם יעבדו על אותו אחד
from backend.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    balance = Column(Float, default=1000.0)
    last_reload = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=True)


class Bet(Base):
    __tablename__ = "bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    matchup = Column(String)  # e.g., "Boston Celtics vs Miami Heat"
    game_number = Column(Integer)  # 1 to 7
    bet_type = Column(String)  # "moneyline", "spread", "over_under_points"
    team_bet_on = Column(String)  # Team name, or "Over" / "Under"
    target_value = Column(Float, nullable=True)  # Spread value or Over/Under line
    amount = Column(Float)
    odds = Column(Float)
    potential_win = Column(Float)
    status = Column(String, default="pending")  # "pending", "won", "lost"


class GameHistory(Base):
    __tablename__ = "game_history"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(String)  # e.g., "Boston_Celtics_vs_Miami_Heat"
    round_number = Column(Integer)  # 1: First Round, 2: Semifinals, 3: Conf Finals, 4: Finals
    game_number = Column(Integer)  # 1 to 7
    team1 = Column(String)
    team2 = Column(String)
    team1_pts = Column(Integer)
    team2_pts = Column(Integer)
    team1_rebounds = Column(Integer)
    team2_rebounds = Column(Integer)
    winner = Column(String)