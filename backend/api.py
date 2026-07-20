import os
import sys
import re
import random
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from google import genai
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# --- הגדרת נתיב ברור לתיקיית הנתונים ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
sys.path.append(str(BASE_DIR))

from backend.playoff_engine import PlayoffEngine
from backend.db.database import get_db, engine, Base
from backend.db.models import User, Bet, GameHistory
from backend.db.auth import get_password_hash, verify_password

Base.metadata.create_all(bind=engine)

load_dotenv(dotenv_path=BASE_DIR / '.env')

API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

app = FastAPI(title="NBA 2026 Enterprise Sportsbook API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

engine_nba = PlayoffEngine(data_path=DATA_DIR)


# --- Schemas ---
class UserAuth(BaseModel):
    username: str
    password: str


class PlaceBetRequest(BaseModel):
    user_id: int
    matchup: str
    game_number: int
    bet_type: str
    team_bet_on: str
    target_value: Optional[float] = None
    amount: float
    odds: float


class SimulateGameRequest(BaseModel):
    matchup: str
    game_number: int
    team1: str
    team2: str


class SimulateSeriesAutoRequest(BaseModel):
    matchup: str
    team1: str
    team2: str


class ReloadBankRequest(BaseModel):
    user_id: int


# --- Dynamic Round & Bracket Manager ---
def get_round_matchups(db: Session):
    wt, et = engine_nba.west_teams, engine_nba.east_teams
    r1_matches = [
        ("West 1 vs 8", wt[1], wt[8]), ("West 4 vs 5", wt[4], wt[5]),
        ("West 3 vs 6", wt[3], wt[6]), ("West 2 vs 7", wt[2], wt[7]),
        ("East 1 vs 8", et[1], et[8]), ("East 4 vs 5", et[4], et[5]),
        ("East 3 vs 6", et[3], et[6]), ("East 2 vs 7", et[2], et[7]),
    ]

    r1_winners = {}
    for sid, t1, t2 in r1_matches:
        games = db.query(GameHistory).filter(GameHistory.series_id == sid).all()
        w1 = sum(1 for g in games if g.winner == t1)
        w2 = sum(1 for g in games if g.winner == t2)
        if w1 == 4:
            r1_winners[sid] = t1
        elif w2 == 4:
            r1_winners[sid] = t2

    if len(r1_winners) < 8:
        return 1, r1_matches

    r2_matches = [
        ("West Semi 1", r1_winners.get("West 1 vs 8"), r1_winners.get("West 4 vs 5")),
        ("West Semi 2", r1_winners.get("West 3 vs 6"), r1_winners.get("West 2 vs 7")),
        ("East Semi 1", r1_winners.get("East 1 vs 8"), r1_winners.get("East 4 vs 5")),
        ("East Semi 2", r1_winners.get("East 3 vs 6"), r1_winners.get("East 2 vs 7")),
    ]

    r2_winners = {}
    for sid, t1, t2 in r2_matches:
        if not t1 or not t2: continue
        games = db.query(GameHistory).filter(GameHistory.series_id == sid).all()
        w1 = sum(1 for g in games if g.winner == t1)
        w2 = sum(1 for g in games if g.winner == t2)
        if w1 == 4:
            r2_winners[sid] = t1
        elif w2 == 4:
            r2_winners[sid] = t2

    if len(r2_winners) < 4:
        return 2, r2_matches

    r3_matches = [
        ("West Finals", r2_winners.get("West Semi 1"), r2_winners.get("West Semi 2")),
        ("East Finals", r2_winners.get("East Semi 1"), r2_winners.get("East Semi 2")),
    ]

    r3_winners = {}
    for sid, t1, t2 in r3_matches:
        if not t1 or not t2: continue
        games = db.query(GameHistory).filter(GameHistory.series_id == sid).all()
        w1 = sum(1 for g in games if g.winner == t1)
        w2 = sum(1 for g in games if g.winner == t2)
        if w1 == 4:
            r3_winners[sid] = t1
        elif w2 == 4:
            r3_winners[sid] = t2

    if len(r3_winners) < 2:
        return 3, r3_matches

    r4_matches = [("NBA Finals", r3_winners.get("West Finals"), r3_winners.get("East Finals"))]
    return 4, r4_matches


# --- Endpoints ---
@app.get("/api/futures-lines")
def get_futures_lines(db: Session = Depends(get_db)):
    wt = list(engine_nba.west_teams.values())
    et = list(engine_nba.east_teams.values())
    all_teams = wt + et
    lines = []
    for team in all_teams:
        stats = engine_nba.team_db.get(team, {'CUM_WIN_PCT': 0.5})
        pct = stats['CUM_WIN_PCT']
        odds = round((1 / (pct ** 2.5)) * 1.8, 2)
        lines.append({"team": team, "odds": odds})
    return {"futures_lines": lines}


@app.post("/api/register")
def register(user: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_pw = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_pw, balance=1000.0)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id, "balance": new_user.balance}


