'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const getTeamLogo = (teamName: string) => {
  const logos: Record<string, string> = {
    "Atlanta Hawks": "atl", "Boston Celtics": "bos", "Brooklyn Nets": "bkn",
    "Charlotte Hornets": "cha", "Chicago Bulls": "chi", "Cleveland Cavaliers": "cle",
    "Dallas Mavericks": "dal", "Denver Nuggets": "den", "Detroit Pistons": "det",
    "Golden State Warriors": "gs", "Houston Rockets": "hou", "Indiana Pacers": "ind",
    "LA Clippers": "lac", "Los Angeles Lakers": "lal", "Memphis Grizzlies": "mem",
    "Miami Heat": "mia", "Milwaukee Bucks": "mil", "Minnesota Timberwolves": "min",
    "New Orleans Pelicans": "no", "New York Knicks": "ny", "Oklahoma City Thunder": "okc",
    "Orlando Magic": "orl", "Philadelphia 76ers": "phi", "Phoenix Suns": "phx",
    "Portland Trail Blazers": "por", "Sacramento Kings": "sac", "San Antonio Spurs": "sa",
    "Toronto Raptors": "tor", "Utah Jazz": "uta", "Washington Wizards": "wsh"
  };
  const abbr = logos[teamName];
  return abbr ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png` : "https://cdn-icons-png.flaticon.com/512/806/806001.png";
};

const GameCard = ({ line, userBalance, onPlaceBet, onSimulate, onSimulateSeries, isBankrupt }: any) => {
  const [localBetAmount, setLocalBetAmount] = useState<number | ''>('');
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [cardError, setCardError] = useState<string>('');
  const [isPlacing, setIsPlacing] = useState(false);

  const handleConfirmBet = async () => {
    setCardError('');
    if (!selectedBet) { setCardError("Please select a bet first."); return; }
    if (!localBetAmount || Number(localBetAmount) <= 0) { setCardError("Enter a valid wager amount."); return; }
    if (Number(localBetAmount) > userBalance) { setCardError("Insufficient funds!"); return; }

    setIsPlacing(true);
    await onPlaceBet(line.series_id, line.next_game_number, selectedBet.type, selectedBet.target, selectedBet.value, selectedBet.odds, Number(localBetAmount));
    setIsPlacing(false);
    setSelectedBet(null);
    setLocalBetAmount('');
  };

  const handleSimulateClick = () => {
    setCardError('');
    setSelectedBet(null);
    setLocalBetAmount('');
    onSimulate(line.series_id, line.next_game_number, line.team1, line.team2);
  };

  const handleSimulateSeriesClick = () => {
    setCardError('');
    setSelectedBet(null);
    setLocalBetAmount('');
    onSimulateSeries(line.series_id, line.team1, line.team2);
  };

  const getBtnStyle = (type: string, target: string) => {
    const isSelected = selectedBet?.type === type && selectedBet?.target === target;
    return `flex-1 border rounded-2xl p-4 transition-all text-center ${isSelected ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/5 hover:border-indigo-500/50 hover:bg-white/10'}`;
  };

  return (
    <div className="group bg-[#111827] border border-white/10 hover:border-white/20 rounded-3xl overflow-hidden transition-all duration-500 shadow-xl relative">
      <div className="bg-black/40 border-b border-white/5 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1 w-24">
            <img src={getTeamLogo(line.team1)} alt={line.team1} className="w-12 h-12 object-contain drop-shadow-xl" />
            <span className="font-bold text-[10px] text-gray-300 uppercase text-center">{line.team1}</span>
          </div>
          <span className="text-gray-600 font-black text-sm italic">VS</span>
          <div className="flex flex-col items-center gap-1 w-24">
            <img src={getTeamLogo(line.team2)} alt={line.team2} className="w-12 h-12 object-contain drop-shadow-xl" />
            <span className="font-bold text-[10px] text-gray-300 uppercase text-center">{line.team2}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">Score: {line.series_score}</span>
          <div className="bg-white/5 px-4 py-1.5 rounded-lg text-xs font-black text-white uppercase tracking-widest">Game {line.next_game_number}</div>
        </div>
      </div>

      {line.is_unlocked && line.odds ? (
        <div className="p-6 md:p-8 space-y-6">
          {line.odds.series_winner && (
            <div className="space-y-3 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
              <h4 className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest text-center">To Win Series</h4>
              <div className="flex gap-3">
                <button onClick={() => {setSelectedBet({ type: "series_winner", target: line.team1, value: null, odds: line.odds.series_winner[line.team1] }); setCardError('');}} className={getBtnStyle("series_winner", line.team1)}>
                  <span className="block text-[11px] font-bold text-gray-400 truncate">{line.team1}</span>
                  <span className="block text-xl font-black text-amber-400 mt-1">{line.odds.series_winner[line.team1]}</span>
                </button>
                <button onClick={() => {setSelectedBet({ type: "series_winner", target: line.team2, value: null, odds: line.odds.series_winner[line.team2] }); setCardError('');}} className={getBtnStyle("series_winner", line.team2)}>
                  <span className="block text-[11px] font-bold text-gray-400 truncate">{line.team2}</span>
                  <span className="block text-xl font-black text-amber-400 mt-1">{line.odds.series_winner[line.team2]}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Game Moneyline</h4>
              <div className="flex gap-3">
                <button onClick={() => {setSelectedBet({ type: "moneyline", target: line.team1, value: null, odds: line.odds.moneyline[line.team1] }); setCardError('');}} className={getBtnStyle("moneyline", line.team1)}>
                  <span className="block text-[11px] font-bold text-gray-400 truncate">{line.team1}</span>
                  <span className="block text-xl font-black text-blue-400 mt-1">{line.odds.moneyline[line.team1]}</span>
                </button>
                <button onClick={() => {setSelectedBet({ type: "moneyline", target: line.team2, value: null, odds: line.odds.moneyline[line.team2] }); setCardError('');}} className={getBtnStyle("moneyline", line.team2)}>
                  <span className="block text-[11px] font-bold text-gray-400 truncate">{line.team2}</span>
                  <span className="block text-xl font-black text-blue-400 mt-1">{line.odds.moneyline[line.team2]}</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Points ({line.odds.over_under_points.line})</h4>
              <div className="flex gap-3">
                <button onClick={() => {setSelectedBet({ type: "over_under_points", target: "Over", value: line.odds.over_under_points.line, odds: line.odds.over_under_points.over_odds }); setCardError('');}} className={getBtnStyle("over_under_points", "Over")}>
                  <span className="block text-xs font-bold text-gray-400">Over</span>
                  <span className="block text-xl font-black text-emerald-400 mt-1">{line.odds.over_under_points.over_odds}</span>
                </button>
                <button onClick={() => {setSelectedBet({ type: "over_under_points", target: "Under", value: line.odds.over_under_points.line, odds: line.odds.over_under_points.under_odds }); setCardError('');}} className={getBtnStyle("over_under_points", "Under")}>
                  <span className="block text-xs font-bold text-gray-400">Under</span>
                  <span className="block text-xl font-black text-red-400 mt-1">{line.odds.over_under_points.under_odds}</span>
                </button>
              </div>
            </div>
          </div>

          {cardError && <div className="text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">{cardError}</div>}

          <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-white/5">
            <div className="flex-[1.2] bg-black/50 border border-white/10 rounded-2xl px-4 py-2 flex items-center focus-within:border-amber-500/50 transition-colors">
              <span className="text-amber-500/50 font-black mr-2">$</span>
              <input type="number" placeholder="Wager" value={localBetAmount} disabled={isBankrupt} onChange={(e) => {setLocalBetAmount(Number(e.target.value)); setCardError('');}} className="w-full bg-transparent text-white font-black text-lg outline-none" />
            </div>
            <button onClick={handleConfirmBet} disabled={isPlacing || isBankrupt} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-800 text-white font-black py-3 rounded-2xl uppercase text-[10px]">
              Place Bet
            </button>
            <button onClick={handleSimulateClick} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-3 rounded-2xl uppercase text-[10px]">
              Simulate
            </button>
            <button onClick={handleSimulateSeriesClick} className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-black py-3 rounded-2xl uppercase text-[10px] border border-amber-500/20">
              Auto Series
            </button>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-black/20"><h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Series Locked</h4></div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bettingLines, setBettingLines] = useState<any[]>([]);
  const [futuresLines, setFuturesLines] = useState<any[]>([]);
  const [selectedFutureTeam, setSelectedFutureTeam] = useState('');
  const [futureWager, setFutureWager] = useState<number | ''>('');
  const [activeRound, setActiveRound] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const refreshData = async (userId: string) => {
    try {
      const userRes = await fetch(`http://127.0.0.1:8000/api/user/${userId}`);
      const userData = await userRes.json();
      setUser({ id: userId, ...userData });

      const linesRes = await fetch('http://127.0.0.1:8000/api/betting-lines');
      const linesData = await linesRes.json();
      setBettingLines(linesData.betting_lines);
      setActiveRound(linesData.active_round);

      const futuresRes = await fetch('http://127.0.0.1:8000/api/futures-lines');
      const futuresData = await futuresRes.json();
      setFuturesLines(futuresData.futures_lines);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { router.push('/login'); return; }
    refreshData(userId).then(() => setLoading(false));
  }, [router]);

  const placeBet = async (matchup: string, game_number: number, bet_type: string, team_bet_on: string, target_value: number | null, odds: number, amount: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/place-bet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(user.id), matchup, game_number, bet_type, team_bet_on, target_value, amount, odds }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Bet Confirmed! Potential Payout: $${(amount * odds).toFixed(2)}`);
        setUser((prev: any) => ({ ...prev, balance: data.new_balance }));
        setTimeout(() => setMessage(''), 4000);
      } else {
        const errorMsg = Array.isArray(data.detail) ? data.detail.map((err: any) => `${err.msg}`).join(' | ') : data.detail;
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) { alert("Failed to place bet."); }
  };

  const handlePlaceFutureBet = () => {
    if (!selectedFutureTeam || !futureWager || Number(futureWager) <= 0) {
      alert("Please select a team and enter a valid amount.");
      return;
    }
    const selectedObj = futuresLines.find(f => f.team === selectedFutureTeam);
    if (!selectedObj) return;
    placeBet("NBA Finals", 0, "futures_champion", selectedFutureTeam, null, selectedObj.odds, Number(futureWager));
    setFutureWager('');
    setSelectedFutureTeam('');
  };

  const simulateGame = async (matchup: string, game_number: number, team1: string, team2: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulate-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchup, game_number, team1, team2 }),
      });
      if (res.ok) { refreshData(user.id); }
    } catch (err) { alert("Simulation failed."); }
  };

  const simulateSeriesAuto = async (matchup: string, team1: string, team2: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulate-series-auto', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchup, team1, team2 }),
      });
      if (res.ok) { refreshData(user.id); }
    } catch (err) { alert("Series simulation failed."); }
  };

  const simulateTournamentAuto = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/simulate-tournament-auto', { method: 'POST' });
      if (res.ok) { refreshData(user.id); alert("Tournament Simulation Completed Successfully!"); }
    } catch (err) { alert("Tournament simulation failed."); }
  };

  const resetTournament = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/reset-tournament', { method: 'POST' });
      if (res.ok) {
        refreshData(user.id);
        setMessage("Tournament Reset! Good luck in the new season.");
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) { alert("Failed to reset tournament."); }
  };

  // פונקציית משיכת כספי חילוץ (Bailout) כשיש דולר אחד או פחות
  const handleClaimBailout = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/reload-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: Number(user.id) }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => ({ ...prev, balance: data.new_balance }));
        setMessage("Bailout approved! +$1,000 transferred from bank.");
        setTimeout(() => setMessage(''), 4000);
      } else {
        alert(data.detail || "Bailout rejected.");
      }
    } catch (err) { alert("Bank service communication error."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const roundNames = ["Quarterfinals", "Semifinals", "Conference Finals", "NBA Finals"];
  const isBailoutEligible = user?.balance !== undefined && user.balance <= 1.0;

  const half = Math.ceil(bettingLines.length / 2);
  const westGames = bettingLines.slice(0, half);
  const eastGames = bettingLines.slice(half);

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-200 pb-24 selection:bg-amber-500/30">
      <nav className="sticky top-0 z-50 bg-[#050505]/70 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-xl flex items-center justify-center"><span className="text-white font-black text-xl">N</span></div>
            <h1 className="text-xl font-black tracking-tighter text-white hidden sm:block">PLAYOFF<span className="text-amber-500">PREDICT</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => router.push('/bracket')} className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase border border-amber-500/20 px-3 py-1.5 rounded-lg bg-amber-500/5">Tournament Bracket</button>
            <button onClick={() => router.push('/history')} className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase">History</button>

            {/* כפתור ה-Bailout המבוקש המשתנה לפי היתרה */}
            <button
              onClick={handleClaimBailout}
              disabled={!isBailoutEligible}
              className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all border ${
                isBailoutEligible
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black border-emerald-400 animate-pulse shadow-lg shadow-emerald-500/20 hover:scale-105'
                  : 'bg-gray-900 text-gray-600 border-gray-800/60 cursor-not-allowed opacity-40'
              }`}
            >
              {isBailoutEligible ? "Claim $1,000 Bailout" : "Bank Locked"}
            </button>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Wallet</span>
              <span className={`text-2xl font-black tabular-nums tracking-tight ${user?.balance <= 1.0 ? 'text-red-500' : 'text-emerald-400'}`}>
                ${user?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-8 px-4 sm:px-6">

        <div className="bg-gradient-to-b from-amber-500/10 via-transparent to-transparent border border-amber-500/20 rounded-3xl p-6 mb-12 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider">NBA Finals Champion Futures</h3>
              <p className="text-xs text-gray-400">Lock your prediction for the final championship crown or execute an instant tournament macro run.</p>
            </div>
            <button onClick={simulateTournamentAuto} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-lg shadow-amber-500/10">
              ⚡ Simulate Entire Tournament
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <select value={selectedFutureTeam} onChange={(e) => setSelectedFutureTeam(e.target.value)} className="w-full md:flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-amber-500">
              <option value="">-- Choose Playoff Champion --</option>
              {futuresLines.map(f => (
                <option key={f.team} value={f.team}>{f.team} (Odds: {f.odds})</option>
              ))}
            </select>
            <div className="w-full md:w-48 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-amber-500">
              <span className="text-amber-500 font-bold mr-2">$</span>
              <input type="number" placeholder="Wager" value={futureWager} onChange={(e) => setFutureWager(Number(e.target.value))} className="w-full bg-transparent text-white font-black text-lg outline-none" />
            </div>
            <button onClick={handlePlaceFutureBet} className="w-full md:w-44 bg-white text-black font-black py-4 rounded-2xl text-xs uppercase transition-all hover:bg-gray-200">
              Place Future Bet
            </button>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">{roundNames[activeRound - 1]}</h2>
          <p className="text-amber-500 text-[10px] tracking-[0.3em] font-bold uppercase mt-1">Live Betting Lines</p>
        </div>

        {message && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl mb-10 text-center font-bold">{message}</div>}

        {bettingLines.length === 0 ? (
          <div className="p-16 md:p-24 text-center bg-white/[0.02] rounded-3xl border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-black text-amber-500 uppercase tracking-widest mb-4">Tournament Complete</h3>
            <p className="text-gray-400 text-sm mb-10">All series have concluded. Check the Bracket to view the Champion!</p>
            <button onClick={resetTournament} className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black font-black px-10 py-5 rounded-2xl uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-transform active:scale-95">
               🔄 Start New Playoffs Season
            </button>
            <p className="text-[10px] text-gray-500 mt-4 tracking-widest uppercase">* Your wallet balance and betting history will be saved.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 w-full">
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-center gap-3 mb-6"><div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-red-500"></div><h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Western Conference</h3><div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-red-500"></div></div>
              {westGames.map((line) => <GameCard key={line.series_id} line={line} userBalance={user?.balance || 0} onPlaceBet={placeBet} onSimulate={simulateGame} onSimulateSeries={simulateSeriesAuto} isBankrupt={user?.balance <= 1.0} />)}
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-center gap-3 mb-6"><div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-blue-500"></div><h3 className="text-sm font-black text-blue-500 uppercase tracking-widest">Eastern Conference</h3><div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-blue-500"></div></div>
              {eastGames.map((line) => <GameCard key={line.series_id} line={line} userBalance={user?.balance || 0} onPlaceBet={placeBet} onSimulate={simulateGame} onSimulateSeries={simulateSeriesAuto} isBankrupt={user?.balance <= 1.0} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}