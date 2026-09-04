import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import {
  Search, ChevronDown, ChevronRight, Clock, Monitor, Globe, FileText,
  Upload, RefreshCw, ExternalLink, Loader2, ShieldCheck, UserCheck, Briefcase, X
} from 'lucide-react';
import { apiGet, apiUpload, asList } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const ROLE_TABS = [
  { key: 'EMPLOYEE', label: 'Developer Logs', icon: UserCheck },
  { key: 'CLIENT', label: 'User / Client Logs', icon: Briefcase },
  { key: 'OWNER', label: 'Admin Logs', icon: ShieldCheck },
];

/** Offline sample data so the console still demonstrates behaviour without Django. */
function buildFallbackUsers(role) {
  const seeds = {
    EMPLOYEE: [
      ['alex_dev', 'Alex Rivera', 'FRONTEND'],
      ['sarah_backend', 'Sarah Chen', 'BACKEND'],
      ['david_uiux', 'David Vance', 'UIUX'],
      ['elena_fullstack', 'Elena Rostova', 'FULLSTACK'],
      ['marcus_devops', 'Marcus Vance', 'DEVOPS'],
    ],
    CLIENT: [
      ['john_client', 'John Smith', 'NONE'],
      ['lisa_client', 'Lisa Ray', 'NONE'],
    ],
    OWNER: [['owner_admin', 'Nadia Okafor', 'NONE']],
  }[role] || [];

  return seeds.map(([username, fullName, subRole], i) => ({
    id: 1000 + i,
    username,
    full_name: fullName,
    email: `${username}@agency.com`,
    login_count: 4 + i * 2,
    last_login_at: new Date(Date.now() - i * 36e5).toISOString(),
    profile: { role, sub_role: subRole, company: role === 'CLIENT' ? 'Acme Global Corp' : 'Aura Studio' },
    current_resume:
      role === 'EMPLOYEE'
        ? { id: 500 + i, version: 1, original_name: `${username}-resume.pdf`, file_url: '#', uploaded_at: new Date().toISOString(), uploaded_by_name: 'owner_admin' }
        : null,
  }));
}

