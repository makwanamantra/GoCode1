import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import {
  ShieldCheck, UserCheck, Briefcase, LogIn, Loader2, UserPlus, Mail, Phone,
  AlertTriangle, CheckCircle2, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { API_BASE, pingApi } from '../services/apiService';
import { BRAND } from '../config/brand';

const ROLE_META = {
  OWNER: { icon: ShieldCheck, tint: 'from-indigo-600 to-violet-600', copy: 'Full control: requests, task division, payouts, visitor & developer logs.' },
  EMPLOYEE: { icon: UserCheck, tint: 'from-cyan-600 to-blue-600', copy: 'Your assigned tasks, delivery pipeline, video proofs and personal earnings.' },
  CLIENT: { icon: Briefcase, tint: 'from-amber-500 to-orange-600', copy: 'Your projects, deposits, deliverables and a direct line to the studio.' },
};

/**
 * Home-page authentication panel: sign in and sign up side by side.
 * Shows the live API endpoint plus a reachability badge, so a broken
 * Vercel -> Render connection is obvious instead of silent.
 */
export default function AuthPanel() {
  const { login, register, pending, error, notice, clearMessages } = useAuth();
  const [mode, setMode] = useState('login');
  const [apiUp, setApiUp] = useState(null); // null = checking
  const [form, setForm] = useState({
    username: '', password: '', email: '', full_name: '', phone: '', company: '',
  });
  const rootRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let alive = true;
    pingApi().then((ok) => { if (alive) setApiUp(ok); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    animate(rootRef.current.querySelectorAll('[data-anim-card]'), {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 700,
      delay: stagger(90),
      ease: 'outExpo',
    });
  }, [mode]);

  const switchMode = (m) => { clearMessages(); setMode(m); };

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    if (mode === 'login') {
      await login(form.username, form.password);
    } else {
      const res = await register({
        username: form.username,
        password: form.password,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone,
        company: form.company,
      });
      if (res.ok) setForm((f) => ({ ...f, password: '' }));
    }
  };

  const inputCls =
    'w-full mt-1 px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <section id="auth" className="px-4 py-16 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8" ref={rootRef}>

        <div
          data-anim-card
          className="p-8 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6"
        >
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Sign in to ' : 'Join '}
              <span className="text-gradient">{BRAND.name}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Admins, developers and clients each land in their own workspace.
            </p>
          </div>

          {/* Connection badge — makes a misconfigured API base impossible to miss. */}
          <div
            className={`flex items-start gap-2 text-[11px] font-semibold rounded-xl px-3 py-2 border ${
              apiUp === false
                ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 bg-slate-500/5 border-slate-500/15'
            }`}
          >
            {apiUp === false ? <WifiOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              : <Wifi className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            <span className="break-all">
              {apiUp === null ? 'Checking server…'
                : apiUp ? 'Server connected · ' : 'Server unreachable · '}
              <span className="font-mono">{API_BASE}</span>
              {apiUp === false && ' — set VITE_API_BASE on Vercel and redeploy.'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="auth-username" className="text-xs font-bold text-slate-700 dark:text-slate-300">Username</label>
              <input id="auth-username" name="username" type="text" required
                value={form.username} onChange={set('username')}
                autoComplete="username" placeholder="your_handle" className={inputCls} />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">Full name</label>
                  <input id="auth-name" name="name" type="text" value={form.full_name} onChange={set('full_name')}
                    autoComplete="name" placeholder="Jane Doe" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="auth-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
                  <input id="auth-email" name="email" type="email" value={form.email} onChange={set('email')}
                    autoComplete="email" placeholder="you@company.com" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
                    <input id="auth-phone" name="tel" type="tel" value={form.phone} onChange={set('phone')}
                      autoComplete="tel" placeholder="Optional" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="auth-company" className="text-xs font-bold text-slate-700 dark:text-slate-300">Company</label>
                    <input id="auth-company" name="organization" type="text" value={form.company} onChange={set('company')}
                      autoComplete="organization" placeholder="Optional" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <input id="auth-password" name="password" type="password" required
                value={form.password} onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••" className={inputCls} />
              {mode === 'signup' && (
                <p className="mt-1 text-[11px] text-slate-500">Minimum 6 characters.</p>
              )}
            </div>

            {error && (
              <p className="flex items-start gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            {notice && !error && (
              <p className="flex items-start gap-2 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{notice}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create my account'}</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
              <Mail className="w-3.5 h-3.5" /> {BRAND.email}
            </a>
            <a href={BRAND.phoneHref} className="flex items-center gap-1.5 hover:text-indigo-600">
              <Phone className="w-3.5 h-3.5" /> {BRAND.phone}
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Explore a workspace instantly
          </p>
          {DEMO_ACCOUNTS.map((acc) => {
            const meta = ROLE_META[acc.role];
            const Icon = meta.icon;
            return (
              <button
                key={acc.username}
                data-anim-card
                type="button"
                onClick={() => {
                  clearMessages();
                  setMode('login');
                  setForm((f) => ({ ...f, username: acc.username, password: acc.password }));
                }}
                className="w-full text-left p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.tint} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">{acc.label}</div>
                    <div className="text-[11px] font-mono text-slate-500">{acc.username}  {acc.password}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">{meta.copy}</p>
              </button>
            );
          })}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
             <span className="font-mono"></span> 
           
          </p>
        </div>
      </div>
    </section>
  );
}
