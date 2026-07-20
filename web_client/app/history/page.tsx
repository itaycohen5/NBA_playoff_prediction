'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/user/${userId}/history`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Error fetching history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-200 flex flex-col">

      {/* תפריט עליון - תואם לשאר האפליקציה */}
      <nav className="shrink-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl relative z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">PLAYOFF<span className="text-amber-500">PREDICT</span></h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest border border-indigo-500/30 px-5 py-2 rounded-xl bg-indigo-500/10 transition-colors"
          >
            Back to Terminal
          </button>
        </div>
      </nav>

      {/* אזור תוכן מרכזי */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 relative">

        {/* תאורת רקע עדינה */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[150px] pointer-events-none"></div>

        <div className="text-center mb-12 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tighter uppercase">
            Ledger History
          </h2>
          <p className="text-amber-500 text-xs font-bold tracking-[0.3em] uppercase mt-2">Transaction Records</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (

          /* מצב ריק - אין היסטוריה */
          <div className="relative z-10 bg-[#111827] border border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center shadow-2xl mt-10">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">No Betting History Yet</h3>
            <p className="text-gray-400 font-medium mb-8 text-center max-w-md">
              Your ledger is currently empty. Head back to the terminal to place your first prediction.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-black py-4 px-8 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] uppercase tracking-[0.15em] text-sm"
            >
              Go to Dashboard
            </button>
          </div>

        ) : (

          /* תצוגת היסטוריית הימורים (כשיש נתונים) */
          <div className="relative z-10 bg-[#111827] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-white/5">
                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Matchup</th>
                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Prediction</th>
                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Wager</th>
                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Odds</th>
                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((bet) => (
                    <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-sm text-white">{bet.matchup}</div>
                        <div className="text-xs text-gray-500 uppercase">Game {bet.game_number}</div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-sm text-indigo-400">{bet.team_bet_on}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{bet.bet_type.replace('_', ' ')}</div>
                      </td>
                      <td className="p-5 font-black text-white">${bet.amount.toFixed(2)}</td>
                      <td className="p-5 font-bold text-gray-300">{bet.odds.toFixed(2)}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          bet.status === 'Won' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          bet.status === 'Lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {bet.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}