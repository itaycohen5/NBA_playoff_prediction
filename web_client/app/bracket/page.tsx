'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// מפה מלאה של כל קבוצות ה-NBA לטובת משיכת לוגואים רשמיים מ-ESPN
const getTeamLogo = (teamName: string) => {
  const logos: Record<string, string> = {
    "Atlanta Hawks": "atl",
    "Boston Celtics": "bos",
    "Brooklyn Nets": "bkn",
    "Charlotte Hornets": "cha",
    "Chicago Bulls": "chi",
    "Cleveland Cavaliers": "cle",
    "Dallas Mavericks": "dal",
    "Denver Nuggets": "den",
    "Detroit Pistons": "det",
    "Golden State Warriors": "gs",
    "Houston Rockets": "hou",
    "Indiana Pacers": "ind",
    "LA Clippers": "lac",
    "Los Angeles Lakers": "lal",
    "Memphis Grizzlies": "mem",
    "Miami Heat": "mia",
    "Milwaukee Bucks": "mil",
    "Minnesota Timberwolves": "min",
    "New Orleans Pelicans": "no",
    "New York Knicks": "ny",
    "Oklahoma City Thunder": "okc",
    "Orlando Magic": "orl",
    "Philadelphia 76ers": "phi",
    "Phoenix Suns": "phx",
    "Portland Trail Blazers": "por",
    "Sacramento Kings": "sac",
    "San Antonio Spurs": "sa",
    "Toronto Raptors": "tor",
    "Utah Jazz": "uta",
    "Washington Wizards": "wsh"
  };
  const abbr = logos[teamName];
  return abbr ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png` : "https://cdn-icons-png.flaticon.com/512/806/806001.png";
};

// קומפוננטת קלף המפגש (Node) בעץ הטורניר
const MatchupNode = ({ team1, team2, isFinals = false, title = "" }: any) => (
  <div className={`bg-[#111827] border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 w-full max-w-[170px] transition-all duration-300 hover:border-white/30 z-10 ${isFinals ? 'scale-110 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.2)]' : ''}`}>
    {title && (
      <div className={`text-center text-[9px] font-black uppercase tracking-widest ${isFinals ? 'text-amber-500' : 'text-gray-500'}`}>
        {title}
      </div>
    )}

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <img src={getTeamLogo(team1?.name)} alt="t1" className="w-5 h-5 object-contain shrink-0" />
        <span className="font-bold text-[10px] text-white truncate">{team1?.name || "TBD"}</span>
      </div>
      <span className={`font-black text-xs ${team1?.wins === 4 ? 'text-emerald-400' : 'text-gray-400'}`}>{team1?.wins || 0}</span>
    </div>

    <div className="h-px w-full bg-white/5"></div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <img src={getTeamLogo(team2?.name)} alt="t2" className="w-5 h-5 object-contain shrink-0" />
        <span className="font-bold text-[10px] text-white truncate">{team2?.name || "TBD"}</span>
      </div>
      <span className={`font-black text-xs ${team2?.wins === 4 ? 'text-emerald-400' : 'text-gray-400'}`}>{team2?.wins || 0}</span>
    </div>
  </div>
);

// מערכת ה-SVG הדינמית לשרטוט קווים מקשרים לבנים בין השלבים
const SVGConnector = ({ type }: { type: 'W1' | 'W2' | 'W3' | 'E1' | 'E2' | 'E3' }) => {
  const stroke = "rgba(255, 255, 255, 0.25)";
  const sw = "2.5";
  return (
    <svg className="w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {type === 'W1' && (
        <path d="M 0 12.5 L 50 12.5 L 50 37.5 L 0 37.5 M 50 25 L 100 25 M 0 62.5 L 50 62.5 L 50 87.5 L 0 87.5 M 50 75 L 100 75" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
      {type === 'W2' && (
        <path d="M 0 25 L 50 25 L 50 75 L 0 75 M 50 50 L 100 50" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
      {type === 'W3' && (
        <path d="M 0 50 L 100 50" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
      {type === 'E1' && (
        <path d="M 100 12.5 L 50 12.5 L 50 37.5 L 100 37.5 M 50 25 L 0 25 M 100 62.5 L 50 62.5 L 50 87.5 L 100 87.5 M 50 75 L 0 75" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
      {type === 'E2' && (
        <path d="M 100 25 L 50 25 L 50 75 L 100 75 M 50 50 L 0 50" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
      {type === 'E3' && (
        <path d="M 100 50 L 0 50" fill="none" stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
};

export default function BracketPage() {
  const router = useRouter();
  const [bracketData, setBracketData] = useState<any>(null);

  // משיכת הנתונים בזמן אמת מהשרת בעת טעינת העמוד
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/tournament-status')
      .then(res => res.json())
      .then(data => setBracketData(data))
      .catch(err => console.error("Error fetching bracket:", err));
  }, []);

  // מסך טעינה בזמן שהנתונים מגיעים
  if (!bracketData) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-gray-200 flex flex-col overflow-hidden selection:bg-amber-500/30">

      {/* תפריט ניווט עליון */}
      <nav className="shrink-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 relative z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white">
              PLAYOFF<span className="text-amber-500">PREDICT</span>
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-indigo-400 border border-indigo-500/30 px-5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-all uppercase tracking-widest"
          >
            Back to Terminal
          </button>
        </div>
      </nav>

      {/* גוף העץ המרכזי - התאמה מלאה לרוחב המסך ללא גלילה */}
      <main className="flex-1 w-full flex items-center justify-center px-4 relative">

        {/* אפקטי תאורת רקע עמוקים לאווירה יוקרתית */}
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[150px] pointer-events-none -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] pointer-events-none -translate-y-1/2"></div>

        <div className="flex w-full max-w-[1750px] h-[78vh] justify-between items-center relative z-10">

          {/* === צד שמאל: קונפרנס מערב === */}
          {/* סיבוב 1 - מערב */}
          <div className="flex-1 flex flex-col justify-around h-full py-2">
            {bracketData.west.r1.map((m: any, i: number) => (
              <MatchupNode key={i} team1={m.t1} team2={m.t2} />
            ))}
          </div>

          {/* קווים מקשרים סיבוב 1 -> 2 */}
          <div className="w-8 h-full"><SVGConnector type="W1" /></div>

          {/* חצי גמר אזורי - מערב */}
          <div className="flex-1 flex flex-col justify-around h-[62%] py-2">
            {bracketData.west.r2.map((m: any, i: number) => (
              <MatchupNode key={i} team1={m.t1} team2={m.t2} />
            ))}
          </div>

          {/* קווים מקשרים חצי גמר -> גמר אזורי */}
          <div className="w-8 h-full"><SVGConnector type="W2" /></div>

          {/* גמר אזורי - מערב */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <MatchupNode team1={bracketData.west.r3[0].t1} team2={bracketData.west.r3[0].t2} />
          </div>

          {/* קו מקשר גמר אזורי -> גמר ה-NBA */}
          <div className="w-8 h-full"><SVGConnector type="W3" /></div>

          {/* === עמודה מרכזית: כותרות וגמר ה-NBA === */}
          <div className="flex flex-col items-center justify-center w-[280px] h-full relative px-2">

            {/* הכותרת מיושרת ומקבילה במדויק ישירות מעל קוביית הגמר */}
            <div className="absolute top-[4%] text-center w-full select-none">
              <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                Tournament Bracket
              </h2>
              <p className="text-amber-500 text-[10px] font-black tracking-[0.3em] uppercase mt-1">
                2026 Live Standings
              </p>
            </div>

            {/* קוביית אליפות העולם בגמר ה-NBA */}
            <div className="mt-16 w-full flex justify-center">
              <MatchupNode
                team1={bracketData.finals.t1}
                team2={bracketData.finals.t2}
                isFinals={true}
                title="World Championship"
              />
            </div>
          </div>

          {/* === צד ימין: קונפרנס מזרח === */}
          {/* קו מקשר גמר ה-NBA <- גמר אזורי */}
          <div className="w-8 h-full"><SVGConnector type="E3" /></div>

          {/* גמר אזורי - מזרח */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <MatchupNode team1={bracketData.east.r3[0].t1} team2={bracketData.east.r3[0].t2} />
          </div>

          {/* קווים מקשרים גמר אזורי <- חצי גמר */}
          <div className="w-8 h-full"><SVGConnector type="E2" /></div>

          {/* חצי גמר אזורי - מזרח */}
          <div className="flex-1 flex flex-col justify-around h-[62%] py-2">
            {bracketData.east.r2.map((m: any, i: number) => (
              <MatchupNode key={i} team1={m.t1} team2={m.t2} />
            ))}
          </div>

          {/* קווים מקשרים חצי גמר <- סיבוב 1 */}
          <div className="w-8 h-full"><SVGConnector type="E1" /></div>

          {/* סיבוב 1 - מזרח */}
          <div className="flex-1 flex flex-col justify-around h-full py-2">
            {bracketData.east.r1.map((m: any, i: number) => (
              <MatchupNode key={i} team1={m.t1} team2={m.t2} />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}