import React, { useState } from 'react';
import { UserCheck, CheckCircle2, Upload, Video, Code, MessageSquare, DollarSign, Award, Clock } from 'lucide-react';

export default function EmployeeDashboard({
  tasks,
  deliverables,
  onUpdateTaskStatus,
  onSubmitDeliverable,
  onOpenChat
}) {
  // Upload Deliverable Form State
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || 1);
  const [delivTitle, setDelivTitle] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://assets.mixkit.co/videos/preview/mixkit-cyber-monday-shopping-animation-41484-large.mp4');

  const handleDeliverableSubmit = (e) => {
    e.preventDefault();
    if (!delivTitle) return;
    const taskObj = tasks.find(t => t.id === parseInt(selectedTaskId)) || tasks[0];
    onSubmitDeliverable({
      task: selectedTaskId,
      project: taskObj?.project || 1,
      title: delivTitle,
      code_url: codeUrl,
      video_demo_url: videoUrl,
      status: 'SUBMITTED'
    });
    setDelivTitle('');
    setCodeUrl('');
  };

  const totalEarned = tasks
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + parseFloat(t.payout || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl glass-panel bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
            <UserCheck className="w-4 h-4" />
            <span>DEVELOPER WORKBENCH & PERSONAL DASHBOARD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">Alex Rivera (Frontend Engineer)</h1>
          <p className="text-sm text-slate-300 mt-1">
            View assigned tasks, update build pipeline, upload demo videos of completed work, and track personal earnings.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] font-bold text-slate-300 uppercase">Personal Earnings</span>
            <div className="text-2xl font-black text-emerald-400">${totalEarned + 4200}</div>
          </div>
          <Award className="w-8 h-8 text-amber-400" />
        </div>
      </div>

      {/* Grid: Tasks & Deliverable Submit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: My Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>My Assigned Tasks & Status Pipeline</span>
          </h2>

          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {task.role_type || 'FRONTEND'}
                  </span>
                  <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    Payout: ${task.payout}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{task.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                </div>

                {/* Status Updater Radio Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'].map(st => (
                      <button
                        key={st}
                        onClick={() => onUpdateTaskStatus(task.id, st)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                          task.status === st
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onOpenChat(task.title)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    title="Chat with Admin & Client"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Upload Video & Code Deliverable Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Submit Video & Code Proof</span>
            </h2>

            <form onSubmit={handleDeliverableSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Completed Task</label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deliverable Title</label>
                <input
                  type="text"
                  placeholder="e.g. 3D R3F Particle Node Engine v1.0"
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GitHub Repository / File URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/agency/repo"
                  value={codeUrl}
                  onChange={(e) => setCodeUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Video Demo URL (Video Proof)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Video className="w-4 h-4" />
                <span>Upload Deliverable for Owner Approval</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
