'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // בדיקה אוטומטית: אם המשתמש כבר מחובר, נזרוק אותו ישר לדשבורד
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      router.push('/dashboard');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) return null;

  return (
    <div className="min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] flex flex-col items-center justify-center p-6 text-center selection:bg-amber-500/30 overflow-hidden relative font-sans">

      {/* תאורת רקע יוקרתית */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl space-y-8 animate-fade-in-up relative z-10">

        {/* לוגו מרחף */}
        <div className="inline-flex items-center justify-center h-28 w-28 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.4)] mb-4 transform hover:scale-105 transition-all duration-500">
          <span className="text-white font-black text-6xl">N</span>
        </div>

        {/* כותרת ניאון אפלה */}
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase drop-shadow-sm">
          PLAYOFF<span className="text-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">PREDICT</span>
        </h1>

        <p className="text-sm md:text-base text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed uppercase tracking-[0.2em]">
          The Ultimate 2026 Enterprise Sportsbook Simulator. <br className="hidden md:block" /> Place bets, run real-time simulations, and conquer the finals.
        </p>

        {/* כפתורי פעולה בסטייל זכוכית מרחפת */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 pt-8">
          <button
            onClick={() => router.push('/login')}
            className="px-12 py-5 relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] transform transition-all duration-300 active:scale-[0.98] uppercase tracking-[0.15em] text-sm"
          >
            <span className="relative z-10">Access Terminal</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </button>

          <button
            onClick={() => router.push('/register')}
            className="px-12 py-5 bg-white/[0.02] backdrop-blur-md text-white border border-white/10 rounded-2xl font-black hover:border-amber-500/50 hover:bg-amber-500/10 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:text-amber-400 transform transition-all duration-300 active:scale-[0.98] uppercase tracking-[0.15em] text-sm"
          >
            Initialize Wallet
          </button>
        </div>

      </div>
    </div>
  );
}