@app.post("/api/login")
def login(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Success", "user_id": db_user.id, "balance": db_user.balance}


@app.get("/api/user/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return {"balance": user.balance, "username": user.username}


# --- תיקון אכיפת חילוץ מהבנק: דולר אחד או פחות בלבד ---
@app.post("/api/deposit")
@app.post("/api/reload-bank")
def reload_bank(req: ReloadBankRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.balance > 1.0:
        raise HTTPException(status_code=400, detail="Bailout denied. Wallet has more than $1.00.")

    # התיקון: מייצרים זמן נוכחי ומסירים ממנו את אזור הזמן כדי שיתאים ל-SQLite
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if user.last_reload:
        # מוודאים שגם הזמן מהדאטה-בייס נקי מאזור זמן
        last_reload_naive = user.last_reload.replace(tzinfo=None)
        if (now - last_reload_naive).total_seconds() < 10:
            remaining = int(10 - (now - last_reload_naive).total_seconds())
            raise HTTPException(status_code=429, detail=f"Wait {remaining} seconds.")

    user.balance += 1000.0
    user.last_reload = now
    db.commit()
    return {"message": "Reloaded", "new_balance": user.balance}

@app.get("/api/betting-lines")
def get_betting_lines(db: Session = Depends(get_db)):
    current_round, matchups = get_round_matchups(db)
    lines = []
    for series_id, t1, t2 in matchups:
        if not t1 or not t2: continue
        games = db.query(GameHistory).filter(GameHistory.series_id == series_id).all()
        w1 = sum(1 for g in games if g.winner == t1)
        w2 = sum(1 for g in games if g.winner == t2)
        if w1 == 4 or w2 == 4: continue
        next_game = len(games) + 1
        is_game_unlocked = (next_game <= 4) or (min(w2 + 4, w1 + 4) >= next_game)
        odds = engine_nba.calculate_advanced_odds(t1, t2, series_history=games)
        lines.append({
            "series_id": series_id, "current_round": current_round,
            "team1": t1, "team2": t2, "series_score": f"{w1} - {w2}",
            "next_game_number": next_game, "is_unlocked": is_game_unlocked, "odds": odds if is_game_unlocked else None
        })
    return {"active_round": current_round, "betting_lines": lines}


@app.post("/api/place-bet")
def place_bet(req: PlaceBetRequest, db: Session = Depends(get_db)):
    try:
        current_user_id = int(req.user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user ID format.")
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive.")
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds.")

    user.balance -= req.amount
    new_bet = Bet(
        user_id=current_user_id, matchup=req.matchup, game_number=req.game_number,
        bet_type=req.bet_type, team_bet_on=req.team_bet_on, target_value=req.target_value,
        amount=req.amount, odds=req.odds, potential_win=req.amount * req.odds, status="pending"
    )
    db.add(new_bet)
    db.commit()
    return {"message": "Bet placed successfully", "new_balance": user.balance}


def resolve_game_bets(db: Session, matchup: str, game_number: int, stats: dict, team1: str, team2: str):
    pending_bets = db.query(Bet).filter(Bet.matchup == matchup, Bet.game_number == game_number,
                                        Bet.status == "pending").all()
    for bet in pending_bets:
        user = db.query(User).filter(User.id == bet.user_id).first()
        if not user: continue
        if bet.bet_type == "moneyline":
            if bet.team_bet_on == stats["winner"]:
                bet.status = "won"
                user.balance += bet.potential_win
            else:
                bet.status = "lost"
        elif bet.bet_type == "spread":
            margin = stats["t1_pts"] - stats["t2_pts"] if bet.team_bet_on == team1 else stats["t2_pts"] - stats[
                "t1_pts"]
            if margin + (bet.target_value or 0) > 0:
                bet.status = "won"
                user.balance += bet.potential_win
            elif margin + (bet.target_value or 0) == 0:
                bet.status = "push"
                user.balance += bet.amount
            else:
                bet.status = "lost"
        elif bet.bet_type == "over_under_points":
            total = stats["total_points"]
            if total == bet.target_value:
                bet.status = "push"
                user.balance += bet.amount
            elif (bet.team_bet_on == "Over" and total > bet.target_value) or (
                    bet.team_bet_on == "Under" and total < bet.target_value):
                bet.status = "won"
                user.balance += bet.potential_win
            else:
                bet.status = "lost"


@app.post("/api/simulate-game")
def simulate_single_game(req: SimulateGameRequest, db: Session = Depends(get_db)):
    games = db.query(GameHistory).filter(GameHistory.series_id == req.matchup).all()
    w1 = sum(1 for g in games if g.winner == req.team1)
    w2 = sum(1 for g in games if g.winner == req.team2)
    if w1 == 4 or w2 == 4:
        raise HTTPException(status_code=400, detail="Series already finished.")
    if req.game_number != len(games) + 1:
        raise HTTPException(status_code=400, detail=f"Sequence error.")

    stats = engine_nba.generate_game_stats(req.team1, req.team2, series_history=games)
    current_round, _ = get_round_matchups(db)
    history = GameHistory(
        series_id=req.matchup, round_number=current_round, game_number=req.game_number,
        team1=req.team1, team2=req.team2, team1_pts=stats["t1_pts"], team2_pts=stats["t2_pts"], winner=stats["winner"]
    )
    db.add(history)
    resolve_game_bets(db, req.matchup, req.game_number, stats, req.team1, req.team2)

    final_w1 = w1 + (1 if stats["winner"] == req.team1 else 0)
    final_w2 = w2 + (1 if stats["winner"] == req.team2 else 0)
    if final_w1 == 4 or final_w2 == 4:
        series_champ = req.team1 if final_w1 == 4 else req.team2
        series_bets = db.query(Bet).filter(Bet.matchup == req.matchup, Bet.bet_type == "series_winner",
                                           Bet.status == "pending").all()
        for s_bet in series_bets:
            s_user = db.query(User).filter(User.id == s_bet.user_id).first()
            if s_user:
                s_bet.status = "won" if s_bet.team_bet_on == series_champ else "lost"
                if s_bet.status == "won": s_user.balance += s_bet.potential_win

        if req.matchup == "NBA Finals":
            futures = db.query(Bet).filter(Bet.bet_type == "futures_champion", Bet.status == "pending").all()
            for f_bet in futures:
                f_user = db.query(User).filter(User.id == f_bet.user_id).first()
                if f_user:
                    f_bet.status = "won" if f_bet.team_bet_on == series_champ else "lost"
                    if f_bet.status == "won": f_user.balance += f_bet.potential_win
    db.commit()
    return {"game_result": stats, "message": "Settled"}


@app.post("/api/simulate-series-auto")
def simulate_series_auto(req: SimulateSeriesAutoRequest, db: Session = Depends(get_db)):
    while True:
        games = db.query(GameHistory).filter(GameHistory.series_id == req.matchup).all()
        w1 = sum(1 for g in games if g.winner == req.team1)
        w2 = sum(1 for g in games if g.winner == req.team2)
        if w1 == 4 or w2 == 4: break
        next_game = len(games) + 1
        stats = engine_nba.generate_game_stats(req.team1, req.team2, series_history=games)
        current_round, _ = get_round_matchups(db)
        history = GameHistory(
            series_id=req.matchup, round_number=current_round, game_number=next_game,
            team1=req.team1, team2=req.team2, team1_pts=stats["t1_pts"], team2_pts=stats["t2_pts"],
            winner=stats["winner"]
        )
        db.add(history)
        resolve_game_bets(db, req.matchup, next_game, stats, req.team1, req.team2)

        if w1 + (1 if stats["winner"] == req.team1 else 0) == 4 or w2 + (1 if stats["winner"] == req.team2 else 0) == 4:
            champ = req.team1 if w1 + (1 if stats["winner"] == req.team1 else 0) == 4 else req.team2
            series_bets = db.query(Bet).filter(Bet.matchup == req.matchup, Bet.bet_type == "series_winner",
                                               Bet.status == "pending").all()
            for s_bet in series_bets:
                s_user = db.query(User).filter(User.id == s_bet.user_id).first()
                if s_user:
                    s_bet.status = "won" if s_bet.team_bet_on == champ else "lost"
                    if s_bet.status == "won": s_user.balance += s_bet.potential_win

            if req.matchup == "NBA Finals":
                futures = db.query(Bet).filter(Bet.bet_type == "futures_champion", Bet.status == "pending").all()
                for f_bet in futures:
                    f_user = db.query(User).filter(User.id == f_bet.user_id).first()
                    if f_user:
                        f_bet.status = "won" if f_bet.team_bet_on == champ else "lost"
                        if f_bet.status == "won": f_user.balance += f_bet.potential_win
            break
    db.commit()
    return {"message": "Series settled complete"}


@app.post("/api/simulate-tournament-auto")
def simulate_tournament_auto(db: Session = Depends(get_db)):
    for _ in range(150):
        current_round, matchups = get_round_matchups(db)
        simulated_any = False
        for series_id, t1, t2 in matchups:
            if not t1 or not t2: continue
            games = db.query(GameHistory).filter(GameHistory.series_id == series_id).all()
            w1 = sum(1 for g in games if g.winner == t1)
            w2 = sum(1 for g in games if g.winner == t2)
            if w1 < 4 and w2 < 4:
                next_game = len(games) + 1
                stats = engine_nba.generate_game_stats(t1, t2, series_history=games)
                history = GameHistory(
                    series_id=series_id, round_number=current_round, game_number=next_game,
                    team1=t1, team2=t2, team1_pts=stats["t1_pts"], team2_pts=stats["t2_pts"], winner=stats["winner"]
                )
                db.add(history)
                resolve_game_bets(db, series_id, next_game, stats, t1, t2)

                if w1 + (1 if stats["winner"] == t1 else 0) == 4 or w2 + (1 if stats["winner"] == t2 else 0) == 4:
                    champ = t1 if w1 + (1 if stats["winner"] == t1 else 0) == 4 else t2
                    series_bets = db.query(Bet).filter(Bet.matchup == series_id, Bet.bet_type == "series_winner",
                                                       Bet.status == "pending").all()
                    for s_bet in series_bets:
                        s_user = db.query(User).filter(User.id == s_bet.user_id).first()
                        if s_user:
                            s_bet.status = "won" if s_bet.team_bet_on == champ else "lost"
                            if s_bet.status == "won": s_user.balance += s_bet.potential_win

                    if series_id == "NBA Finals":
                        futures = db.query(Bet).filter(Bet.bet_type == "futures_champion",
                                                       Bet.status == "pending").all()
                        for f_bet in futures:
                            f_user = db.query(User).filter(User.id == f_bet.user_id).first()
                            if f_user:
                                f_bet.status = "won" if f_bet.team_bet_on == champ else "lost"
                                if f_bet.status == "won": f_user.balance += f_bet.potential_win
                db.commit()
                simulated_any = True
                break
        if not simulated_any:
            break
    return {"message": "Tournament fully completed"}


@app.post("/api/reset-tournament")
def reset_tournament(db: Session = Depends(get_db)):
    pending_bets = db.query(Bet).filter(Bet.status == "pending").all()
    for bet in pending_bets:
        user = db.query(User).filter(User.id == bet.user_id).first()
        if user:
            user.balance += bet.amount
        bet.status = "cancelled"
    db.query(GameHistory).delete()
    db.commit()
    return {"message": "Tournament reset successfully"}


@app.get("/api/tournament-status")
def get_tournament_status(db: Session = Depends(get_db)):
    wt, et = engine_nba.west_teams, engine_nba.east_teams

    def get_score(sid, default_t1, default_t2):
        if not default_t1 or not default_t2:
            return {"name": default_t1 or "TBD", "wins": 0}, {"name": default_t2 or "TBD", "wins": 0}
        games = db.query(GameHistory).filter(GameHistory.series_id == sid).all()
        w1 = sum(1 for g in games if g.winner == default_t1)
        w2 = sum(1 for g in games if g.winner == default_t2)
        return {"name": default_t1, "wins": w1}, {"name": default_t2, "wins": w2}

    w_r1 = [("West 1 vs 8", wt[1], wt[8]), ("West 4 vs 5", wt[4], wt[5]), ("West 3 vs 6", wt[3], wt[6]),
            ("West 2 vs 7", wt[2], wt[7])]
    e_r1 = [("East 1 vs 8", et[1], et[8]), ("East 4 vs 5", et[4], et[5]), ("East 3 vs 6", et[3], et[6]),
            ("East 2 vs 7", et[2], et[7])]
    bracket = {"west": {"r1": [], "r2": [], "r3": []}, "east": {"r1": [], "r2": [], "r3": []}, "finals": {}}
    w_r1_winners, e_r1_winners = [], []
    for sid, t1, t2 in w_r1:
        team1, team2 = get_score(sid, t1, t2)
        bracket["west"]["r1"].append({"t1": team1, "t2": team2})
        w_r1_winners.append(t1 if team1["wins"] == 4 else (t2 if team2["wins"] == 4 else None))
    for sid, t1, t2 in e_r1:
        team1, team2 = get_score(sid, t1, t2)
        bracket["east"]["r1"].append({"t1": team1, "t2": team2})
        e_r1_winners.append(t1 if team1["wins"] == 4 else (t2 if team2["wins"] == 4 else None))

    w_r2 = [("West Semi 1", w_r1_winners[0], w_r1_winners[1]), ("West Semi 2", w_r1_winners[2], w_r1_winners[3])]
    e_r2 = [("East Semi 1", e_r1_winners[0], e_r1_winners[1]), ("East Semi 2", e_r1_winners[2], e_r1_winners[3])]
    w_r2_winners, e_r2_winners = [], []
    for sid, t1, t2 in w_r2:
        team1, team2 = get_score(sid, t1, t2)
        bracket["west"]["r2"].append({"t1": team1, "t2": team2})
        w_r2_winners.append(t1 if team1["wins"] == 4 else (t2 if team2["wins"] == 4 else None))
    for sid, t1, t2 in e_r2:
        team1, team2 = get_score(sid, t1, t2)
        bracket["east"]["r2"].append({"t1": team1, "t2": team2})
        e_r2_winners.append(t1 if team1["wins"] == 4 else (t2 if team2["wins"] == 4 else None))

    t1, t2 = get_score("West Finals", w_r2_winners[0], w_r2_winners[1])
    bracket["west"]["r3"].append({"t1": t1, "t2": t2})
    w_champ = w_r2_winners[0] if t1["wins"] == 4 else (w_r2_winners[1] if t2["wins"] == 4 else None)

    t1, t2 = get_score("East Finals", e_r2_winners[0], e_r2_winners[1])
    bracket["east"]["r3"].append({"t1": t1, "t2": t2})
    e_champ = e_r2_winners[0] if t1["wins"] == 4 else (e_r2_winners[1] if t2["wins"] == 4 else None)

    f_t1, f_t2 = get_score("NBA Finals", w_champ, e_champ)
    bracket["finals"] = {"t1": f_t1, "t2": f_t2}
    return bracket


@app.get("/api/user/{user_id}/history")
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    bets = db.query(Bet).filter(Bet.user_id == user_id).order_by(Bet.id.desc()).all()
    return {"history": [{"id": b.id, "matchup": b.matchup, "game_number": b.game_number, "bet_type": b.bet_type,
                         "team_bet_on": b.team_bet_on, "amount": b.amount, "odds": b.odds, "status": b.status} for b in
                        bets]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)