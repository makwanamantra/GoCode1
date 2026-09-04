import React, { useState } from 'react';
import { X, Send, Sparkles, DollarSign } from 'lucide-react';

export default function CustomRequestModal({ isOpen, onClose, onSubmitCustomRequest }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('3D WebGL');
  const [budget, setBudget] = useState(4500);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setError('');
    setSubmitting(true);
    const result = await onSubmitCustomRequest({
      title,
      category,
      user_budget: parseFloat(budget),
      description,
      status: 'PENDING'
    });
    setSubmitting(false);
    // Only close on a confirmed save — otherwise the client thinks the admin
    // received it when the request never actually left the browser.
    if (result?.ok) {
      onClose();
    } else {
      setError(result?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl glass-panel bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              CUSTOM ENGINEERING REQUEST
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Submit Custom Project Brief</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Title</label>
            <input
              type="text"
              placeholder="e.g. 3D WebGL Product Configurator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="3D WebGL">3D WebGL</option>
                <option value="SaaS Platform">SaaS Platform</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Mobile App">Mobile App</option>
                <option value="AI & ML">AI & ML</option>
                <option value="Fintech">Fintech</option>
                <option value="Creative Portfolio">Creative Portfolio</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Requirements & Tech Stack</label>
            <textarea
              rows={4}
              placeholder="Describe your desired feature specifications, design guidelines, and reference links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center space-x-1 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending…' : 'Submit Request to Admin'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
