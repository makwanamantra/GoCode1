import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Lock, Clock, CheckCircle2, XCircle, Download, Loader2 } from 'lucide-react';
import { apiGet, apiPost, API_BASE } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config/brand';

/**
 * Resume access for signed-in users. The file itself is only reachable after
 * the admin approves the request — the backend blocks unapproved downloads.
 */
export default function ResumeDownloadCard() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const res = await apiGet('resume-requests/my-status/', { requester: user.id });
    if (res) setState(res);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const requestAccess = async () => {
    setBusy(true);
    await apiPost('resume-requests/', { requester: user.id, reason });
    await refresh();
    setBusy(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Resume is protected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create an account or sign in above, then request access. The {BRAND.name} admin approves each download.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const req = state?.request;
  const status = req?.status || 'NONE';

  const badge = {
    NONE: { icon: Lock, text: 'Not requested', cls: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
    PENDING: { icon: Clock, text: 'Awaiting admin approval', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    APPROVED: { icon: CheckCircle2, text: 'Approved', cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    REJECTED: { icon: XCircle, text: 'Declined by admin', cls: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  }[status];
  const BadgeIcon = badge.icon;

  return (
    <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Download the {BRAND.name} resume</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Access is granted per person by the admin.
          </p>
        </div>
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${badge.cls}`}>
        <BadgeIcon className="w-3.5 h-3.5" /> {badge.text}
      </div>

      {status === 'NONE' && (
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why do you need the resume? (optional)"
            className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={requestAccess}
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Request download access
          </button>
        </div>
      )}

      {status === 'PENDING' && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          The admin has been emailed about your request. You will be able to download as soon as it is approved.
        </p>
      )}

      {status === 'REJECTED' && (
        <p className="text-xs text-rose-500 font-medium">
          {req?.admin_note || 'The admin declined this request.'} Contact {BRAND.email} for another look.
        </p>
      )}

      {status === 'APPROVED' && (
        state?.can_download ? (
          <a
            href={`${API_BASE}/resume-download/${req.id}/`}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download resume
          </a>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Approved — the admin has not uploaded a resume file yet.
          </p>
        )
      )}
    </div>
  );
}
