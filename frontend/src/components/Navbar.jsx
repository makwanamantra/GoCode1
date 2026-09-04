import React from 'react';
import { Sparkles, Sun, Moon, ShieldCheck, UserCheck, Briefcase, LayoutGrid, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Views each role is allowed to open. Roles never see each other's workspace. */
const ROLE_VIEWS = {
  OWNER: [
    { key: 'landing', label: 'Templates & Home', icon: LayoutGrid },
    { key: 'owner', label: 'Owner / Admin', icon: ShieldCheck },
  ],
  EMPLOYEE: [
    { key: 'landing', label: 'Templates & Home', icon: LayoutGrid },
    { key: 'employee', label: 'My Developer Desk', icon: UserCheck },
  ],
  CLIENT: [
    { key: 'landing', label: 'Templates & Home', icon: LayoutGrid },
    { key: 'client', label: 'Client Workspace', icon: Briefcase },
  ],
};

const ROLE_BADGE = {
  OWNER: 'Admin',
  EMPLOYEE: 'Developer',
  CLIENT: 'Client',
};

export default function Navbar({ activeView, setActiveView, darkMode, setDarkMode, onOpenCustomRequestModal }) {
  const { user, role, isAuthenticated, isClient, logout } = useAuth();
  const views = ROLE_VIEWS[role] || [];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Brand */}
        <div
          onClick={() => isAuthenticated && setActiveView('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                Go<span className="text-gradient">Code</span>
              </span>
              {role && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {ROLE_BADGE[role]}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Project Builder</p>
          </div>
        </div>

        {/* Role-scoped tabs */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
            {views.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setActiveView(v.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeView === v.key
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Tools */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && isClient && (
            <button
              onClick={onOpenCustomRequestModal}
              className="hidden lg:flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request Custom Project</span>
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.full_name || user.username}
                </div>
                <div className="text-[10px] text-slate-500">@{user.username}</div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
