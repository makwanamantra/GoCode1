import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { ShieldCheck, UserCheck, Briefcase, LogIn, Loader2, Sparkles } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

const ROLE_META = {
  OWNER: { icon: ShieldCheck, tint: 'from-indigo-600 to-violet-600', copy: 'Full agency control: requests, task division, payouts, user & developer logs.' },
  EMPLOYEE: { icon: UserCheck, tint: 'from-cyan-600 to-blue-600', copy: 'Your assigned tasks, delivery pipeline, video proofs and personal earnings.' },
  CLIENT: { icon: Briefcase, tint: 'from-amber-500 to-orange-600', copy: 'Your projects, deposits, deliverables and direct line to the studio.' },
};

export default function LoginView() {
  const { login, pending, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!cardsRef.current) return;
    animate(cardsRef.current.querySelectorAll('[data-anim-card]'), {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 700,
      delay: stagger(90),
      ease: 'outExpo',
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8" ref={cardsRef}>

        {/* Sign-in card */}
        <div
          data-anim-card
          className="p-8 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign in to codemantra</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Admins, developers and clients each get their own workspace.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="owner_admin"
                className="w-full mt-1 px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full mt-1 px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{pending ? 'Signing in…' : 'Sign in'}</span>
            </button>
          </form>
        </div>

        {/* About Me */}
<div
  data-anim-card
  className="p-8 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center h-full"
>
  <div className="flex items-center space-x-3 mb-6">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
      <Sparkles className="w-6 h-6" />
    </div>

    <div>
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
        Thanks for Visiting
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Open to Work
      </p>
    </div>
  </div>

  <div className="space-y-4">
    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
      Hi, I'm
      <span className="font-bold text-indigo-600 dark:text-indigo-400">
        {" "}Mantra Makwana
      </span>.
    </p>

    <p className="text-sm text-slate-600 dark:text-slate-400 leading-7">
      I'm a Full Stack Developer passionate about building modern,
      responsive, and scalable web applications using React, Node.js,
      Express, MongoDB, and Tailwind CSS.
    </p>

    <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
      <h3 className="font-bold text-lg">
        🚀 Available for Opportunities
      </h3>
      <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
        Thank you for visiting my portfolio. I'm currently open to
        internships, freelance projects, and full-time software
        development opportunities.
      </p>
    </div>

    <div className="flex flex-wrap gap-2 pt-2">
      <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
        React
      </span>
      <span className="px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-semibold">
        Node.js
      </span>
      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
        MongoDB
      </span>
      <span className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold">
        Tailwind CSS
      </span>
    </div>
  </div>
</div>
      
      </div>
    </div>
  );
}
