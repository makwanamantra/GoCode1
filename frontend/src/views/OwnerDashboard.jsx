import React, { useMemo, useState } from 'react';
import AdminUserLogsPanel from './AdminUserLogsPanel';
import AdminVisitorLogsPanel from './AdminVisitorLogsPanel';
import AdminEmailSettingsPanel from './AdminEmailSettingsPanel';
import { DollarSign, TrendingUp, Users, CheckCircle, Clock, AlertTriangle, Plus, ShieldCheck, Video, Send, FileText, Check, X, Award, Search } from 'lucide-react';

export default function OwnerDashboard({
  analytics,
  customRequests,
  projects,
  tasks,
  deliverables,
  employees,
  auditLogs,
  onAdminRespondRequest,
  onAssignTask,
  onApproveCompletion,
  onOpenChat,
  onAddTemplateModal
}) {
  const [activeTab, setActiveTab] = useState('requests');
  const [auditSearch, setAuditSearch] = useState('');

  // Task creation form state
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 1);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskRole, setTaskRole] = useState('FRONTEND');
  const [assignedEmpId, setAssignedEmpId] = useState(employees[0]?.id || 1);
  const [taskPayout, setTaskPayout] = useState(800);

  // Admin offer modal state for custom requests
  const [respondingReq, setRespondingReq] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDate, setOfferDate] = useState('');

  // Client-side search across the system audit trail.
  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter((log) =>
      `${log.action || ''} ${log.details || ''} ${log.actor_name || ''}`.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAssignTask({
      project: selectedProjectId,
      assigned_employee: assignedEmpId,
      role_type: taskRole,
      title: taskTitle,
      description: taskDesc,
      payout: parseFloat(taskPayout),
      status: 'TO_DO'
    });
    setTaskTitle('');
    setTaskDesc('');
  };

  const handleRespondSubmit = (e) => {
    e.preventDefault();
    if (!respondingReq || !offerPrice || !offerDate) return;
    onAdminRespondRequest(respondingReq.id, offerPrice, offerDate, 'OFFER');
    setRespondingReq(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl glass-panel bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>EXECUTIVE OWNER & ADMIN PANEL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">Agency Management Hub</h1>
          <p className="text-sm text-slate-300 mt-1">
            Approve client custom requests, subdivide developer tasks, verify video proofs, and track profit analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onAddTemplateModal}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Template</span>
          </button>
        </div>
      </div>

      {/* Financial Profit Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>TOTAL GROSS REVENUE</span>
            <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ${analytics?.total_gross_revenue?.toLocaleString() || '12,859'}
          </div>
          <div className="text-[11px] font-semibold text-emerald-500 mt-1">
            ↑ Includes 30% advance & final payouts
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>DEVELOPER PAYOUTS</span>
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
            ${analytics?.total_developer_payouts?.toLocaleString() || '6,300'}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            Distributed across dev task completions
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>NET AGENCY PROFIT</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ${analytics?.net_agency_profit?.toLocaleString() || '6,559'}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Calculated Net Agency Margin
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {['requests', 'task-division', 'deliverables', 'employee-rankings', 'user-logs', 'visitor-logs', 'email-and-resume', 'audit-logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {/* TAB 1: Custom Client Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Custom Client Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customRequests.map(req => (
              <div key={req.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {req.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{req.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{req.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>Client Budget: <span className="font-bold text-slate-900 dark:text-white">${req.user_budget}</span></div>
                  {req.admin_proposed_price && (
                    <div className="text-indigo-600 dark:text-indigo-400 font-bold">Admin Offer: ${req.admin_proposed_price}</div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => onOpenChat(req)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                  >
                    Chat & Negotiate Budget
                  </button>

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setRespondingReq(req);
                        setOfferPrice(req.user_budget);
                        setOfferDate('2026-08-25');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md"
                    >
                      Offer Price & Target Date
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Task Division among Developers */}
      {activeTab === 'task-division' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create & Divide Task Form */}
          <div className="lg:col-span-1 p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Divide Task for Developer</span>
            </h2>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Developer Sub-Role</label>
                <select
                  value={taskRole}
                  onChange={(e) => setTaskRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="FRONTEND">Frontend Developer (React / Three.js)</option>
                  <option value="BACKEND">Backend Developer (Django REST / DB)</option>
                  <option value="UIUX">UI/UX Designer (Codrops Motion / Figma)</option>
                  <option value="DEVOPS">DevOps Engineer (Deploy / Infrastructure)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign Developer</label>
                <select
                  value={assignedEmpId}
                  onChange={(e) => setAssignedEmpId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.username} ({e.profile?.sub_role || 'Developer'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Build WebGL Shader Pipeline"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payout Amount ($)</label>
                <input
                  type="number"
                  value={taskPayout}
                  onChange={(e) => setTaskPayout(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Assign Task to Developer
              </button>
            </form>
          </div>

          {/* Divided Tasks List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Divided Tasks</h2>
            <div className="space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="p-4 rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                        {t.role_type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Assigned to: <span className="font-semibold text-slate-800 dark:text-slate-200">{t.assigned_employee_name || 'Alex Rivera'}</span></p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">${t.payout}</div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: Deliverables & Owner Final Approval */}
      {activeTab === 'deliverables' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Developer Deliverables & Video Proofs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliverables.map(d => (
              <div key={d.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Uploaded by: {d.uploaded_by_name || 'Developer'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                    {d.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>

                {/* Embedded Video Demo Proof */}
                {d.video_demo_url && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
                    <video src={d.video_demo_url} controls className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  {d.code_url && (
                    <a
                      href={d.code_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-indigo-600 underline"
                    >
                      View GitHub Source Code
                    </a>
                  )}

                  <button
                    onClick={() => onApproveCompletion(d.project)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Final & Release Payouts</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Employee Profit Leaderboard */}
      {activeTab === 'employee-rankings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Top Performing Developer Profit Leaderboard</h2>
          <div className="space-y-4">
            {(analytics?.employee_rankings || [
              { username: 'alex_frontend', sub_role: 'FRONTEND', total_earned: 4200, completed_tasks_count: 5 },
              { username: 'sarah_backend', sub_role: 'BACKEND', total_earned: 5800, completed_tasks_count: 7 },
              { username: 'david_uiux', sub_role: 'UIUX', total_earned: 3900, completed_tasks_count: 4 }
            ]).map((emp, index) => (
              <div key={index} className="p-5 rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{emp.username}</h4>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{emp.sub_role}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">${emp.total_earned}</div>
                  <div className="text-xs text-slate-500 font-medium">{emp.completed_tasks_count} Tasks Completed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: User & Developer Logs */}
      {activeTab === 'user-logs' && <AdminUserLogsPanel />}

      {activeTab === 'visitor-logs' && <AdminVisitorLogsPanel />}

      {activeTab === 'email-and-resume' && <AdminEmailSettingsPanel />}

      {/* TAB 6: Audit Logs */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Security & Action Audit Logs</h2>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit actions or details…"
                className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredAuditLogs.length === 0 && (
              <p className="text-xs text-slate-500 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                No audit entries match your search.
              </p>
            )}
            {filteredAuditLogs.map((log, idx) => (
              <div key={idx} className="p-4 rounded-xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">[{log.action}]</span>
                  <span className="ml-2 text-slate-700 dark:text-slate-300">{log.details}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Offer Modal */}
      {respondingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-panel bg-white dark:bg-slate-900 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Offer Price & Predicted Date</h3>
            <form onSubmit={handleRespondSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold">Proposed Price ($)</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="text-xs font-bold">Predicted Delivery Date</label>
                <input
                  type="date"
                  value={offerDate}
                  onChange={(e) => setOfferDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingReq(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow"
                >
                  Send Offer to Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
