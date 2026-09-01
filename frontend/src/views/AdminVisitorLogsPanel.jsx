import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronDown, ChevronRight, Globe, Monitor, Clock, MapPin, RefreshCw, Users,
} from 'lucide-react';
import { apiGet, asList } from '../services/apiService';

const fmt = (value) => (value ? new Date(value).toLocaleString() : '—');

/**
 * Admin console listing EVERY person who opened the site, anonymous visitors
 * included. Rows expand into the full per-visit timeline and are searchable.
 */
export default function AdminVisitorLogsPanel() {
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiGet('visitors/', { search: search.trim() });
    setVisitors(asList(res) || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const rows = useMemo(() => {
    if (filter === 'ALL') return visitors;
    if (filter === 'VISITOR') return visitors.filter((v) => !v.user);
    return visitors.filter((v) => v.role === filter);
  }, [visitors, filter]);

  const totals = useMemo(() => ({
    people: visitors.length,
    anonymous: visitors.filter((v) => !v.user).length,
    views: visitors.reduce((sum, v) => sum + (v.visit_count || 0), 0),
  }), [visitors]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tracked people', value: totals.people, icon: Users },
          { label: 'Anonymous visitors', value: totals.anonymous, icon: Globe },
          { label: 'Total page views', value: totals.views, icon: Monitor },
        ].map((card) => (
          <div key={card.label} className="p-5 rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <card.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{card.value}</div>
            <div className="text-xs font-semibold text-slate-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitors by name, email, IP, page or referrer…"
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 text-sm font-semibold rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
        >
          <option value="ALL">Everyone</option>
          <option value="VISITOR">Anonymous only</option>
          <option value="OWNER">Admins</option>
          <option value="EMPLOYEE">Developers</option>
          <option value="CLIENT">Clients</option>
        </select>
        <button
          onClick={load}
          className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 font-medium">
            No visitors recorded yet. They appear here the moment someone opens the site.
          </p>
        )}

        {rows.map((v) => {
          const open = expanded === v.id;
          return (
            <div key={v.id}>
              <button
                onClick={() => setExpanded(open ? null : v.id)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                {open ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {v.display_name}
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {v.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {v.email || 'no email'} · {v.ip_address || 'unknown IP'} · {v.path || '/'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{v.visit_count}</div>
                  <div className="text-[10px] font-semibold text-slate-500">visits</div>
                </div>
              </button>

              {open && (
                <div className="px-6 pb-5 space-y-4 bg-slate-50 dark:bg-slate-950/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                    {[
                      ['First seen', fmt(v.first_seen), Clock],
                      ['Last seen', fmt(v.last_seen), Clock],
                      ['Device', `${v.device || 'Unknown'} · ${v.screen || '—'}`, Monitor],
                      ['Locale', `${v.language || '—'} · ${v.timezone_name || '—'}`, MapPin],
                    ].map(([label, value, Icon]) => (
                      <div key={label} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          <Icon className="w-3 h-3" /> {label}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-white break-words">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 break-words">
                    <strong className="text-slate-700 dark:text-slate-300">Referrer:</strong> {v.referrer || 'direct'}
                    <br />
                    <strong className="text-slate-700 dark:text-slate-300">User agent:</strong> {v.user_agent || 'unknown'}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      Visit timeline ({(v.events || []).length})
                    </p>
                    <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                      {(v.events || []).map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {ev.event_type} · {ev.path || '/'}
                          </span>
                          <span className="text-slate-500 shrink-0 ml-3">{fmt(ev.occurred_at)}</span>
                        </div>
                      ))}
                      {(v.events || []).length === 0 && (
                        <p className="text-xs text-slate-500">No individual events recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
