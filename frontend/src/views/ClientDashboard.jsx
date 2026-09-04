import React, { useState } from 'react';
import { Briefcase, CreditCard, RefreshCw, MessageSquare, Plus, CheckCircle, Video, Download, Star, Clock, AlertTriangle } from 'lucide-react';

export default function ClientDashboard({
  customRequests,
  projects,
  deliverables,
  onAcceptAdminOffer,
  onPayAdvance,
  onCancelProject,
  onEditBudget,
  onOpenCustomRequestModal,
  onOpenChat,
  onPreviewVideo
}) {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl glass-panel bg-gradient-to-r from-indigo-900 via-violet-950 to-indigo-900 text-white shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
            <Briefcase className="w-4 h-4" />
            <span>CLIENT CONTROL HUB</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">Acme Global Corp</h1>
          <p className="text-sm text-slate-200 mt-1">
            Track active projects, pay 30% advance deposits, manage 5-day order cancellations, watch developer demo videos, and chat with your team.
          </p>
        </div>

        <button
          onClick={onOpenCustomRequestModal}
          className="px-6 py-3.5 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 font-extrabold text-xs shadow-xl active:scale-95 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Project Request</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Custom Requests ({customRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('deliverables')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'deliverables'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Deliverables & Demo Videos
        </button>
      </div>

      {/* TAB 1: Active Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(project => (
              <div key={project.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    project.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    Total: ${project.total_budget}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{project.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{project.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Project Progress</span>
                    <span>{project.status === 'COMPLETED' ? '100%' : project.advance_paid ? '65%' : '20%'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: project.status === 'COMPLETED' ? '100%' : project.advance_paid ? '65%' : '20%' }}
                    />
                  </div>
                </div>

                {/* 30% Advance Deposit Gateway Bar */}
                {!project.advance_paid && project.status !== 'CANCELLED' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">30% Advance Required to Start</span>
                      <div className="text-sm font-extrabold text-amber-900 dark:text-amber-100">${project.advance_amount}</div>
                    </div>
                    <button
                      onClick={() => onPayAdvance(project.id)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow flex items-center space-x-1"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay 30% Advance</span>
                    </button>
                  </div>
                )}

                {/* 5-Day Cancellation Rule & Chat Actions */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <button
<<<<<<< HEAD
                    onClick={() => onOpenChat(project)}
=======
                    onClick={() => onOpenChat(project.title)}
>>>>>>> 6d0e7a91a3a313c6eaf65e02dca23891615345ea
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 flex items-center space-x-1"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Project Chat</span>
                  </button>

                  {project.status !== 'CANCELLED' && project.status !== 'COMPLETED' && (
                    <button
                      onClick={() => onCancelProject(project.id)}
                      className="px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold hover:bg-red-200 transition-colors"
                      title="Cancel project within 5 days for full refund"
                    >
                      Cancel Order (5-Day Refund Window)
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Custom Requests */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customRequests.map(req => (
            <div key={req.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {req.category}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                  {req.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{req.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{req.description}</p>

              <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>My Budget: <span className="font-bold text-slate-900 dark:text-white">${req.user_budget}</span></div>
                {req.admin_proposed_price && (
                  <div className="text-indigo-600 font-bold">Admin Offer: ${req.admin_proposed_price}</div>
                )}
              </div>

              {req.status === 'ADMIN_OFFER' && (
                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => onAcceptAdminOffer(req.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept Offer & Initialize Project</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Deliverables & Video Demos */}
      {activeTab === 'deliverables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliverables.map(d => (
            <div key={d.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Submitted by Developer: {d.uploaded_by_name || 'Alex Rivera'}
              </span>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>

              {d.video_demo_url && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
                  <video src={d.video_demo_url} controls className="w-full h-full object-cover" />
                </div>
              )}

              {d.code_url && (
                <a
                  href={d.code_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 underline"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Deliverable Code Package</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