function buildFallbackHistory(user) {
  const count = user.login_count || 5;
  return {
    login_count: count,
    history: Array.from({ length: count }).map((_, i) => ({
      id: `${user.id}-${i}`,
      login_time: new Date(Date.now() - i * 22 * 36e5).toISOString(),
      ip_address: `10.0.${i}.${20 + i}`,
      user_agent: i % 2 ? 'Mozilla/5.0 (Windows NT 10.0) Firefox/128.0' : 'Mozilla/5.0 (Macintosh) Chrome/126.0',
    })),
  };
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

export default function AdminUserLogsPanel() {
  const { user: adminUser } = useAuth();

  const [roleTab, setRoleTab] = useState('EMPLOYEE');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [historyById, setHistoryById] = useState({});
  const [loadingHistoryId, setLoadingHistoryId] = useState(null);

  const [resumeTarget, setResumeTarget] = useState(null);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  // Debounce the search field so typing does not hammer the API.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await apiGet('users/', { role: roleTab, search: debounced });
    const list = asList(res);
    if (list) {
      setUsers(list);
    } else {
      const fallback = buildFallbackUsers(roleTab).filter((u) => {
        if (!debounced) return true;
        const q = debounced.toLowerCase();
        return (
          u.username.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.profile.sub_role || '').toLowerCase().includes(q)
        );
      });
      setUsers(fallback);
    }
    setLoading(false);
  }, [roleTab, debounced]);

  useEffect(() => {
    loadUsers();
    setExpandedId(null);
  }, [loadUsers]);

  // Staggered reveal of result rows.
  useEffect(() => {
    if (!listRef.current || loading) return;
    const rows = listRef.current.querySelectorAll('[data-log-row]');
    if (!rows.length) return;
    animate(rows, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 480,
      delay: stagger(45),
      ease: 'outQuad',
    });
  }, [users, loading]);

  const toggleExpand = async (user) => {
    if (expandedId === user.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(user.id);

    if (!historyById[user.id]) {
      setLoadingHistoryId(user.id);
      const res = await apiGet(`users/${user.id}/login-history/`);
      setHistoryById((prev) => ({ ...prev, [user.id]: res || buildFallbackHistory(user) }));
      setLoadingHistoryId(null);
    }
  };

  const openResumeManager = async (user) => {
    setResumeTarget(user);
    setUploadNote('');
    const res = await apiGet(`users/${user.id}/resume/`);
    setResumeVersions(asList(res) || (user.current_resume ? [user.current_resume] : []));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !resumeTarget) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    if (adminUser?.id) form.append('actor_id', adminUser.id);
    if (uploadNote) form.append('notes', uploadNote);

    const res = await apiUpload(`users/${resumeTarget.id}/resume/`, form);
    if (res?.resume) {
      setResumeVersions((prev) => [res.resume, ...prev.map((r) => ({ ...r, is_current: false }))]);
      setUsers((prev) =>
        prev.map((u) => (u.id === resumeTarget.id ? { ...u, current_resume: res.resume } : u))
      );
    } else {
      // Offline optimistic version bump.
      const nextVersion = (resumeVersions[0]?.version || 0) + 1;
      const optimistic = {
        id: `local-${Date.now()}`,
        version: nextVersion,
        original_name: file.name,
        file_url: URL.createObjectURL(file),
        uploaded_at: new Date().toISOString(),
        uploaded_by_name: adminUser?.username || 'admin',
        notes: uploadNote,
        is_current: true,
      };
      setResumeVersions((prev) => [optimistic, ...prev.map((r) => ({ ...r, is_current: false }))]);
      setUsers((prev) =>
        prev.map((u) => (u.id === resumeTarget.id ? { ...u, current_resume: optimistic } : u))
      );
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalLogins = useMemo(
    () => users.reduce((acc, u) => acc + (u.login_count || 0), 0),
    [users]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">User & Developer Access Logs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search accounts, expand any row to see how many times they signed in and the exact login timestamps.
          </p>
        </div>
        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {users.length} accounts · {totalLogins} recorded logins
        </div>
      </div>

      {/* Role tabs + search */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setRoleTab(tab.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  roleTab === tab.key
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, email, company or sub-role…"
            className="w-full pl-11 pr-24 py-3 text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={loadUsers}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3" ref={listRef}>
        {!loading && users.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            No accounts match “{search}”.
          </div>
        )}

        {users.map((u) => {
          const expanded = expandedId === u.id;
          const detail = historyById[u.id];
          return (
            <div
              key={u.id}
              data-log-row
              className="rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => toggleExpand(u)}
                  className="flex items-center space-x-3 text-left min-w-0"
                  aria-expanded={expanded}
                >
                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {u.full_name || u.username}
                      </span>
                      {u.profile?.sub_role && u.profile.sub_role !== 'NONE' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                          {u.profile.sub_role}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      @{u.username} · {u.email || 'no email'}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                      {u.login_count ?? 0}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Logins</div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {formatDateTime(u.last_login_at)}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Last seen</div>
                  </div>
                  <button
                    onClick={() => openResumeManager(u)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{u.current_resume ? 'Re-upload resume' : 'Upload resume'}</span>
                  </button>
                </div>
              </div>

              {/* Expanded login history */}
              {expanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3 animate-fade-in">
                  {loadingHistoryId === u.id && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading login history…</span>
                    </div>
                  )}

                  {detail && (
                    <>
                      <div className="flex flex-wrap gap-4 text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          Total logins: <span className="text-indigo-600 dark:text-indigo-400 font-black">{detail.login_count}</span>
                        </span>
                        <span className="text-slate-500">First: {formatDateTime(detail.first_login || detail.history?.[detail.history.length - 1]?.login_time)}</span>
                        <span className="text-slate-500">Latest: {formatDateTime(detail.last_login || detail.history?.[0]?.login_time)}</span>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {(detail.history || []).map((h, idx) => (
                          <div
                            key={h.id ?? idx}
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDateTime(h.login_time)}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {h.ip_address || 'unknown'}
                              </span>
                              <span className="hidden md:flex items-center gap-1 max-w-[260px] truncate">
                                <Monitor className="w-3 h-3" />
                                {h.user_agent || 'unknown device'}
                              </span>
                              {h.logout_time && <span>Out: {formatDateTime(h.logout_time)}</span>}
                            </div>
                          </div>
                        ))}
                        {(detail.history || []).length === 0 && (
                          <p className="text-xs text-slate-500">No sign-ins recorded yet.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resume upload / re-upload drawer */}
      {resumeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Resume for {resumeTarget.full_name || resumeTarget.username}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Uploading again keeps the previous file as an earlier version.
                </p>
              </div>
              <button
                onClick={() => setResumeTarget(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                placeholder="Optional note (e.g. updated after promotion)"
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : resumeVersions.length ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                <span>{uploading ? 'Uploading…' : resumeVersions.length ? 'Re-upload resume' : 'Upload resume'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Version history</h4>
              {resumeVersions.length === 0 && (
                <p className="text-xs text-slate-500">No resume on file yet.</p>
              )}
              {resumeVersions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      v{r.version} · {r.original_name || 'resume'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formatDateTime(r.uploaded_at)} · by {r.uploaded_by_name || 'admin'}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </div>
                  </div>
                  {(r.file_url || r.external_url) && (
                    <a
                      href={r.file_url || r.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
