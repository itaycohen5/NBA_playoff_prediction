'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.user_id);
        router.push('/dashboard');
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0b1120]">
      <div className="flex w-full max-w-5xl h-[600px] bg-[#111827] rounded-3xl shadow-2xl overflow-hidden border border-white/5">

        {/* צד שמאל - טופס */}
        <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400 text-sm">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1f2937] border border-transparent rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1f2937] border border-transparent rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-70 mt-4 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8 font-medium">
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* צד ימין - ויזואל */}
        <div className="hidden md:flex md:w-1/2 bg-[#0f172a] items-center justify-center relative border-l border-white/5">
          <div className="absolute w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
          <div className="text-center z-10 px-12">
            <h2 className="text-4xl font-black text-white mb-4">NBA Playoff Predictor</h2>
            <p className="text-indigo-300 font-medium">Predict the future, win the game.</p>
          </div>
        </div>

      </div>
    </div>
  );
}