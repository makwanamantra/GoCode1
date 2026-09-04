import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Save, Loader2, CheckCircle2, XCircle, Search, Clock, FileText } from 'lucide-react';
import { apiGet, apiPost, fetchFromAPI, asList } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

/**
 * Admin control centre for:
 *  - the mailbox that receives visitor / signup / login alerts (never the
 *    public contact address unless the admin types it in deliberately)
 *  - approving or rejecting resume download requests
 */
export default function AdminEmailSettingsPanel() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');

  const loadSettings = useCallback(async () => {
    const res = await apiGet('site-settings/');
    if (res) setSettings(res);
  }, []);

  const loadRequests = useCallback(async () => {
    const res = await apiGet('resume-requests/', { search: search.trim() });
    setRequests(asList(res) || []);
  }, [search]);

  useEffect(() => { loadSettings(); }, [loadSettings]);
  useEffect(() => {
    const t = setTimeout(loadRequests, 250);
    return () => clearTimeout(t);
  }, [loadRequests]);

  const update = (key) => (e) =>
    setSettings((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetchFromAPI('site-settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    if (res) {
      setSettings(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const review = async (id, decision) => {
    await apiPost(`resume-requests/${id}/${decision}/`, { actor_id: user?.id });
    loadRequests();
  };

  const inputCls =
    'w-full mt-1 px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Admin alert mailbox</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Every visitor, signup, login and resume request is emailed here with full details.
              Public contact stays {BRAND.email}.
            </p>
          </div>
        </div>

        {!settings ? (
          <p className="text-xs text-slate-500">Loading settings…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Send all activity alerts to
                </label>
                <input
                  type="email"
                  value={settings.admin_notification_email || ''}
                  onChange={update('admin_notification_email')}
                  placeholder="your-private-inbox@example.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Public email</label>
                <input type="email" value={settings.public_email || ''} onChange={update('public_email')} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Public phone</label>
                <input type="text" value={settings.public_phone || ''} onChange={update('public_phone')} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['notify_on_visitor', 'Email me about new website visitors'],
                ['notify_on_signup', 'Email me about new signups'],
                ['notify_on_login', 'Email me about every login'],
                ['notify_on_resume_request', 'Email me about resume download requests'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <input type="checkbox" checked={Boolean(settings[key])} onChange={update(key)} className="accent-indigo-600" />
                  {label}
                </label>
              ))}
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save settings'}
            </button>
          </>
        )}
      </div>

      <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Resume download approvals</h3>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests by user, email or reason…"
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          {requests.length === 0 && (
            <p className="text-xs text-slate-500 font-medium">No resume download requests yet.</p>
          )}
          {requests.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {r.requester_name}
                  <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    r.status === 'APPROVED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                      : r.status === 'REJECTED' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {r.requester_email || 'no email'} · {r.reason || 'no reason given'}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {fmt(r.created_at)} · {r.download_count} download(s)
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => review(r.id, 'approve')}
                  disabled={r.status === 'APPROVED'}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => review(r.id, 'reject')}
                  disabled={r.status === 'REJECTED'}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
